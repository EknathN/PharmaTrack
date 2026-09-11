"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { parseUnitBarcode, ParsedUnitBarcode } from "@/lib/barcodeHelper";

interface BarcodeScannerProps {
  label?: string;
  onScanned: (value: string) => void;
  onParsedBarcode?: (parsed: ParsedUnitBarcode) => void;
  placeholder?: string;
}

/**
 * Dedicated 1D Unit Barcode Scanner Component.
 * Optimized specifically for Code 128 barcodes engraved on medicine packaging.
 * Silent (zero audio/chimes), continuous auto-focus, high FPS, with torch support.
 */
export default function BarcodeScanner({
  label = "1D Unit Barcode Scanner",
  onScanned,
  onParsedBarcode,
  placeholder = "e.g. EB-... or B1803-M2609E2809-01",
}: BarcodeScannerProps) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState('');
  const [lastScanned, setLastScanned] = useState<ParsedUnitBarcode | null>(null);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [successFlash, setSuccessFlash] = useState(false);

  const scannerRef = useRef<any>(null);
  const divId = useRef(`barcode-scanner-${Math.random().toString(36).substring(2)}`);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
    }
    setTorchOn(false);
    setHasTorch(false);
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn("Flashlight toggle error:", e);
    }
  };

  const handleDetected = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Silent visual flash feedback
    setSuccessFlash(true);
    setTimeout(() => setSuccessFlash(false), 800);

    // Subtle silent haptic vibration if supported (no audio)
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(35);
      }
    } catch (e) {}

    const parsed = parseUnitBarcode(trimmed, 'retailer');
    setLastScanned(parsed);
    setInputVal(parsed.raw || trimmed);
    stopCamera();

    if (onParsedBarcode) {
      onParsedBarcode(parsed);
    }
    onScanned(parsed.raw || trimmed);
  }, [onParsedBarcode, onScanned, stopCamera]);

  const startCamera = async () => {
    setError('');
    await stopCamera();
    setCameraOpen(true);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      // High-speed 1D barcode engine: Code 128 & Code 39 with hardware acceleration
      const scanner = new Html5Qrcode(divId.current, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
        ],
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });
      scannerRef.current = scanner;

      // HD resolution + continuous autofocus
      const videoConstraints: any = {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        advanced: [{ focusMode: 'continuous' } as any]
      };

      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        // Generous horizontal target slot for effortless aiming
        const boxWidth = Math.min(Math.floor(viewfinderWidth * 0.92), 400);
        return {
          width: Math.floor(boxWidth),
          height: Math.min(Math.floor(boxWidth * 0.52), 220)
        };
      };

      try {
        await scanner.start(
          videoConstraints,
          {
            fps: 25,
            qrbox: qrboxFunction,
            aspectRatio: 1.777778,
            disableFlip: false,
          },
          (decodedText: string) => {
            handleDetected(decodedText);
          },
          () => {}
        );
      } catch (firstErr) {
        // Fallback for simpler camera constraint support
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 20,
            qrbox: qrboxFunction,
          },
          (decodedText: string) => {
            handleDetected(decodedText);
          },
          () => {}
        );
      }

      // Check for torch capability
      try {
        const capabilities = scanner.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        }
      } catch (e) {}

    } catch (err: any) {
      console.error("Barcode camera error:", err);
      setError('Camera could not be started. Please check permissions or enter barcode manually.');
      setCameraOpen(false);
    }
  };

  return (
    <div className={`space-y-3 bg-white p-4 rounded-2xl border transition-all ${
      successFlash ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/20' : 'border-slate-200 shadow-xs'
    }`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <span>🏷️</span>
            <span>{label}</span>
          </label>
          <p className="text-[11px] text-slate-500">
            Dedicated Code 128 scanner for engraved medicine packaging barcodes.
          </p>
        </div>

        {!cameraOpen ? (
          <button
            type="button"
            onClick={startCamera}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <span>📷</span>
            <span>Open Barcode Camera</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {hasTorch && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all ${
                  torchOn
                    ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>{torchOn ? '🔦 Flash ON' : '💡 Flash OFF'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-medium transition-colors"
            >
              ✕ Close
            </button>
          </div>
        )}
      </div>

      {cameraOpen && (
        <div className="space-y-2.5">
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-950 shadow-inner">
            <div id={divId.current} className="w-full min-h-[240px] flex items-center justify-center">
              <p className="text-slate-400 text-xs py-8 animate-pulse">Starting high-speed barcode sensor...</p>
            </div>

            {/* Red Laser Aiming Guide Line */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-4/5 h-0.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-pulse" />
            </div>

            {/* Top Indicator */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-600 text-white shadow-md">
                🏷️ Center Barcode on Red Line
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-900/80 text-slate-200 backdrop-blur-xs">
                Silent Mode • HD
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            Hold camera ~10-15cm away from the medicine bottle or strip barcode.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

      {/* Manual Input Form */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={() => handleDetected(inputVal)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          Apply ↵
        </button>
      </div>

      {/* Last Scanned Preview */}
      {lastScanned && (
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
          <div className="flex items-center justify-between font-bold text-[11px] text-emerald-900">
            <span>✓ Barcode Captured</span>
            <span className="bg-white px-2 py-0.5 rounded font-mono text-[10px] text-emerald-800 border border-emerald-200">
              Unit #{lastScanned.unitSerial || '01'}
            </span>
          </div>
          <div className="font-mono text-[11px] break-all bg-white/80 p-1 rounded border border-emerald-100">
            {lastScanned.raw}
          </div>
          <div className="flex justify-between text-[11px] text-slate-600">
            <span>MFG: <strong>{lastScanned.mfgDate || 'N/A'}</strong></span>
            <span>EXP: <strong>{lastScanned.expDate || 'N/A'}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

