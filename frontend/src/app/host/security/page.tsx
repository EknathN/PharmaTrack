import Link from "next/link";
import { readDb } from "@/lib/db";
import { unfreezeBatch, unflagBatch } from "@/app/actions/host";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HostSecurityPage() {
  const db = await readDb();

  const frozenBatches = db.batches.filter(b => b.isFrozen);
  const flaggedBatches = db.batches.filter(b => b.isFlagged && !b.isFrozen);
  const alerts = db.alerts || [];

  const riskAlerts = alerts.filter(a =>
    a.type === 'danger' ||
    a.type === 'warning' ||
    a.message.toLowerCase().includes('mismatch') ||
    a.message.toLowerCase().includes('hold') ||
    a.message.toLowerCase().includes('frozen')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Security, Holds & Discrepancies</h1>
          <p className="text-slate-500 text-sm">Regulatory intervention center managing active batch freezes, surveillance flags, and quantity alarms.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Frozen Holds</span>
            <span className="text-lg font-bold text-rose-600 font-mono">{frozenBatches.length}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Surveillance</span>
            <span className="text-lg font-bold text-amber-600 font-mono">{flaggedBatches.length}</span>
          </div>
        </div>
      </div>

      {/* Active Frozen Batches Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <span>❄️ Active Regulatory Freeze Directives</span>
              <span className="text-xs text-rose-600 font-mono font-bold">({frozenBatches.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These batches are prohibited from entering circulation, dispatch, transit, or retail pharmacy sales.
            </p>
          </div>
        </div>

        {frozenBatches.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            ✓ No active regulatory freezes. All circulating medicines are in normal operating state.
          </div>
        ) : (
          <div className="space-y-3">
            {frozenBatches.map(b => (
              <div
                key={b.id}
                className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-base">{b.batchNumber}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-mono uppercase font-bold">
                      FROZEN BY {b.frozenBy || 'HOST'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 font-medium">{b.medicineName} ({b.totalQuantity.toLocaleString()} units)</div>
                  <div className="text-xs text-rose-800">
                    Reason: <strong>{b.freezeReason || 'Regulatory Hold'}</strong>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Enforced on: {b.frozenAt ? new Date(b.frozenAt).toLocaleString() : 'N/A'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/host/batches/${b.id}`}
                    className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
                  >
                    Inspect Lifecycle →
                  </Link>

                  <form action={async (formData) => { "use server"; await unfreezeBatch(formData); }}>
                    <input type="hidden" name="batchId" value={b.id} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                    >
                      Lift Freeze ✓
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flagged Surveillance Section */}
      {flaggedBatches.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <span>⚠️ Batches Under Surveillance</span>
              <span className="text-xs text-amber-600 font-mono font-bold">({flaggedBatches.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flaggedBatches.map(b => (
              <div key={b.id} className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-900 text-sm">{b.batchNumber}</span>
                  <form action={async (formData) => { "use server"; await unflagBatch(formData); }}>
                    <input type="hidden" name="batchId" value={b.id} />
                    <button type="submit" className="text-xs text-slate-500 hover:text-slate-800 underline">
                      Remove Flag
                    </button>
                  </form>
                </div>
                <div className="text-xs font-medium text-slate-800">{b.medicineName}</div>
                <div className="text-xs text-amber-900">
                  Notice: {b.flagReason || 'Active inspection watch'}
                </div>
                <Link
                  href={`/host/batches/${b.id}`}
                  className="text-xs text-blue-600 hover:underline block pt-1 font-medium"
                >
                  View Provenance →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Discrepancy Feed */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900 text-base">Network Discrepancies & Alerts</h2>
            <p className="text-xs text-slate-500 mt-0.5">Automated discrepancy warnings logged across all verification points</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{riskAlerts.length} Events Logged</span>
        </div>

        {riskAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No system discrepancies or suspicious alerts logged.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {riskAlerts.map(alert => (
              <div key={alert.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-slate-800 font-medium">{alert.message}</span>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Timestamp: {new Date(alert.createdAt).toLocaleString()} · User Target: {alert.userId}
                  </div>
                </div>
                {alert.batchId && (
                  <Link
                    href={`/host/batches/${alert.batchId}`}
                    className="text-xs text-blue-600 hover:underline font-medium shrink-0"
                  >
                    Examine Batch →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
