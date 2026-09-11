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

/**
 * High-Efficiency QR & Barcode Scanner with dedicated separate scanning modules.
 * Completely silent (no audio beeps) with responsive visual capture feedback.
 */
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

  // For medicines: Separate dedicated scan targets
  const [activeTab, setActiveTab] = useState<'qr' | 'barcode'>('qr');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [error, setError] = useState('');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);

  // Live captured states
  const [detectedQr, setDetectedQr] = useState<ParsedBatchQr | null>(null);
  const [detectedBarcode, setDetectedBarcode] = useState<ParsedUnitBarcode | null>(null);
  const [tamperStatus, setTamperStatus] = useState<{
    checked: boolean;
    isTampered: boolean;
    notice: string;
  } | null>(null);

  const scannerRef = useRef<any>(null);
  const divId = useRef(`qr-scanner-${Math.random().toString(36).substring(2)}`);

  // Ref tracking to avoid closure race conditions across frames
  const stateRef = useRef({
    detectedQr,
    detectedBarcode,
    onScanned,
    onDualScanned,
    expectedBatchNumber,
    expectedMfgDate,
    expectedExpDate,
    isShipment,
    activeTab,
  });

  useEffect(() => {
    stateRef.current = {
      detectedQr,
      detectedBarcode,
      onScanned,
      onDualScanned,
      expectedBatchNumber,
      expectedMfgDate,
      expectedExpDate,
      isShipment,
      activeTab,
    };
  }, [detectedQr, detectedBarcode, onScanned, onDualScanned, expectedBatchNumber, expectedMfgDate, expectedExpDate, isShipment, activeTab]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
    }
    setCameraOpen(false);
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Silent visual & haptic confirmation (zero audio sounds)
  const triggerSilentSuccess = useCallback(() => {
    setSuccessFlash(true);
    setTimeout(() => setSuccessFlash(false), 500);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch (e) {}
    }
  }, []);

  // Performs final allocation to parent component
  const performAllocation = useCallback((
    qr: ParsedBatchQr | null,
    bc: ParsedUnitBarcode | null,
    rawFallback?: string
  ) => {
    const isDual = !!(qr && bc);
    let isTampered = false;
    let notice = '';

    const qMfg = qr?.mfgDate || stateRef.current.expectedMfgDate;
    const qExp = qr?.expDate || stateRef.current.expectedExpDate;
    const bMfg = bc?.mfgDate;
    const bExp = bc?.expDate;

    if (bMfg || bExp) {
      const check = compareQrAndBarcodeDates(qMfg, qExp, bMfg, bExp);
      isTampered = !check.isMatch;
      notice = check.notice;
    } else if (isDual) {
      notice = '✓ Dual scan verified: Batch QR and Unit Barcode paired successfully.';
    }

    const allocation: DualScanAllocation = {
      rawCode: bc?.raw || qr?.batchId || rawFallback || '',
      batchId: qr?.batchId,
      batchNumber: qr?.batchNo || bc?.batchNumber || stateRef.current.expectedBatchNumber,
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

    if (stateRef.current.onDualScanned) {
      stateRef.current.onDualScanned(allocation);
    }

    const targetValue = bc?.raw || qr?.batchId || rawFallback || '';
    if (targetValue) {
      stateRef.current.onScanned(targetValue);
    }
  }, []);

  // Handle incoming code from either QR or Barcode scanner
  const handleCodeDetected = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    triggerSilentSuccess();

    // Shipment QR fast-path
    if (stateRef.current.isShipment) {
      setQrInput(trimmed);
      stopCamera();
      stateRef.current.onScanned(trimmed);
      return;
    }

    // Determine target from active tab
    if (stateRef.current.activeTab === 'barcode') {
      const parsed = parseUnitBarcode(trimmed, 'retailer');
      setDetectedBarcode(parsed);
      setBarcodeInput(parsed.raw || trimmed);
      stopCamera();

      // If Batch QR was already captured, pair them immediately!
      if (stateRef.current.detectedQr) {
        performAllocation(stateRef.current.detectedQr, parsed, trimmed);
      }
    } else {
      // QR scanner tab
      const parsed = parseBatchQr(trimmed);
      setDetectedQr(parsed);
      setQrInput(parsed.batchId || trimmed);
      stopCamera();

      // If Unit Barcode was already captured, pair them immediately!
      if (stateRef.current.detectedBarcode) {
        performAllocation(parsed, stateRef.current.detectedBarcode, trimmed);
      }
    }
  }, [performAllocation, stopCamera, triggerSilentSuccess]);

  // Launches high-efficiency camera dedicated strictly to the active code type
  const startCamera = async (target: 'qr' | 'barcode') => {
    setError('');
    await stopCamera();
    setCameraOpen(true);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      // Pure single-format selection:
      // - QR Scanner: strictly QR_CODE
      // Dynamic single-format decoders to avoid frame rate bottlenecks:
      // - QR Scanner: strictly QR_CODE
      // - Barcode Scanner: CODE_128 & CODE_39
      const formatsToSupport = target === 'barcode'
        ? [Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39]
        : [Html5QrcodeSupportedFormats.QR_CODE];

      const scanner = new Html5Qrcode(divId.current, {
        formatsToSupport,
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = scanner;

      // High-efficiency viewfinder box tailored per format:
      // - Barcode: generous horizontal slot for effortless line alignment
      // - QR Code: square 1:1 box (centers matrix)
      const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => {
        if (target === 'barcode') {
          return {
            width: Math.min(Math.floor(viewfinderWidth * 0.92), 400),
            height: Math.min(Math.floor(viewfinderHeight * 0.55), 200),
          };
        }
        const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.72;
        return {
          width: Math.floor(edge),
          height: Math.floor(edge),
        };
      };

      // 720p HD resolution + continuous auto-focus for sharp line contrast
      const cameraConfig: any = {
        facingMode: 'environment',
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        advanced: [{ focusMode: 'continuous' }],
      };

      await scanner.start(
        cameraConfig,
        { fps: 20, qrbox },
        (decodedText: string) => {
          handleCodeDetected(decodedText);
        },
        () => {}
      );

      // Check torch capability
      try {
        const capabilities = scanner.getRunningTrackCapabilities() as any;
        setHasTorch(!!(capabilities && capabilities.torch));
      } catch (e) {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.warn("Primary camera start failed, attempting fallback:", err);
      // Fallback with standard constraints
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        const formatsToSupport = target === 'barcode'
          ? [Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39]
          : [Html5QrcodeSupportedFormats.QR_CODE];

        const fallbackScanner = new Html5Qrcode(divId.current, {
          formatsToSupport,
          verbose: false,
        });
        scannerRef.current = fallbackScanner;

        await fallbackScanner.start(
          { facingMode: 'environment' },
          { fps: 20 },
          (decodedText: string) => {
            handleCodeDetected(decodedText);
          },
          () => {}
        );
      } catch (fallbackErr: any) {
        console.error("Camera fallback failed:", fallbackErr);
        setError('Camera could not be accessed. Please check permissions or enter code manually.');
        setCameraOpen(false);
      }
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as any],
      });
      setTorchOn(nextTorch);
    } catch (e) {}
  };

  const handleManualApply = () => {
    if (activeTab === 'qr' && qrInput.trim()) {
      handleCodeDetected(qrInput);
    } else if (activeTab === 'barcode' && barcodeInput.trim()) {
      handleCodeDetected(barcodeInput);
    }
  };

  const resetDetections = () => {
    setDetectedQr(null);
    setDetectedBarcode(null);
    setTamperStatus(null);
    setQrInput('');
    setBarcodeInput('');
  };

  return (
    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            {label}
          </label>
          <p className="text-[11px] text-slate-500">
            {isShipment
              ? "Dedicated Shipment QR Scanner (Transport parcel tracking - no barcode required)."
              : "Dedicated separate scanners for 2D Batch QR and 1D Unit Barcode."}
          </p>
        </div>

        {/* Action button if code already scanned */}
        {(detectedQr || detectedBarcode) && !isShipment && (
          <button
            type="button"
            onClick={resetDetections}
            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
          >
            Clear Scans
          </button>
        )}
      </div>

      {/* For Medicines: Separate Dedicated Tabs */}
      {!isShipment && (
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {/* Tab 1: 2D Batch QR Scanner */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('qr');
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'qr'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📦 1. Batch QR Scanner</span>
            {detectedQr ? (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                ✓ Scanned
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Step 1</span>
            )}
          </button>

          {/* Tab 2: 1D Unit Barcode Scanner */}
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('barcode');
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'barcode'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🏷️ 2. Unit Barcode Scanner</span>
            {detectedBarcode ? (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                ✓ Scanned
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Step 2</span>
            )}
          </button>
        </div>
      )}

      {/* Camera Live Viewfinder */}
      {cameraOpen && (
        <div className="space-y-2.5">
          <div className={`relative rounded-2xl overflow-hidden border-2 bg-slate-950 shadow-inner transition-colors duration-300 ${
            successFlash ? 'border-emerald-400 ring-4 ring-emerald-400/40' : 'border-slate-800'
          }`}>
            <div id={divId.current} className="w-full min-h-[260px] flex items-center justify-center">
              <p className="text-slate-400 text-xs py-8">Starting camera stream...</p>
            </div>

            {/* Target Guidance Banner */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold shadow-md ${
                activeTab === 'barcode' && !isShipment
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}>
                {isShipment
                  ? '📦 Point at Shipment QR Code'
                  : activeTab === 'barcode'
                  ? '🏷️ Align Barcode Within Center Box'
                  : '📦 Point at 2D Batch QR Code'}
              </span>

              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className="pointer-events-auto px-2.5 py-1 bg-slate-900/90 text-amber-300 hover:text-amber-200 border border-slate-700 rounded-full text-xs font-bold shadow-sm transition-all"
                >
                  {torchOn ? '🔦 Flash ON' : '🔦 Flash OFF'}
                </button>
              )}
            </div>

            {/* Red Laser Aiming Guide for Barcode Scanner */}
            {activeTab === 'barcode' && !isShipment && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-3/4 h-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)] opacity-90" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500">
              {activeTab === 'barcode'
                ? 'Center the barcode lines inside the horizontal targeting box.'
                : 'Hold the QR code steady in front of the lens.'}
            </p>
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-medium transition-colors"
            >
              Close Camera
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      {/* Dedicated Scanner Launchers & Inputs */}
      {!cameraOpen && (
        <div className="space-y-3">
          {(isShipment || activeTab === 'qr') ? (
            /* 📦 Dedicated QR Scanner View */
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <span>📦</span>
                    <span>{isShipment ? "Shipment Consignment QR Scanner" : "2D Batch QR Scanner"}</span>
                  </h4>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    {isShipment
                      ? "Scans shipment crate gatepass QR (PHARMATRACK:SHIPMENT:...)"
                      : "Scans pharmaceutical batch provenance QR code."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startCamera('qr')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <span>📷</span>
                  <span>Open QR Camera</span>
                </button>
              </div>

              {/* Manual input fallback */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder={placeholder || (isShipment ? "Paste Shipment QR (PHARMATRACK:SHIPMENT:...)" : "Paste Batch QR (PHARMATRACK:BATCH:...)")}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl font-mono text-slate-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={handleManualApply}
                  className="px-3 py-2 bg-white hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Apply ↵
                </button>
              </div>
            </div>
          ) : (
            /* 🏷️ Dedicated Unit Barcode Scanner View */
            <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>🏷️</span>
                    <span>1D Unit Barcode Scanner</span>
                  </h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Scans engraved Code 128 barcode on bottle / strip (EB-... or B...).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startCamera('barcode')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <span>📷</span>
                  <span>Open Barcode Camera</span>
                </button>
              </div>

              {/* Manual input fallback */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Paste or enter Barcode (e.g. EB-... or B1803-...)"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-emerald-200 rounded-xl font-mono text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={handleManualApply}
                  className="px-3 py-2 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Apply ↵
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── LIVE STATUS & SUMMARY OVERVIEW CARDS ─── */}
      {(detectedQr || detectedBarcode || tamperStatus || (isShipment && qrInput)) && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {/* Anti-Fraud Date Cross-Verification Banner */}
          {tamperStatus && !isShipment && (
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

          {/* Cards for Scanned Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Batch QR Details */}
            {detectedQr && !isShipment && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-blue-950">
                <div className="flex items-center justify-between font-bold text-[11px] text-blue-900">
                  <span>📦 1. Batch QR Verified</span>
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

            {/* Unit Barcode Details */}
            {detectedBarcode && !isShipment && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1 text-emerald-950">
                <div className="flex items-center justify-between font-bold text-[11px] text-emerald-900">
                  <span>🏷️ 2. Unit Barcode Verified</span>
                  <span className="bg-white px-1.5 py-0.5 rounded font-mono text-[10px] text-emerald-800 border border-emerald-200">
                    Unit #{detectedBarcode.unitSerial || '01'}
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

            {/* Shipment QR Details */}
            {isShipment && qrInput && (
              <div className="sm:col-span-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1 text-blue-950">
                <div className="flex items-center justify-between font-bold text-[11px] text-blue-900">
                  <span>📦 Shipment QR Code Captured</span>
                  <code className="bg-white px-2 py-0.5 rounded font-mono text-[11px] text-blue-800 border border-blue-200">
                    {qrInput}
                  </code>
                </div>
                <p className="text-[11px] text-slate-500">
                  ✓ Ready for consignment intake verification.
                </p>
              </div>
            )}
          </div>

          {/* Allocation Action Button */}
          {!isShipment && (detectedQr || detectedBarcode) && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => performAllocation(detectedQr, detectedBarcode, qrInput || barcodeInput)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                {detectedQr && detectedBarcode ? "✓ Allocate Dual-Verified Details ↵" : "Allocate Scanned Code ↵"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
