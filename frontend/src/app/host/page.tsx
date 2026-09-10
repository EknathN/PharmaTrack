import Link from "next/link";
import { readDb } from "@/lib/db";
import { freezeBatch, unfreezeBatch } from "@/app/actions/host";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HostDashboardPage() {
  const db = await readDb();

  const now = Date.now();
  const batches = db.batches || [];
  const shipments = db.shipments || [];
  const inventory = db.inventory || [];
  const disposals = db.disposalRecords || [];
  const alerts = db.alerts || [];

  // Metrics computation
  const totalBatches = batches.length;
  const activeCirculationUnits = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  const nearExpiryBatches = batches.filter(b => {
    const expTime = new Date(b.expDate).getTime();
    return (expTime - now) <= 60 * 24 * 60 * 60 * 1000 || b.status === 'near_expiry';
  });

  const disposedRecords = disposals.filter(d => d.status === 'completed');
  const totalDisposedUnits = disposedRecords.reduce((sum, d) => sum + (d.quantity || 0), 0);

  const pendingReturns = shipments.filter(s => s.type === 'return' && s.status !== 'received');
  const frozenBatches = batches.filter(b => b.isFrozen);
  const flaggedBatches = batches.filter(b => b.isFlagged && !b.isFrozen);

  // Count proofs
  let totalProofCount = 0;
  shipments.forEach(s => {
    if (s.senderProofUrl) totalProofCount++;
    if (s.senderOcgProofUrl) totalProofCount++;
    if (s.receiverProofUrl) totalProofCount++;
    if (s.receiverOcgProofUrl) totalProofCount++;
  });
  disposals.forEach(d => {
    if (d.photoBeforeUrl) totalProofCount++;
    if (d.photoAfterUrl) totalProofCount++;
    if (d.videoUrl) totalProofCount++;
    if (d.certificateUrl) totalProofCount++;
  });

  // Recent activity / anomaly alerts
  const recentAlerts = [...alerts].reverse().slice(0, 6);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Host Control Dashboard</h1>
          <p className="text-slate-500 text-sm">Central regulatory oversight and nationwide supply chain monitoring.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <a
            href="/host"
            className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            title="Refresh dashboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </a>
          <Link
            href="/host/reports"
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Dossier
          </Link>
          <Link
            href="/host/batches"
            className="px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            All Batches
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            label: 'Total Batches',
            value: totalBatches,
            icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
            color: 'blue',
            badge: '100% Minted'
          },
          {
            label: 'Units in Circulation',
            value: activeCirculationUnits.toLocaleString(),
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
            color: 'emerald',
            badge: 'In Stores/Hubs'
          },
          {
            label: 'Near Expiry (≤60d)',
            value: nearExpiryBatches.length,
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
            color: 'amber',
            badge: 'Radar Active'
          },
          {
            label: 'Units Disposed',
            value: totalDisposedUnits.toLocaleString(),
            icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
            color: 'orange',
            badge: `${disposedRecords.length} Certs`
          },
          {
            label: 'Pending Returns',
            value: pendingReturns.length,
            icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
            color: 'indigo',
            badge: 'Reverse Flow'
          },
          {
            label: 'Frozen / Holds',
            value: frozenBatches.length,
            icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
            color: 'rose',
            badge: `${flaggedBatches.length} Flagged`
          },
        ].map(({ label, value, icon, color, badge }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <div className={`p-2 bg-${color}-50 text-${color}-600 rounded-lg`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
                </svg>
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 font-mono">{value}</div>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{badge}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Frozen Emergency Alert Banner */}
      {frozenBatches.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 rounded-xl text-rose-600 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-rose-900 text-sm">
                  ❄️ REGULATORY FREEZE DIRECTIVE IN EFFECT — {frozenBatches.length} Batch(es) Locked
                </h3>
                <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                  All downstream actions (shipment dispatch, transfer intake, and retail POS pharmacy dispense) are blocked network-wide.
                </p>
              </div>
            </div>
            <Link
              href="/host/security"
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors shadow-xs"
            >
              Review Directives →
            </Link>
          </div>
        </div>
      )}

      {/* Proof & Media Anti-Fraud Surveillance Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-900/50 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Anti-Fraud Proof & Media Surveillance Center</h2>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  Live Audit Active
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Surveillance inspection of all courier PODs, OCG gatepasses, and destruction media uploaded by Manufacturers, Distributors, Retailers, and Disposers. Automated cross-batch duplicate hash detection prevents forged QR receipts and re-used proofs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Proofs</div>
              <div className="text-xl font-bold font-mono text-white">{totalProofCount}</div>
            </div>
            <Link
              href="/host/proofs"
              className="flex-1 md:flex-initial px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              Open Proof Inspector
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>


      {/* Main Two Column Grid: Batches Surveillance Table + Live Alert Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Batches Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="font-semibold text-slate-900 text-base">Master Batches Surveillance</h2>
                <p className="text-xs text-slate-500 mt-0.5">Showing latest batches across all manufacturers</p>
              </div>
              <Link href="/host/batches" className="text-xs text-rose-600 hover:text-rose-700 font-semibold">
                View All {batches.length} Batches →
              </Link>
            </div>

            {batches.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No pharmaceutical batches recorded in the network yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3">Batch Serial</th>
                      <th className="px-5 py-3">Medicine</th>
                      <th className="px-5 py-3">Manufacturer</th>
                      <th className="px-5 py-3">Expiry</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                    {batches.slice(0, 8).map(batch => {
                      const expMs = new Date(batch.expDate).getTime();
                      const isExp = expMs <= now;
                      return (
                        <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">
                            <Link href={`/host/batches/${batch.id}`} className="hover:underline">
                              {batch.batchNumber}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            {batch.medicineName}
                          </td>
                          <td className="px-5 py-3.5 text-slate-600">
                            {batch.manufacturerName}
                          </td>
                          <td className="px-5 py-3.5 font-mono">
                            <span className={isExp ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                              {batch.expDate}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                            {batch.totalQuantity.toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            {batch.isFrozen ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono">
                                ❄️ FROZEN
                              </span>
                            ) : batch.isFlagged ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold font-mono">
                                ⚠️ FLAGGED
                              </span>
                            ) : (
                              <StatusBadge status={batch.status} />
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/host/batches/${batch.id}`}
                                className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors"
                              >
                                Journey →
                              </Link>
                              {batch.isFrozen ? (
                                <form action={async (formData) => { "use server"; await unfreezeBatch(formData); }}>
                                  <input type="hidden" name="batchId" value={batch.id} />
                                  <button
                                    type="submit"
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
                                  >
                                    Unfreeze
                                  </button>
                                </form>
                              ) : (
                                <form action={async (formData) => { "use server"; await freezeBatch(formData); }}>
                                  <input type="hidden" name="batchId" value={batch.id} />
                                  <input type="hidden" name="reason" value="Regulatory Hold from Host Dashboard" />
                                  <button
                                    type="submit"
                                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors"
                                  >
                                    Freeze ❄️
                                  </button>
                                </form>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>DSCSA Standard Electronic Records Protocol</span>
            <Link href="/host/reports" className="text-blue-600 hover:underline font-medium">
              View Audit Dossier →
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Live Alert Radar Feed */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 text-base">Anomaly & Security Feed</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Live
            </span>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No anomalies detected. All supply chain nodes operating normally.
            </div>
          ) : (
            <div className="space-y-3">
              {recentAlerts.map(alert => (
                <div
                  key={alert.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-mono">
                      {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className={`uppercase font-bold font-mono ${
                      alert.type === 'danger'
                        ? 'text-rose-600'
                        : alert.type === 'warning'
                        ? 'text-amber-600'
                        : 'text-blue-600'
                    }`}>
                      {alert.type || 'INFO'}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {alert.message}
                  </p>
                  {alert.batchId && (
                    <Link
                      href={`/host/batches/${alert.batchId}`}
                      className="text-[11px] text-blue-600 hover:underline font-medium block pt-0.5"
                    >
                      Examine Batch Record →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700 block mb-1">Regulatory Guardrails</span>
            The host observer maintains read-only neutrality. Interventions are limited to legal holds and surveillance flags.
          </div>
        </div>
      </div>
    </div>
  );
}
