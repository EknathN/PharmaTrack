"use client";

import { useState, useRef, useEffect } from "react";
import { parseBatchQr, ParsedBatchQr } from "@/lib/qrHelper";

interface QrScannerProps {
  label: string;
  onScanned: (value: string) => void;
  placeholder?: string;
}

export default function QrScanner({ label, onScanned, placeholder }: QrScannerProps) {
  const [mode, setMode] = useState<'text' | 'camera'>('text');
  const [value, setValue] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [batchPreview, setBatchPreview] = useState<ParsedBatchQr | null>(null);
  const scannerRef = useRef<any>(null);
  const divId = useRef(`qr-${Math.random().toString(36).substring(2)}`);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop?.().catch(() => {});
      }
    };
  }, []);

  const processInput = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Check if scanned/entered text is a batch QR containing Batch ID
    const parsed = parseBatchQr(trimmed);
    if (parsed.isBatchQr && parsed.batchId) {
      setBatchPreview(parsed);
      setValue(parsed.batchId);
      onScanned(parsed.batchId);
      return;
    }

    // Default for shipment QRs or plain IDs
    setBatchPreview(null);
    setValue(trimmed);
    onScanned(trimmed);
  };

  const startCamera = async () => {
    setError('');
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(divId.current);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          processInput(decodedText);
          scanner.stop();
          setScanning(false);
        },
        () => {}
      );
    } catch (err: any) {
      setError('Camera not available. Please use manual entry below.');
      setScanning(false);
      setMode('text');
    }
  };

  const stopCamera = () => {
    scannerRef.current?.stop?.().catch(() => {});
    setScanning(false);
  };

  const handleManualSubmit = () => {
    if (value.trim()) processInput(value);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      
      <div className="flex gap-2 mb-3">
        <button type="button" onClick={() => { setMode('text'); stopCamera(); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${mode === 'text' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          Manual Entry
        </button>
        <button type="button" onClick={() => { setMode('camera'); startCamera(); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${mode === 'camera' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          Scan QR
        </button>
      </div>

      {mode === 'camera' && (
        <div className="space-y-3">
          <div id={divId.current} className="w-full rounded-xl overflow-hidden border border-slate-200 min-h-[200px] bg-slate-900 flex items-center justify-center">
            {!scanning && <p className="text-slate-400 text-sm">Camera initializing...</p>}
          </div>
          {scanning && (
            <button type="button" onClick={stopCamera} className="w-full py-2 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
              Stop Camera
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono text-sm"
          placeholder={placeholder || "QR code value or scan above"}
        />
        <button
          type="button"
          onClick={handleManualSubmit}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Apply
        </button>
      </div>

      {batchPreview ? (
        <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
              <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs">✓</span>
              <span>Batch ID Extracted:</span>
              <code className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-mono font-bold text-emerald-800">
                {batchPreview.batchId}
              </code>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
              In-App Verified
            </span>
          </div>

          {(batchPreview.medicine || batchPreview.batchNo || batchPreview.manufacturer) && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1.5 text-[11px] text-slate-700 border-t border-emerald-200/60">
              {batchPreview.medicine && (
                <div>
                  <span className="text-slate-400">Medicine: </span>
                  <strong className="text-slate-800">{batchPreview.medicine}</strong>
                </div>
              )}
              {batchPreview.batchNo && (
                <div>
                  <span className="text-slate-400">Batch No: </span>
                  <strong className="font-mono text-slate-800">{batchPreview.batchNo}</strong>
                </div>
              )}
              {batchPreview.manufacturer && (
                <div>
                  <span className="text-slate-400">Manufacturer: </span>
                  <strong className="text-slate-800">{batchPreview.manufacturer}</strong>
                </div>
              )}
              {batchPreview.expDate && (
                <div>
                  <span className="text-slate-400">Exp Date: </span>
                  <strong className="text-slate-800">{batchPreview.expDate}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      ) : value ? (
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between text-xs">
          <span className="text-emerald-800 font-medium">✓ Scanned Value:</span>
          <code className="text-emerald-700 font-mono break-all">{value}</code>
        </div>
      ) : null}
    </div>
  );
}
