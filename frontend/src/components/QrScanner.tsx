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
  const multiScanTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    if (multiScanTimerRef.current) {
      clearInterval(multiScanTimerRef.current);
      multiScanTimerRef.current = null;
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
      notice = '✓ Dual scan verified: Batch QR and Unit Barcode paired simultaneously.';
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
      /^B[A-Z0-9]+-/i.test(trimmed) ||
      /^[A-Z0-9]+-\d+$/i.test(trimmed);

    const parsedBc = isBarcode ? parseUnitBarcode(trimmed, 'retailer') : null;
    const parsedQr = !parsedBc?.isValid ? parseBatchQr(trimmed) : null;

    let updatedQr = scanStateRef.current.detectedQr;
    let updatedBc = scanStateRef.current.detectedBarcode;

    if (parsedBc?.isValid) {
      // Synchronously update ref so next code in same tick has latest value
      scanStateRef.current.detectedBarcode = parsedBc;
      updatedBc = parsedBc;
      setDetectedBarcode(parsedBc);
      setBarcodeInput(parsedBc.raw);
    }

    if (parsedQr?.isBatchQr) {
      // Synchronously update ref
      scanStateRef.current.detectedQr = parsedQr;
      updatedQr = parsedQr;
      setDetectedQr(parsedQr);
      setValue(parsedQr.batchId || trimmed);
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

      // BOTH detected simultaneously!
      if (scanStateRef.current.dualScanMode && !scanStateRef.current.allocated) {
        scanStateRef.current.allocated = true;
        setAutoAllocating(true);
        playSuccessChime();
        setTimeout(() => {
          performAllocation(updatedQr, updatedBc, trimmed);
          setAutoAllocating(false);
          stopCamera();
        }, 400);
        return;
      }
    }

    // If dualScanMode is turned OFF (single scan), allocate on whichever matches
    if (!scanStateRef.current.dualScanMode && !scanStateRef.current.allocated) {
      if (updatedBc || updatedQr) {
        scanStateRef.current.allocated = true;
        setAutoAllocating(true);
        playSuccessChime();
        setTimeout(() => {
          performAllocation(updatedQr, updatedBc, trimmed);
          setAutoAllocating(false);
          stopCamera();
        }, 400);
      }
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

      // Wide dynamic scanning region to cover both side-by-side QR and Barcode
      const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => {
        if (isShipment) {
          const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.75;
          return { width: Math.floor(edge), height: Math.floor(edge) };
        }
        return {
          width: Math.floor(Math.min(viewfinderWidth * 0.95, 620)),
          height: Math.floor(Math.min(viewfinderHeight * 0.85, 420)),
        };
      };

      const formatsToSupport = isShipment
        ? [Html5QrcodeSupportedFormats.QR_CODE]
        : [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
          ];

      const scanner = new Html5Qrcode(divId.current, {
        formatsToSupport,
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 20, qrbox },
        (decodedText: string) => {
          handleDetectedCode(decodedText);
        },
        () => {}
      );

      // SIMULTANEOUS MULTI-BARCODE SCANNER ENGINE:
      // Uses the browser's native BarcodeDetector API if available (Chrome, Edge, Android)
      // to detect BOTH 2D QR and 1D Barcode in the exact same frame simultaneously!
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window && !isShipment) {
        try {
          const BarcodeDetectorClass = (window as any).BarcodeDetector;
          const detector = new BarcodeDetectorClass({
            formats: ['qr_code', 'code_128', 'ean_13', 'code_39', 'upc_a'],
          });

          multiScanTimerRef.current = setInterval(async () => {
            if (scanStateRef.current.allocated) return;
            const videoEl = document.querySelector(`#${divId.current} video`) as HTMLVideoElement | null;
            if (!videoEl || videoEl.readyState < 2 || videoEl.paused) return;

            try {
              const detectedCodes = await detector.detect(videoEl);
              if (detectedCodes && detectedCodes.length > 0) {
                for (const item of detectedCodes) {
                  if (item.rawValue) {
                    handleDetectedCode(item.rawValue);
                  }
                }
              }
            } catch (err) {}
          }, 100);
        } catch (e) {}
      }
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
              : "Point camera to scan BOTH 2D Batch QR and 1D Engraved Unit Barcode simultaneously with anti-tamper date check."}
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
              title="Toggle simultaneous dual scanning of QR and Barcode"
            >
              <span>⚡</span>
              <span>{dualScanMode ? 'Dual Scan ON (Both Codes)' : 'Single Scan'}</span>
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
              {!scanning && <p className="text-slate-400 text-xs py-10">Starting multi-format camera engine...</p>}
            </div>

            {/* Visual Dual-Targeting Guidance Overlay for Medicine Stickers */}
            {!isShipment && scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-3">
                <div className="w-full h-full max-w-[460px] max-h-[200px] border border-dashed border-emerald-400/40 rounded-2xl flex items-center justify-between px-4 py-3 bg-emerald-950/10 backdrop-blur-[1px]">
                  {/* Left target zone: 2D QR */}
                  <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 flex flex-col items-center justify-center text-center p-2 transition-all duration-300 ${
                    detectedQr
                      ? 'border-emerald-400 bg-emerald-500/40 text-white shadow-lg shadow-emerald-500/30'
                      : 'border-blue-400/70 bg-slate-900/60 text-blue-200'
                  }`}>
                    <span className="text-xl">{detectedQr ? '✓' : '⛶'}</span>
                    <span className="text-[10px] uppercase font-bold mt-1">2D Batch QR</span>
                    <span className="text-[9px] opacity-80">{detectedQr ? 'Captured' : 'Left Side'}</span>
                  </div>

                  <div className="text-white/60 font-bold text-sm">
                    {detectedQr && detectedBarcode ? '⚡' : '+'}
                  </div>

                  {/* Right target zone: 1D Barcode */}
                  <div className={`w-32 h-20 sm:w-36 sm:h-24 rounded-xl border-2 flex flex-col items-center justify-center text-center p-2 transition-all duration-300 ${
                    detectedBarcode
                      ? 'border-emerald-400 bg-emerald-500/40 text-white shadow-lg shadow-emerald-500/30'
                      : 'border-amber-400/70 bg-slate-900/60 text-amber-200'
                  }`}>
                    <span className="text-lg">{detectedBarcode ? '✓' : '|||||'}</span>
                    <span className="text-[10px] uppercase font-bold mt-1">1D Unit Barcode</span>
                    <span className="text-[9px] opacity-80">{detectedBarcode ? 'Captured' : 'Right Side'}</span>
                  </div>
                </div>
              </div>
            )}

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
                      {detectedQr ? '✓ QR READY' : '⏳ 1. SCAN QR'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-xs transition-colors ${
                      detectedBarcode ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-slate-300 border border-slate-700'
                    }`}>
                      {detectedBarcode ? '✓ BARCODE READY' : '⏳ 2. SCAN BARCODE'}
                    </span>
                  </>
                )}
              </div>

              {autoAllocating && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold animate-pulse shadow-md">
                  ⚡ Allocating Both Details...
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
