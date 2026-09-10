import Link from "next/link";
import { readDb } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HostExpiryRadarPage() {
  const db = await readDb();
  const now = Date.now();

  const expiryBatches = db.batches.map(batch => {
    const expMs = new Date(batch.expDate).getTime();
    const daysLeft = Math.ceil((expMs - now) / (1000 * 60 * 60 * 24));
    const isExpired = daysLeft <= 0;
    const isNearExpiry = isExpired || daysLeft <= 60 || batch.status === 'near_expiry';

    const activeHoldings = db.inventory.filter(i => i.batchId === batch.id && i.quantity > 0);
    const totalRemaining = activeHoldings.reduce((sum, h) => sum + h.quantity, 0);

    return {
      batch,
      daysLeft,
      isExpired,
      isNearExpiry,
      activeHoldings,
      totalRemaining,
    };
  }).filter(item => item.isNearExpiry);

  expiryBatches.sort((a, b) => a.daysLeft - b.daysLeft);
  const totalAtRiskUnits = expiryBatches.reduce((sum, item) => sum + item.totalRemaining, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Expiry Radar</h1>
          <p className="text-slate-500 text-sm">Real-time surveillance of near-expiry (≤60 days) and expired medicines across all stores and hubs.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">At-Risk Stock</span>
            <span className="text-lg font-bold text-amber-600 font-mono">{totalAtRiskUnits.toLocaleString()} units</span>
          </div>
          <a
            href="/host/expiry"
            className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            Refresh
          </a>
        </div>
      </div>

      {expiryBatches.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
          ✓ All medicines currently in circulation have over 60 days of shelf life. No expired batches found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {expiryBatches.map(({ batch, daysLeft, isExpired, activeHoldings, totalRemaining }) => (
            <div
              key={batch.id}
              className={`rounded-2xl p-5 border shadow-sm transition-all ${
                isExpired
                  ? 'bg-red-50/70 border-red-200'
                  : daysLeft <= 15
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-base">{batch.batchNumber}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase font-mono ${
                      isExpired
                        ? 'bg-red-100 text-red-800'
                        : daysLeft <= 30
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {isExpired ? 'EXPIRED' : `Expires in ${daysLeft} Days`}
                    </span>
                    {batch.isFrozen && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-mono font-bold">
                        ❄️ FROZEN
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{batch.medicineName}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Manufacturer: {batch.manufacturerName} · Expiry Date: {batch.expDate}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-medium block">Active Stock</span>
                    <span className="text-xl font-bold text-slate-900 font-mono">{totalRemaining.toLocaleString()} units</span>
                  </div>

                  <Link
                    href={`/host/batches/${batch.id}`}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-colors shrink-0"
                  >
                    Inspect Batch →
                  </Link>
                </div>
              </div>

              {/* Holders Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-200/60">
                <span className="text-xs font-semibold text-slate-600 block mb-2">
                  Locations Currently Holding this Batch:
                </span>
                {activeHoldings.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No inventory held in stores (Disposed or exhausted).</span>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {activeHoldings.map(h => {
                      const user = db.users.find(u => u.id === h.ownerId);
                      return (
                        <div key={h.id} className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs">
                          <div className="font-medium text-slate-900">{user?.name || h.ownerId}</div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span className="capitalize">{h.ownerRole}</span>
                            <span className="text-amber-600 font-bold font-mono">{h.quantity} units</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
