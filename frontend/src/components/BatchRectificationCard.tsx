"use client";

import { useState } from "react";
import RectificationModal from "./RectificationModal";

interface BatchRectificationCardProps {
  batchId: string;
  batchNumber: string;
  medicineName: string;
  freezeReason?: string;
  hasPendingRectification?: boolean;
}

export default function BatchRectificationCard({
  batchId,
  batchNumber,
  medicineName,
  freezeReason,
  hasPendingRectification
}: BatchRectificationCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, setPending] = useState(hasPendingRectification);

  return (
    <>
      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-xl shrink-0 mt-0.5">
              ❄️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-rose-900 text-sm">
                  REGULATORY HOLD DIRECTIVE IN EFFECT
                </h3>
                {pending ? (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold rounded-full animate-pulse">
                    ⏳ Re-Verification In Progress
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-900 text-[10px] font-bold rounded-full">
                    Action Required
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-800 mt-1">
                Reason: <strong>{freezeReason || "Administrative hold by Regulatory Host"}</strong>
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                All dispatches, transfer intakes, and pharmacy sales are blocked nationwide until cleared by Regulatory Authority.
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {pending ? (
              <div className="flex flex-col sm:items-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  Update Re-Upload Proof
                </button>
                <span className="text-[10px] text-amber-800 font-medium">Under Host Review</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                <span>📤 Re-Upload Proof & Re-Verify</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <RectificationModal
        batchId={batchId}
        batchNumber={batchNumber}
        medicineName={medicineName}
        freezeReason={freezeReason}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setPending(true)}
      />
    </>
  );
}
