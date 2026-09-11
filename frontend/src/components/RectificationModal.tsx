"use client";

import { useState } from "react";
import ProofUpload from "@/components/ProofUpload";
import { submitProofRectification } from "@/app/actions/rectification";

interface RectificationModalProps {
  batchId: string;
  batchNumber: string;
  medicineName: string;
  freezeReason?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RectificationModal({
  batchId,
  batchNumber,
  medicineName,
  freezeReason,
  isOpen,
  onClose,
  onSuccess
}: RectificationModalProps) {
  const [proofUrl, setProofUrl] = useState("");
  const [ocgUrl, setOcgUrl] = useState("");
  const [appealNotes, setAppealNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUrl) {
      setError("Please upload a replacement authentic proof document or photo.");
      return;
    }
    if (!appealNotes.trim()) {
      setError("Please write an explanation / rectification statement.");
      return;
    }

    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("batchId", batchId);
    formData.append("rectifiedProofUrl", proofUrl);
    if (ocgUrl) formData.append("rectifiedOcgUrl", ocgUrl);
    formData.append("appealNotes", appealNotes.trim());

    try {
      const res = await submitProofRectification(formData);
      if (res.success) {
        setSubmitted(true);
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || "Failed to submit rectification.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm transition-colors"
        >
          ✕
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Rectification Submitted</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Your re-uploaded proof and appeal statement have been submitted to the Central Drug Regulatory Authority (Host Control) for re-verification.
              </p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium text-left">
              ⏳ <strong>Status: Under Host Re-Verification Review.</strong> Once the inspector confirms the authenticity of your new proofs, the regulatory freeze will be lifted automatically.
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl shrink-0">
                ❄️
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Re-Upload Proof & Request Re-Verification</h3>
                <p className="text-xs text-slate-500">
                  Batch: <strong className="font-mono text-slate-800">{batchNumber}</strong> ({medicineName})
                </p>
              </div>
            </div>

            {/* Current Hold Reason Banner */}
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
              <div className="font-bold text-rose-800 flex items-center gap-1">
                <span>⚠️ Current Regulatory Hold Directive:</span>
              </div>
              <p className="text-slate-700">
                &quot;{freezeReason || "Regulatory Hold enforced by Host Authority"}&quot;
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-medium">
                {error}
              </div>
            )}

            {/* Upload Rectified Proof */}
            <ProofUpload
              label="1. Re-Upload Authentic Proof Document / Photo"
              accept="image/*,.pdf"
              required
              onUploaded={setProofUrl}
              hint="Upload clear photographic proof of courier POD, physical stamped delivery note, or facility destruction photo."
            />

            {/* Optional OCG Gatepass Proof */}
            <ProofUpload
              label="2. Physical OCG Security Sheet / Gatepass (Optional)"
              accept="image/*,.pdf"
              onUploaded={setOcgUrl}
              hint="Attach signed physical OCG Gatepass sheet showing matching cryptographic verification code."
            />

            {/* Explanation / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rectification Statement & Explanation <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={appealNotes}
                onChange={(e) => setAppealNotes(e.target.value)}
                placeholder="Explain the correction made (e.g., re-scanned high-resolution stamped waybill, fixed blurred camera capture, attached verified supervisor sign-off)..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !proofUrl || !appealNotes.trim()}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/20"
              >
                {submitting ? "Submitting Appeal..." : "Submit for Re-Verification →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
