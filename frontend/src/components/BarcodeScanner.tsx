"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { parseUnitBarcode, ParsedUnitBarcode } from "@/lib/barcodeHelper";

interface BarcodeScannerProps {
  label?: string;
  onScanned: (value: string) => void;
  onParsedBarcode?: (parsed: ParsedUnitBarcode) => void;
  placeholder?: string;
}

/** Play a short synthetic confirmation chime upon successful barcode scan */
function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.15); // C6
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {}
}

/**
 * Dedicated 1D Unit Barcode Scanner Component.
 * Specifically configured for Code 128 barcodes (EB-..., B-..., BC-...) engraved on medicine packaging.
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

  const scannerRef = useRef<any>(null);
  const divId = useRef(`barcode-scanner-${Math.random().toString(36).substring(2)}`);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch (e) {}
      scannerRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleDetected = useCallback((raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const parsed = parseUnitBarcode(trimmed, 'retailer');
    setLastScanned(parsed);
    setInputVal(parsed.raw || trimmed);
    playSuccessChime();
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

      // Pure 1D Code 128 decoding: maximum speed, zero 2D matrix overhead
      const scanner = new Html5Qrcode(divId.current, {
        formatsToSupport: [Html5QrcodeSupportedFormats.CODE_128],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 20 },
        (decodedText: string) => {
          handleDetected(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      console.error("Barcode camera error:", err);
      setError('Camera could not be started. Please check permissions or enter barcode manually.');
      setCameraOpen(false);
    }
  };

  return (
    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
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

        {!cameraOpen && (
          <button
            type="button"
            onClick={startCamera}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <span>📷</span>
            <span>Open Barcode Camera</span>
          </button>
        )}
      </div>

      {cameraOpen && (
        <div className="space-y-2.5">
          <div className="relative rounded-2xl overflow-hidden border-2 border-slate-800 bg-slate-950 shadow-inner">
            <div id={divId.current} className="w-full min-h-[240px] flex items-center justify-center">
              <p className="text-slate-400 text-xs py-8">Starting barcode camera stream...</p>
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
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-500">
              Hold camera ~10-15cm away from the medicine bottle or strip barcode.
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
