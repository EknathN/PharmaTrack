"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { parseBatchQr, ParsedBatchQr } from "@/lib/qrHelper";
import { parseUnitBarcode, ParsedUnitBarcode, compareQrAndBarcodeDates } from "@/lib/barcodeHelper";

export interface DualScanAllocation {
  rawCode: string;
  batchId?: string;
  batchNumber?: string;
  medicineName?: string;
  packagingType?: string;
  mfgDate?: string;
  expDate?: string;
  unitBarcode?: string;
  unitSerial?: string;
  isDualVerified: boolean;
  isDateTampered: boolean;
  tamperNotice?: string;
  parsedQr?: ParsedBatchQr | null;
  parsedBarcode?: ParsedUnitBarcode | null;
}

interface QrScannerProps {
  label: string;
  onScanned: (value: string) => void;
  onDualScanned?: (allocation: DualScanAllocation) => void;
  placeholder?: string;
  expectedBatchNumber?: string;
  expectedMfgDate?: string;
  expectedExpDate?: string;
  scanType?: 'medicine' | 'shipment';
}

/** Play a synthetic chime upon successful code capture */
function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {}
}

export default function QrScanner({
  label,
  onScanned,
  onDualScanned,
  placeholder,
  expectedBatchNumber,
  expectedMfgDate,
  expectedExpDate,
  scanType = 'medicine',
}: QrScannerProps) {
  const isShipment = scanType === 'shipment';
  const [mode, setMode] = useState<'camera' | 'text'>('text');
  const [dualScanMode, setDualScanMode] = useState(!isShipment);
  const [value, setValue] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  // Live dual scan detections
  const [detectedQr, setDetectedQr] = useState<ParsedBatchQr | null>(null);
  const [detectedBarcode, setDetectedBarcode] = useState<ParsedUnitBarcode | null>(null);
  const [tamperStatus, setTamperStatus] = useState<{
    checked: boolean;
    isTampered: boolean;
    notice: string;
  } | null>(null);
  const [autoAllocating, setAutoAllocating] = useState(false);

  const scannerRef = useRef<any>(null);
  const divId = useRef(`qr-${Math.random().toString(36).substring(2)}`);
  const autoAllocateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep synchronous state in ref so rapid camera frames share the latest data immediately
  const scanStateRef = useRef({
    detectedQr,
    detectedBarcode,
    dualScanMode,
    onScanned,
    onDualScanned,
    expectedBatchNumber,
    expectedMfgDate,
    expectedExpDate,
    isShipment,
    allocated: false,
  });

  useEffect(() => {
    scanStateRef.current = {
      detectedQr,
      detectedBarcode,
      dualScanMode,
      onScanned,
      onDualScanned,
      expectedBatchNumber,
      expectedMfgDate,
      expectedExpDate,
      isShipment,
      allocated: scanStateRef.current.allocated,
    };
  }, [detectedQr, detectedBarcode, dualScanMode, onScanned, onDualScanned, expectedBatchNumber, expectedMfgDate, expectedExpDate, isShipment]);

  const stopCamera = useCallback(() => {
    if (autoAllocateTimerRef.current) {
      clearTimeout(autoAllocateTimerRef.current);
      autoAllocateTimerRef.current = null;
    }
    if (scannerRef.current) {
      scannerRef.current.stop?.().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Final allocation dispatcher
  const performAllocation = useCallback((
    qr: ParsedBatchQr | null,
    bc: ParsedUnitBarcode | null,
    rawFallback?: string
  ) => {
    const isDual = !!(qr && bc);
    let isTampered = false;
    let notice = '';

    // Compare MFG & EXP dates if both exist
    const qMfg = qr?.mfgDate || scanStateRef.current.expectedMfgDate;
    const qExp = qr?.expDate || scanStateRef.current.expectedExpDate;
    const bMfg = bc?.mfgDate;
    const bExp = bc?.expDate;

    if (bMfg || bExp) {
      const check = compareQrAndBarcodeDates(qMfg, qExp, bMfg, bExp);
      isTampered = !check.isMatch;
      notice = check.notice;
    } else if (isDual) {
      notice = '✓ Dual scan verified: Batch QR and Unit Barcode paired.';
    }

    const allocation: DualScanAllocation = {
      rawCode: bc?.raw || qr?.batchId || rawFallback || '',
      batchId: qr?.batchId,
      batchNumber: qr?.batchNo || bc?.batchNumber || scanStateRef.current.expectedBatchNumber,
      medicineName: qr?.medicine,
      mfgDate: bMfg || qMfg,
      expDate: bExp || qExp,
      unitBarcode: bc?.raw,
      unitSerial: bc?.unitSerial,
      isDualVerified: isDual && !isTampered,
      isDateTampered: isTampered,
      tamperNotice: notice,
      parsedQr: qr,
      parsedBarcode: bc,
    };

    setTamperStatus({
      checked: !!(bMfg || bExp || isDual),
      isTampered,
      notice,
    });

    if (scanStateRef.current.onDualScanned) {
      scanStateRef.current.onDualScanned(allocation);
    }

    // Call classic onScanned with most specific identifier
    const targetValue = bc?.raw || qr?.batchId || rawFallback || '';
    if (targetValue) {
      setValue(targetValue);
      scanStateRef.current.onScanned(targetValue);
    }
  }, []);

  // Handle detection from camera or manual entry
  const handleDetectedCode = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || scanStateRef.current.allocated) return;

    // Fast-path for Shipments: Shipments ONLY use QR code (no barcode)
    if (scanStateRef.current.isShipment) {
      scanStateRef.current.allocated = true;
      setValue(trimmed);
      scanStateRef.current.onScanned(trimmed);
      playSuccessChime();
      stopCamera();
      return;
    }

    // Check if code is a unit barcode (encrypted EB-, ultra-compact B-, or BC-)
    const isBarcode = trimmed.toUpperCase().startsWith('EB-') ||
      trimmed.toUpperCase().startsWith('BC-') ||
      trimmed.toUpperCase().startsWith('B') ||
      /^B[A-Z0-9]+-/i.test(trimmed) ||
      /^[A-Z0-9]+-\d+$/i.test(trimmed);

    const parsedBc = isBarcode ? parseUnitBarcode(trimmed, 'retailer') : null;
    const parsedQr = !parsedBc?.isValid ? parseBatchQr(trimmed) : null;

    let updatedQr = scanStateRef.current.detectedQr;
    let updatedBc = scanStateRef.current.detectedBarcode;

    if (parsedBc?.isValid) {
      scanStateRef.current.detectedBarcode = parsedBc;
      updatedBc = parsedBc;
      setDetectedBarcode(parsedBc);
      setBarcodeInput(parsedBc.raw);
    } else if (parsedQr?.isBatchQr) {
      scanStateRef.current.detectedQr = parsedQr;
      updatedQr = parsedQr;
      setDetectedQr(parsedQr);
      setValue(parsedQr.batchId || trimmed);
    } else {
      // Fallback identifier
      setValue(trimmed);
    }

    // Cross-verify dates whenever both are present
    if (updatedQr && updatedBc) {
      const check = compareQrAndBarcodeDates(
        updatedQr.mfgDate || scanStateRef.current.expectedMfgDate,
        updatedQr.expDate || scanStateRef.current.expectedExpDate,
        updatedBc.mfgDate,
        updatedBc.expDate
      );
      setTamperStatus({
        checked: true,
        isTampered: !check.isMatch,
        notice: check.notice,
      });

      // BOTH detected! Finish immediately!
      if (autoAllocateTimerRef.current) clearTimeout(autoAllocateTimerRef.current);
      scanStateRef.current.allocated = true;
      setAutoAllocating(true);
      playSuccessChime();
      setTimeout(() => {
        performAllocation(updatedQr, updatedBc, trimmed);
        setAutoAllocating(false);
        stopCamera();
      }, 350);
      return;
    }

    // If ONLY ONE is detected so far:
    if (autoAllocateTimerRef.current) clearTimeout(autoAllocateTimerRef.current);

    if (!scanStateRef.current.dualScanMode) {
      // Single scan mode: allocate immediately on first hit!
      scanStateRef.current.allocated = true;
      setAutoAllocating(true);
      playSuccessChime();
      setTimeout(() => {
        performAllocation(updatedQr, updatedBc, trimmed);
        setAutoAllocating(false);
        stopCamera();
      }, 350);
    } else {
      // Dual scan mode: start 1.8s timer to allow companion code, but auto-proceed if no second code
      autoAllocateTimerRef.current = setTimeout(() => {
        if (!scanStateRef.current.allocated) {
          scanStateRef.current.allocated = true;
          performAllocation(scanStateRef.current.detectedQr, scanStateRef.current.detectedBarcode, trimmed);
          stopCamera();
        }
      }, 1800);
    }
  }, [performAllocation, stopCamera]);

  const startCamera = async () => {
    setError('');
    setScanning(true);
    scanStateRef.current.allocated = false;

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {}
      }

      // Fast, lightweight 2-format decoding (prevents CPU lag)
      const formatsToSupport = isShipment
        ? [Html5QrcodeSupportedFormats.QR_CODE]
        : [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_128];

      const scanner = new Html5Qrcode(divId.current, {
        formatsToSupport,
        verbose: false,
      });
      scannerRef.current = scanner;

      // Full-frame capture at high frame rate for instant, responsive scanning
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 20 },
        (decodedText: string) => {
          handleDetectedCode(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      console.error("Scanner camera error:", err);
      setError('Camera not accessible. Please use manual entry or check permissions.');
      setScanning(false);
      setMode('text');
    }
  };

  const handleManualApply = () => {
    if (value.trim()) {
      handleDetectedCode(value);
    }
    if (!isShipment && barcodeInput.trim()) {
      handleDetectedCode(barcodeInput);
    }
  };

  const resetDetections = () => {
    if (autoAllocateTimerRef.current) clearTimeout(autoAllocateTimerRef.current);
    scanStateRef.current.detectedQr = null;
    scanStateRef.current.detectedBarcode = null;
    scanStateRef.current.allocated = false;
    setDetectedQr(null);
    setDetectedBarcode(null);
    setTamperStatus(null);
    setValue('');
    setBarcodeInput('');
  };

  return (
    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {label}
          </label>
          <p className="text-[11px] text-slate-500">
            {isShipment
              ? "Align Shipment Consignment QR code within camera viewfinder. (Transport parcel tracking only - no barcode required)"
              : "Point camera at packaging to scan Batch QR and Engraved Unit Barcode with instant auto-allocation."}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dual Scan Mode Toggle: Only applicable for medicine units */}
          {!isShipment && (
            <button
              type="button"
              onClick={() => setDualScanMode(!dualScanMode)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                dualScanMode
                  ? 'bg-purple-100 text-purple-800 border border-purple-200 shadow-xs'
                  : 'bg-slate-100 text-slate-600'
              }`}
              title="Toggle dual scan vs single code scan"
            >
              <span>⚡</span>
              <span>{dualScanMode ? 'Dual Scan ON' : 'Single Scan'}</span>
            </button>
          )}

          {/* Mode switch */}
          <button
            type="button"
            onClick={() => {
              setMode('text');
              stopCamera();
            }}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
              mode === 'text' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⌨️ Manual
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('camera');
              startCamera();
            }}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all flex items-center gap-1 ${
              mode === 'camera' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>📷</span>
            <span>Camera</span>
          </button>
        </div>
      </div>

      {/* Camera Viewfinder */}
      {mode === 'camera' && (
        <div className="space-y-2.5">
          <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 shadow-inner">
            <div id={divId.current} className="w-full min-h-[280px] flex items-center justify-center">
              {!scanning && <p className="text-slate-400 text-xs py-10">Starting fast camera engine...</p>}
            </div>

            {/* Live Detection HUD Overlay Top Bar */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <div className="flex gap-1.5">
                {isShipment ? (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-xs ${
                    value ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-slate-300 border border-slate-700'
                  }`}>
                    {value ? '✓ SHIPMENT QR READY' : '⏳ ALIGN SHIPMENT QR'}
                  </span>
                ) : (
                  <>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-xs transition-colors ${
                      detectedQr ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-slate-300 border border-slate-700'
                    }`}>
                      {detectedQr ? '✓ QR CAPTURED' : '⏳ SCAN QR'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-xs transition-colors ${
                      detectedBarcode ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-slate-300 border border-slate-700'
                    }`}>
                      {detectedBarcode ? '✓ BARCODE CAPTURED' : '⏳ SCAN BARCODE'}
                    </span>
                  </>
                )}
              </div>

              {autoAllocating && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold animate-pulse shadow-md">
                  ⚡ Allocating...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium"
            >
              Stop Camera
            </button>
            <div className="flex items-center gap-2">
              {(detectedQr || detectedBarcode) && !isShipment && (
                <>
                  <button
                    type="button"
                    onClick={resetDetections}
                    className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium"
                  >
                    Clear Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      scanStateRef.current.allocated = true;
                      performAllocation(detectedQr, detectedBarcode);
                      stopCamera();
                    }}
                    className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors"
                  >
                    Allocate Now ↵
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      {/* Manual Input Fields */}
      <div className="space-y-2">
        {isShipment ? (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              📦 Shipment Consignment QR Code / Gatepass ID
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono text-xs bg-slate-50 text-slate-800"
              placeholder={placeholder || "Paste Shipment QR (PHARMATRACK:SHIPMENT:...)"}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                📦 Batch QR Code or Batch ID
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  const p = parseBatchQr(e.target.value);
                  if (p.isBatchQr) {
                    scanStateRef.current.detectedQr = p;
                    setDetectedQr(p);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono text-xs bg-slate-50 text-slate-800"
                placeholder={placeholder || "Paste Batch QR (ptp:batch:...)"}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                🏷️ Engraved Unit Barcode (MFG + EXP)
              </label>
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => {
                  setBarcodeInput(e.target.value);
                  const bc = parseUnitBarcode(e.target.value, 'retailer');
                  if (bc.isValid) {
                    scanStateRef.current.detectedBarcode = bc;
                    setDetectedBarcode(bc);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono text-xs bg-slate-50 text-slate-800"
                placeholder="e.g. EB-... or B1803-M2609E2809-01"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleManualApply}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            {isShipment ? "Apply Shipment QR ↵" : "Apply & Allocate Details ↵"}
          </button>
        </div>
      </div>

      {/* ─── LIVE ALLOCATED DETAILS / SHIPMENT CONFIRMATION DISPLAY ─── */}
      {isShipment ? (
        value && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-blue-950 text-xs">
            <div className="flex items-center justify-between font-bold text-[11px] text-blue-900">
              <span className="flex items-center gap-1.5">
                <span>📦</span>
                <span>Shipment Consignment QR Captured</span>
              </span>
              <code className="bg-white px-2 py-0.5 rounded font-mono text-[11px] text-blue-800 border border-blue-200">
                {value}
              </code>
            </div>
            <p className="text-[11px] text-slate-500">
              ✓ Ready for transport intake verification. (Consignment parcel uses QR code only).
            </p>
          </div>
        )
      ) : (
        (detectedQr || detectedBarcode || tamperStatus) && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {/* Anti-Fraud Date Cross-Verification Banner */}
            {tamperStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs flex items-center justify-between font-medium border ${
                  tamperStatus.isTampered
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{tamperStatus.isTampered ? '🚨' : '🛡️'}</span>
                  <span>{tamperStatus.notice}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  tamperStatus.isTampered ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {tamperStatus.isTampered ? 'Date Tampering Detected' : 'Dates Anti-Tamper Matched'}
                </span>
              </div>
            )}

            {/* Allocation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Batch QR Allocation */}
              {detectedQr && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-blue-950">
                  <div className="flex items-center justify-between font-bold text-[11px] text-blue-900">
                    <span>📦 Batch QR Verified</span>
                    <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[10px] text-blue-800 border border-blue-200">
                      {detectedQr.batchId || detectedQr.batchNo}
                    </code>
                  </div>
                  {detectedQr.medicine && (
                    <div><span className="text-slate-500">Medicine:</span> <strong>{detectedQr.medicine}</strong></div>
                  )}
                  <div className="flex justify-between text-[11px]">
                    <span><span className="text-slate-500">MFG:</span> <strong>{detectedQr.mfgDate || 'N/A'}</strong></span>
                    <span><span className="text-slate-500">EXP:</span> <strong>{detectedQr.expDate || 'N/A'}</strong></span>
                  </div>
                </div>
              )}

              {/* Engraved Barcode Allocation */}
              {detectedBarcode && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
                  <div className="flex items-center justify-between font-bold text-[11px] text-emerald-900">
                    <span>🏷️ Engraved Unit Barcode</span>
                    <span className="bg-white px-1.5 py-0.5 rounded font-mono text-[10px] text-emerald-800 border border-emerald-200">
                      Unit #{detectedBarcode.unitSerial || '1'}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] break-all bg-white/80 p-1 rounded border border-emerald-100">
                    {detectedBarcode.raw}
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span><span className="text-slate-500">Barcode MFG:</span> <strong>{detectedBarcode.mfgDate || 'N/A'}</strong></span>
                    <span><span className="text-slate-500">Barcode EXP:</span> <strong>{detectedBarcode.expDate || 'N/A'}</strong></span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
