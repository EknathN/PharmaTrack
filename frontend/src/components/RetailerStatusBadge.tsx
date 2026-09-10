"use client";

import { useRetailerLanguage } from "@/context/RetailerLanguageContext";

const CONFIGS: Record<string, { key: string; fallback: string; classes: string }> = {
  in_stock:            { key: 'status_in_stock', fallback: 'In Stock', classes: 'bg-blue-50 text-blue-700 border-blue-100' },
  in_transit:          { key: 'status_in_transit', fallback: 'In Transit', classes: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  awaiting_proof:      { key: 'status_awaiting_proof', fallback: 'Awaiting Proof', classes: 'bg-amber-50 text-amber-700 border-amber-100' },
  received:            { key: 'status_received', fallback: 'Received ✓', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  near_expiry:         { key: 'status_near_expiry', fallback: 'Near Expiry ⚠️', classes: 'bg-red-50 text-red-700 border-red-100' },
  return_in_transit:   { key: 'status_return_in_transit', fallback: 'Return In Transit', classes: 'bg-purple-50 text-purple-700 border-purple-100' },
  disposal_in_transit: { key: 'status_disposal_in_transit', fallback: 'Disposal In Transit', classes: 'bg-orange-50 text-orange-700 border-orange-100' },
  fully_disposed:      { key: 'status_fully_disposed', fallback: 'Fully Disposed ✓', classes: 'bg-slate-50 text-slate-600 border-slate-200' },
  completed:           { key: 'status_completed', fallback: 'Completed ✓', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  pending:             { key: 'status_pending', fallback: 'Pending', classes: 'bg-amber-50 text-amber-700 border-amber-100' },
  frozen:              { key: 'status_frozen', fallback: 'Frozen ❄️', classes: 'bg-rose-50 text-rose-700 border-rose-100' },
};

export default function RetailerStatusBadge({ status }: { status: string }) {
  const { t } = useRetailerLanguage();
  const cfg = CONFIGS[status] || { key: `status_${status}`, fallback: status, classes: 'bg-slate-50 text-slate-600 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.classes}`}>
      {t(cfg.key, cfg.fallback)}
    </span>
  );
}
