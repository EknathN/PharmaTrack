"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyDrugQr, VerificationResult } from "@/app/actions/verify";
import Barcode from "@/components/Barcode";

interface PublicScannerClientProps {
  initialSamples: Array<{ id: string; batchNumber: string; medicineName: string; qrData: string }>;
}

export default function PublicScannerClient({ initialSamples }: PublicScannerClientProps) {
  const searchParams = useSearchParams();
  const initialQr = searchParams.get('qr') || searchParams.get('batch') || '';

  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [manualInput, setManualInput] = useState(initialQr);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const scannerRef = useRef<any>(null);
  const scannerContainerId = "public-qr-reader";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-verify if initial QR / batch was provided in query string
  useEffect(() => {
    if (initialQr) {
      handleVerify(initialQr);
    }
  }, [initialQr]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleVerify = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    stopCamera();

    try {
      const res = await verifyDrugQr(trimmed);
      setResult(res);
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async (facing: 'environment' | 'user' = facingMode) => {
    setCameraError('');
    setIsCameraActive(false);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {}
      }

      const scanner = new Html5Qrcode(scannerContainerId, {
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
        { facingMode: facing },
        { fps: 15, qrbox: { width: 340, height: 220 } },
        (decodedText: string) => {
          stopCamera();
          handleVerify(decodedText);
        },
        () => {}
      );

      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Failed to start camera:", err);
      setCameraError(
        err?.message?.includes('Permission')
          ? 'Camera permission denied. Please allow camera access in browser settings or use the File Upload / Manual tab.'
          : 'Could not access device camera. Please use File Upload or type the batch number.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scannerRef.current) {
      scannerRef.current.stop?.().catch(() => {});
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setCameraError('');

    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(scannerContainerId);
      const decodedText = await scanner.scanFile(file, true);
      scanner.clear();
      handleVerify(decodedText);
    } catch (err: any) {
      setCameraError('No valid QR code detected in the uploaded image. Please ensure the QR is clear and well-lit.');
      setLoading(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* ─── TOP NAVBAR ─── */}
      <header className="max-w-4xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md shadow-blue-500/20">
            P
          </div>
          <div>
            <div className="font-extrabold text-white tracking-tight text-base sm:text-lg">PharmaTrack Pro</div>
            <div className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">Public Drug Authenticator</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            ← Home
          </Link>
          <Link
            href="/login"
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            Portal Login
          </Link>
        </div>
      </header>

      {/* ─── MAIN HERO CONTENT ─── */}
      <main className="max-w-4xl mx-auto mt-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            National Public Verification Portal · 21 CFR Part 11 Validated
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Scan & Verify Medicine Box
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Instantly authenticate genuine pharmaceutical provenance, verify expiry dates, and audit the complete supply chain custody trail before intake.
          </p>
        </div>

        {/* ─── SCANNER CARD ─── */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-900/80 rounded-2xl border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                startCamera();
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'camera'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Live Camera Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Upload Photo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('manual');
                stopCamera();
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'manual'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Type Code</span>
            </button>
          </div>

          {/* TAB 1: Live Camera Viewport */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative w-full max-w-md mx-auto aspect-square rounded-2xl overflow-hidden bg-black border-2 border-slate-700 flex flex-col items-center justify-center">
                <div id={scannerContainerId} className="w-full h-full object-cover" />

                {/* Laser animation indicator when active */}
                {isCameraActive && (
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse pointer-events-none" />
                )}

                {/* Camera Overlay when inactive */}
                {!isCameraActive && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-3xl">
                      📷
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">Camera Scanner</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs">
                        Click below to grant camera access and align the box QR code in the frame.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30"
                    >
                      Turn On Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              {isCameraActive && (
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Flip Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-colors"
                  >
                    Stop Camera
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Upload Photo */}
          {activeTab === 'upload' && (
            <div className="max-w-md mx-auto space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-900/50 hover:bg-slate-900"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-3 text-2xl">
                  🖼️
                </div>
                <h4 className="font-bold text-white text-sm">Select QR Code Image</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Upload a photo of the medicine carton or blister pack QR code
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">
                  Choose Photo from Device
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Manual Code Entry */}
          {activeTab === 'manual' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(manualInput);
              }}
              className="max-w-md mx-auto space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Batch Number, Batch ID, or Raw QR String:
                </label>
                <textarea
                  rows={3}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="e.g. BN-2026-9041 or BAT-9f3k2x7m or paste scanned QR text..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !manualInput.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-blue-600/25"
              >
                {loading ? 'Verifying on Ledger...' : 'Verify Medicine Code →'}
              </button>
            </form>
          )}

          {/* Camera / Upload Error Feedback */}
          {cameraError && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700/60 rounded-xl text-xs text-red-300 text-center">
              {cameraError}
            </div>
          )}

          {/* Sample Batches Quick Buttons */}
          {initialSamples && initialSamples.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-800 text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block mb-2">
                Quick Test Registered Batches:
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {initialSamples.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      setManualInput(sample.qrData || sample.batchNumber);
                      handleVerify(sample.qrData || sample.batchNumber);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono transition-colors"
                  >
                    {sample.medicineName} ({sample.batchNumber})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── LOADING STATE ─── */}
        {loading && (
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-12 text-center space-y-3">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-white">Cryptographic Blockchain Query In Progress...</h3>
            <p className="text-xs text-slate-400">Verifying batch authenticity, recall status, and custody provenance.</p>
          </div>
        )}

        {/* ─── VERIFICATION RESULT VIEW ─── */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Authenticity Status Banner */}
            {result.authenticityStatus === 'genuine' && (
              <div className="p-6 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500 text-white space-y-2 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl shrink-0">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
                      OFFICIAL AUTHENTICITY VERIFIED
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      100% Genuine Pharmaceutical Medicine
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed pl-15">
                  This batch was manufactured by <strong>{result.batch?.manufacturerName}</strong> and passed all cryptographic integrity standards. It is genuine, active in the national tracking ledger, and approved for consumption.
                </p>
              </div>
            )}

            {result.authenticityStatus === 'near_expiry' && (
              <div className="p-6 rounded-3xl bg-amber-950/80 border-2 border-amber-500 text-white space-y-2 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-3xl shrink-0">
                    ⚠️
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                      AUTHENTIC · NEAR EXPIRY ALERT
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Genuine Batch — Approaching Expiration
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed pl-15">
                  Verified authentic batch, but expires in <strong>{result.batch?.daysRemaining} days</strong> ({result.batch?.expDate}). Pharmacies should prioritize dispensing or initiate reverse-logistics return to supplier.
                </p>
              </div>
            )}

            {result.authenticityStatus === 'expired' && (
              <div className="p-6 rounded-3xl bg-red-950/90 border-2 border-red-500 text-white space-y-2 shadow-2xl animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-3xl shrink-0">
                    🚫
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">
                      CRITICAL SAFETY WARNING
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      EXPIRED DRUG — DO NOT CONSUME
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed pl-15">
                  This batch expired on <strong>{result.batch?.expDate}</strong>. Consuming expired medication can result in therapeutic failure or toxic degradation. Quarantine immediately for authorized bio-hazard destruction.
                </p>
              </div>
            )}

            {result.authenticityStatus === 'frozen' && (
              <div className="p-6 rounded-3xl bg-rose-950/90 border-2 border-rose-500 text-white space-y-2 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl shrink-0">
                    ❄️
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-widest text-rose-400">
                      REGULATORY HOLD DIRECTIVE
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Batch Locked by Central Drug Authority
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-rose-200/90 leading-relaxed pl-15">
                  This batch is under an emergency administrative freeze directive: <em>&quot;{result.batch?.freezeReason || 'Under active regulatory safety investigation'}&quot;</em>. Dispensing or consumption is strictly prohibited by law.
                </p>
              </div>
            )}

            {result.authenticityStatus === 'disposed' && (
              <div className="p-6 rounded-3xl bg-slate-950 border-2 border-slate-600 text-white space-y-2 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-orange-400 flex items-center justify-center text-3xl shrink-0">
                    🔥
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-widest text-orange-400">
                      FORMALLY DESTROYED
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Bio-Hazard Neutralization Completed
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed pl-15">
                  This batch has been destroyed and incinerated at an authorized bio-medical waste facility. Any physical unit circulating in the market is an illegal simulated replica.
                </p>
              </div>
            )}

            {result.authenticityStatus === 'counterfeit' && (
              <div className="p-6 rounded-3xl bg-red-950/90 border-2 border-red-500 text-white space-y-2 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center text-3xl shrink-0">
                    ❌
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">
                      COUNTERFEIT / UNVERIFIED ALERT
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Unregistered Pharmaceutical Code
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-red-200/90 leading-relaxed pl-15">
                  No registered record was found for code <code className="bg-red-900/60 px-1.5 py-0.5 rounded font-mono">{result.searchedTerm}</code>. This product may be an unapproved or counterfeit formulation. Report this box to the Central Drug Regulatory Authority immediately.
                </p>
              </div>
            )}

            {/* Anti-Fraud Date Tamper Alert Banner */}
            {result.dateTamperAlert && (
              <div className={`p-5 rounded-3xl border-2 space-y-2 shadow-2xl ${
                result.dateTamperAlert.isTampered
                  ? 'bg-rose-950/95 border-rose-500 text-white animate-pulse'
                  : 'bg-emerald-950/90 border-emerald-500 text-white'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                    result.dateTamperAlert.isTampered
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {result.dateTamperAlert.isTampered ? '🚨' : '🛡️'}
                  </div>
                  <div>
                    <div className={`text-xs font-mono font-bold uppercase tracking-widest ${
                      result.dateTamperAlert.isTampered ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {result.dateTamperAlert.isTampered ? 'FRAUD ALERT · DATE TAMPERING DETECTED' : 'ANTI-TAMPER INTEGRITY VERIFIED'}
                    </div>
                    <h3 className="text-lg font-black text-white">
                      {result.dateTamperAlert.isTampered ? 'Engraved Barcode Date Alteration Detected!' : 'Manufacturing & Expiry Dates Authenticated'}
                    </h3>
                  </div>
                </div>
                <p className="text-xs leading-relaxed pl-15 text-slate-200">
                  {result.dateTamperAlert.message}
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2 pl-15">
                  {result.dateTamperAlert.barcodeMfg && (
                    <span className="px-2.5 py-1 bg-black/40 rounded-lg text-xs font-mono border border-white/10">
                      Barcode MFG: <strong className="text-white">{result.dateTamperAlert.barcodeMfg}</strong>
                    </span>
                  )}
                  {result.dateTamperAlert.barcodeExp && (
                    <span className="px-2.5 py-1 bg-black/40 rounded-lg text-xs font-mono border border-white/10">
                      Barcode EXP: <strong className="text-white">{result.dateTamperAlert.barcodeExp}</strong>
                    </span>
                  )}
                  {result.dateTamperAlert.batchMfg && (
                    <span className="px-2.5 py-1 bg-black/40 rounded-lg text-xs font-mono border border-white/10">
                      Ledger MFG: <strong className="text-white">{result.dateTamperAlert.batchMfg}</strong>
                    </span>
                  )}
                  {result.dateTamperAlert.batchExp && (
                    <span className="px-2.5 py-1 bg-black/40 rounded-lg text-xs font-mono border border-white/10">
                      Ledger EXP: <strong className="text-white">{result.dateTamperAlert.batchExp}</strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Found Batch Details */}
            {result.found && result.batch && (
              <div className="space-y-6">
                {result.unitInfo && (
                  <div className="p-5 rounded-3xl bg-slate-800/90 border-2 border-emerald-500/50 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          🏷️ Engraved Unit Barcode Authenticated
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase ${
                          result.unitInfo.status === 'sold'
                            ? 'bg-blue-900/80 text-blue-200 border border-blue-700'
                            : result.unitInfo.status === 'disposed'
                            ? 'bg-orange-900/80 text-orange-200 border border-orange-700'
                            : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
                        }`}>
                          {result.unitInfo.status === 'sold'
                            ? 'Dispensed to Patient'
                            : result.unitInfo.status === 'disposed'
                            ? 'Disposed & Incinerated'
                            : 'Active Unit In Stock'}
                        </span>
                      </div>
                      <div className="font-mono text-base font-bold text-white tracking-wide">
                        {result.unitInfo.unitBarcode}
                      </div>
                      <div className="text-xs text-slate-300">
                        Packaging Format: <strong>{result.unitInfo.packagingType || 'Medicine Strip / Bottle / Cream Tube'}</strong>
                        {result.unitInfo.invoiceNumber && (
                          <span className="ml-2 font-mono text-[11px] text-slate-400">
                            (Invoice #{result.unitInfo.invoiceNumber})
                          </span>
                        )}
                      </div>

                      {result.unitInfo.isEncrypted && (
                        <div className="mt-2 pt-2 border-t border-slate-700/60 text-xs">
                          {result.unitInfo.isRevealed ? (
                            <div className="flex flex-wrap items-center gap-1.5 text-emerald-300">
                              <span>🔓 Revealed & Stored in Ledger:</span>
                              <span className="font-semibold capitalize text-white">
                                {result.unitInfo.revealedByRole === 'retailer' ? 'Retailer POS Sale' : 'Bio-Disposer Audit'}
                              </span>
                              {result.unitInfo.revealedByUserName && (
                                <span className="text-slate-300">by {result.unitInfo.revealedByUserName}</span>
                              )}
                              {result.unitInfo.decryptedExpDate && (
                                <span className="bg-emerald-950/80 text-emerald-200 px-2 py-0.5 rounded font-mono text-[10px] border border-emerald-800">
                                  EXP: {result.unitInfo.decryptedExpDate}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-300">
                              <span>🔒 Manufacturer Encrypted Barcode:</span>
                              <span className="text-slate-300 text-[11px]">
                                Confidential unit cipher. Revealed only when scanned by authorized Retailer or Disposer.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-2.5 rounded-2xl shadow-md shrink-0">
                      <Barcode
                        value={result.unitInfo.unitBarcode}
                        height={36}
                        moduleWidth={1.5}
                        showText={true}
                        fontSize={10}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Drug Profile Card */}
                  <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                        {result.batch.medicineType}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-0.5">{result.batch.medicineName}</h3>
                      <p className="text-xs text-slate-400">{result.batch.unitDetails}</p>
                    </div>
                    {result.batch.qrCode && (
                      <img src={result.batch.qrCode} alt="Batch QR" className="w-16 h-16 rounded-lg bg-white p-1" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Batch Number</span>
                      <span className="font-mono font-bold text-white">{result.batch.batchNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Unique Batch ID</span>
                      <span className="font-mono font-bold text-blue-400">{result.batch.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Manufacturing Date</span>
                      <span className="text-white font-medium">{result.batch.mfgDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Expiry Date</span>
                      <span className={`font-medium ${result.batch.isExpired ? 'text-red-400 font-bold' : result.batch.isNearExpiry ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>
                        {result.batch.expDate} ({result.batch.daysRemaining > 0 ? `${result.batch.daysRemaining}d left` : 'Expired'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Manufacturer Provenance & Inspection Address */}
                <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏭</span>
                    <h3 className="text-base font-bold text-white">Originating Manufacturer</h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Licensed Company</span>
                      <span className="font-bold text-white text-sm">{result.batch.manufacturerName}</span>
                    </div>

                    {result.batch.manufacturerAddress && (
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-700/60 space-y-1">
                        <div className="font-semibold text-slate-300 flex items-center gap-1">
                          <span>📍 Registered Facility Address:</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">
                          {result.batch.manufacturerAddress}, {result.batch.manufacturerCity}, {result.batch.manufacturerState} - <span className="font-mono font-semibold text-white">{result.batch.manufacturerPincode}</span>
                        </p>
                        {result.batch.manufacturerPhone && (
                          <p className="text-slate-500">
                            Phone: <span className="text-slate-300">{result.batch.manufacturerPhone}</span>
                            {result.batch.manufacturerLicense && ` · License: ${result.batch.manufacturerLicense}`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
                    <span>CDSCO Facility Verification:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span>✓</span> Valid & Inspected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Complete Chain of Custody Timeline */}
            {result.found && result.custodyEvents && result.custodyEvents.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⛓️</span>
                    <h3 className="text-lg font-bold text-white">Immutable Custody Audit Trail</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {result.custodyEvents.length} Verified Milestones
                  </span>
                </div>

                <div className="relative pl-6 border-l-2 border-slate-700 space-y-6 pt-2">
                  {result.custodyEvents.map((evt, idx) => (
                    <div key={idx} className="relative group">
                      {/* Node Bullet */}
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-slate-800" />
                      
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-bold text-white">{evt.event}</span>
                          <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[10px] font-semibold uppercase">
                            {evt.actorRole}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {new Date(evt.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium">
                          Handled by: <span className="text-blue-400">{evt.actorName}</span>
                        </p>
                        {evt.details && (
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {evt.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cryptographic Verification Seal */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="space-y-0.5 text-center sm:text-left">
                <div>Digital Verification Hash: <code className="font-mono text-blue-400 text-[11px]">{result.verificationHash}</code></div>
                <div className="text-[10px] text-slate-500">Verified at {new Date(result.verifiedAt).toUTCString()} · PharmaTrack Integrity Engine v2.4</div>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
