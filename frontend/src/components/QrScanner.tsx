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
}

export default function QrScanner({
  label,
  onScanned,
  onDualScanned,
  placeholder,
  expectedBatchNumber,
  expectedMfgDate,
  expectedExpDate,
}: QrScannerProps) {
  const [mode, setMode] = useState<'camera' | 'text'>('text');
  const [dualScanMode, setDualScanMode] = useState(true);
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

  // Keep latest state in ref for camera callback
  const scanStateRef = useRef({
    detectedQr,
    detectedBarcode,
    dualScanMode,
    onScanned,
    onDualScanned,
    expectedBatchNumber,
    expectedMfgDate,
    expectedExpDate,
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
    };
  }, [detectedQr, detectedBarcode, dualScanMode, onScanned, onDualScanned, expectedBatchNumber, expectedMfgDate, expectedExpDate]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop?.().catch(() => {});
      }
      if (autoAllocateTimerRef.current) {
        clearTimeout(autoAllocateTimerRef.current);
      }
    };
  }, []);

  // Final allocation dispatcher
  const performAllocation = useCallback((
    qr: ParsedBatchQr | null,
    bc: ParsedUnitBarcode | null,
    rawFallback?: string
  ) => {
    const isDual = !!(qr && bc);
    let isTampered = false;
    let notice = '';

    // Compare MFG & EXP dates if both or expected dates exist
    const qMfg = qr?.mfgDate || scanStateRef.current.expectedMfgDate;
    const qExp = qr?.expDate || scanStateRef.current.expectedExpDate;
    const bMfg = bc?.mfgDate;
    const bExp = bc?.expDate;

    if (bMfg || bExp) {
      const check = compareQrAndBarcodeDates(qMfg, qExp, bMfg, bExp);
      isTampered = !check.isMatch;
      notice = check.notice;
    } else if (isDual) {
      notice = '✓ Dual scan verified: Batch QR and Unit Barcode linked.';
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
    if (!trimmed) return;

    // Check if code is a 1D unit barcode (starts with BC- or matches unit regex)
    const isBarcodeLike = trimmed.toUpperCase().startsWith('BC-') || /^BC-[A-Z0-9-]+/i.test(trimmed);
    const parsedBc = isBarcodeLike ? parseUnitBarcode(trimmed) : null;
    const parsedQr = !parsedBc?.isValid ? parseBatchQr(trimmed) : null;

    const currentQr = scanStateRef.current.detectedQr;
    const currentBc = scanStateRef.current.detectedBarcode;

    if (parsedBc?.isValid) {
      setDetectedBarcode(parsedBc);
      setBarcodeInput(parsedBc.raw);

      // Check anti-fraud date match against existing QR or expected dates
      const qMfg = currentQr?.mfgDate || scanStateRef.current.expectedMfgDate;
      const qExp = currentQr?.expDate || scanStateRef.current.expectedExpDate;
      const check = compareQrAndBarcodeDates(qMfg, qExp, parsedBc.mfgDate, parsedBc.expDate);
      
      setTamperStatus({
        checked: true,
        isTampered: !check.isMatch,
        notice: check.notice,
      });

      if (currentQr || !scanStateRef.current.dualScanMode) {
        // Both codes present or single mode -> allocate
        setAutoAllocating(true);
        setTimeout(() => {
          performAllocation(currentQr, parsedBc, trimmed);
          setAutoAllocating(false);
        }, 500);
      } else {
        // Wait for companion QR or allow auto-allocate after brief window
        if (autoAllocateTimerRef.current) clearTimeout(autoAllocateTimerRef.current);
        autoAllocateTimerRef.current = setTimeout(() => {
          performAllocation(null, parsedBc, trimmed);
        }, 2200);
      }
      return;
    }

    if (parsedQr?.isBatchQr) {
      setDetectedQr(parsedQr);
      setValue(parsedQr.batchId || trimmed);

      // Check anti-fraud date match against existing Barcode
      if (currentBc?.mfgDate || currentBc?.expDate) {
        const check = compareQrAndBarcodeDates(parsedQr.mfgDate, parsedQr.expDate, currentBc.mfgDate, currentBc.expDate);
        setTamperStatus({
          checked: true,
          isTampered: !check.isMatch,
          notice: check.notice,
        });
      }

      if (currentBc || !scanStateRef.current.dualScanMode) {
        // Both codes present or single mode -> allocate
        setAutoAllocating(true);
        setTimeout(() => {
          performAllocation(parsedQr, currentBc, trimmed);
          setAutoAllocating(false);
        }, 500);
      } else {
        // Wait for companion Barcode or auto-allocate after brief window
        if (autoAllocateTimerRef.current) clearTimeout(autoAllocateTimerRef.current);
        autoAllocateTimerRef.current = setTimeout(() => {
          performAllocation(parsedQr, null, trimmed);
        }, 2200);
      }
      return;
    }

    // Generic string (e.g. batch ID, shipment number)
    setValue(trimmed);
    performAllocation(null, null, trimmed);
  }, [performAllocation]);

  const startCamera = async () => {
    setError('');
    setScanning(true);
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {}
      }

      // Configure multi-format scanner: both 2D QR and 1D Code-128 / Barcodes
      const scanner = new Html5Qrcode(divId.current, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
        ],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 280, height: 260 } },
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

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stop?.().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleManualApply = () => {
    if (value.trim()) {
      handleDetectedCode(value);
    }
    if (barcodeInput.trim()) {
      handleDetectedCode(barcodeInput);
    }
  };

  const resetDetections = () => {
    setDetectedQr(null);
    setDetectedBarcode(null);
    setTamperStatus(null);
    setValue('');
    setBarcodeInput('');
    if (autoAllocateTimerRef.current) clearTimeout(autoAllocateTimerRef.current);
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
            Simultaneously detects 2D Batch QR &amp; 1D Engraved Unit Barcodes with anti-fraud date validation.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dual Scan Mode Toggle */}
          <button
            type="button"
            onClick={() => setDualScanMode(!dualScanMode)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 ${
              dualScanMode
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-slate-100 text-slate-600'
            }`}
            title="Scan both Batch QR and Unit Barcode together"
          >
            <span>⚡</span>
            <span>{dualScanMode ? 'Dual Scan ON' : 'Dual Scan OFF'}</span>
          </button>

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
            <div id={divId.current} className="w-full min-h-[260px] flex items-center justify-center">
              {!scanning && <p className="text-slate-400 text-xs py-10">Starting multi-format camera engine...</p>}
            </div>

            {/* Live Dual Detection HUD Overlay */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <div className="flex gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-xs ${
                  detectedQr ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-slate-300 border border-slate-700'
                }`}>
                  {detectedQr ? '✓ QR READY' : '⏳ SCAN QR'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-xs ${
                  detectedBarcode ? 'bg-emerald-500 text-white' : 'bg-slate-800/80 text-slate-300 border border-slate-700'
                }`}>
                  {detectedBarcode ? '✓ BARCODE READY' : '⏳ SCAN BARCODE'}
                </span>
              </div>

              {autoAllocating && (
                <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold animate-pulse">
                  ⚡ Auto-Allocating...
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
              {(detectedQr || detectedBarcode) && (
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
                    onClick={() => performAllocation(detectedQr, detectedBarcode)}
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

      {/* Manual Input Fields (Supports either or both) */}
      <div className="space-y-2">
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
                if (p.isBatchQr) setDetectedQr(p);
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
                const bc = parseUnitBarcode(e.target.value);
                if (bc.isValid) setDetectedBarcode(bc);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono text-xs bg-slate-50 text-slate-800"
              placeholder="e.g. BC-BN...-M260910-E260912-0001"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleManualApply}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Apply &amp; Allocate Details ↵
          </button>
        </div>
      </div>

      {/* ─── LIVE ALLOCATED DETAILS & ANTI-FRAUD DISPLAY ─── */}
      {(detectedQr || detectedBarcode || tamperStatus) && (
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
      )}
    </div>
  );
}
