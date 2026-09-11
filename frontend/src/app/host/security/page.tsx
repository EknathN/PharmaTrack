import Link from "next/link";
import { readDb } from "@/lib/db";
import { unfreezeBatch, unflagBatch } from "@/app/actions/host";
import { approveRectificationAndUnfreeze, rejectRectification } from "@/app/actions/rectification";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HostSecurityPage() {
  const db = await readDb();

  const frozenBatches = db.batches.filter(b => b.isFrozen);
  const flaggedBatches = db.batches.filter(b => b.isFlagged && !b.isFrozen);
  const pendingRectifications = (db.rectificationRequests || []).filter(r => r.status === 'pending_review');
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
          <p className="text-slate-500 text-sm">Regulatory intervention center managing active batch freezes, surveillance flags, and proof re-verifications.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Frozen Holds</span>
            <span className="text-lg font-bold text-rose-600 font-mono">{frozenBatches.length}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Re-Verification Appeals</span>
            <span className="text-lg font-bold text-blue-600 font-mono">{pendingRectifications.length}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Surveillance</span>
            <span className="text-lg font-bold text-amber-600 font-mono">{flaggedBatches.length}</span>
          </div>
        </div>
      </div>

      {/* Re-Verification Appeals & Rectified Proofs Audit */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <span>⚡ Re-Verification Appeals & Rectified Proofs</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                pendingRectifications.length > 0 ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-slate-100 text-slate-600'
              }`}>
                {pendingRectifications.length} Pending
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review authentic media and rectification statements submitted by parties whose products or proofs were placed on regulatory hold.
            </p>
          </div>
        </div>

        {pendingRectifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            ✓ No re-verification appeals awaiting regulatory review. Any party whose batch is frozen can submit rectified proofs via their portal.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingRectifications.map(req => (
              <div
                key={req.id}
                id={`appeal-${req.id}`}
                className="bg-gradient-to-r from-blue-50/60 to-slate-50 border border-blue-200 rounded-2xl p-5 space-y-4 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-blue-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-base">{req.batchNumber}</span>
                      <span className="text-xs font-semibold text-slate-700">({req.medicineName})</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold uppercase tracking-wider">
                        {req.requesterRole} APPEAL
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">
                      Submitted by <strong className="text-slate-800">{req.requesterName}</strong> on {new Date(req.submittedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-400 block">Request ID: {req.id}</span>
                    <Link
                      href={`/host/batches/${req.batchId}`}
                      className="text-xs text-blue-600 hover:underline font-medium inline-block mt-0.5"
                    >
                      Audit Batch Lifecycle →
                    </Link>
                  </div>
                </div>

                {/* Hold Reason vs Appeal Statement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 space-y-1">
                    <span className="text-rose-900 font-bold flex items-center gap-1.5">
                      <span>❄️ Original Freeze Reason</span>
                    </span>
                    <p className="text-rose-800 italic">"{req.reasonForHold}"</p>
                  </div>
                  <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-1">
                    <span className="text-blue-900 font-bold flex items-center gap-1.5">
                      <span>📝 Rectification Statement & Explanation</span>
                    </span>
                    <p className="text-slate-800">"{req.appealNotes}"</p>
                  </div>
                </div>

                {/* Uploaded Media Previews */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Re-Uploaded Authentic Compliance Proofs:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {req.rectifiedProofUrl && (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-xs">
                        <img
                          src={req.rectifiedProofUrl}
                          alt="Rectified Proof"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-xs font-bold text-slate-900 block truncate">Rectified Consignment / Proof</span>
                          <a
                            href={req.rectifiedProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Inspect Full Size</span>
                            <span>↗</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {req.rectifiedOcgUrl && (
                      <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-xs">
                        <img
                          src={req.rectifiedOcgUrl}
                          alt="Rectified OCG Sheet"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <span className="text-xs font-bold text-slate-900 block truncate">Official OCG Gatepass Sheet</span>
                          <a
                            href={req.rectifiedOcgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-emerald-600 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Inspect Full Size</span>
                            <span>↗</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Regulatory Decision Forms */}
                <div className="pt-2 border-t border-blue-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Approve Form */}
                  <form
                    action={async (formData) => {
                      "use server";
                      await approveRectificationAndUnfreeze(formData);
                    }}
                    className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    <input type="hidden" name="batchId" value={req.batchId} />
                    <input type="hidden" name="rectificationId" value={req.id} />
                    <input
                      type="text"
                      name="reviewRemarks"
                      placeholder="Regulatory inspector verification remarks (e.g. Proof verified genuine)"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors whitespace-nowrap flex items-center justify-center gap-1"
                    >
                      <span>✓</span>
                      <span>Approve & Re-Verify</span>
                    </button>
                  </form>

                  {/* Reject Form */}
                  <form
                    action={async (formData) => {
                      "use server";
                      await rejectRectification(formData);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="batchId" value={req.batchId} />
                    <input type="hidden" name="rectificationId" value={req.id} />
                    <input
                      type="text"
                      name="rejectionReason"
                      required
                      placeholder="Reason for rejection..."
                      className="w-48 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
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
            {frozenBatches.map(b => {
              const pendingReq = pendingRectifications.find(r => r.batchId === b.id);

              return (
                <div
                  key={b.id}
                  className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    pendingReq ? 'bg-blue-50/70 border-blue-200' : 'bg-rose-50/80 border-rose-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 text-base">{b.batchNumber}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 font-mono uppercase font-bold">
                        FROZEN BY {b.frozenBy || 'HOST'}
                      </span>
                      {pendingReq && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono font-bold animate-pulse">
                          ⚡ RE-VERIFICATION APPEAL PENDING
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-800 font-medium">{b.medicineName} ({b.totalQuantity.toLocaleString()} units)</div>
                    <div className="text-xs text-rose-800">
                      Reason: <strong>{b.freezeReason || 'Regulatory Hold'}</strong>
                    </div>
                    {pendingReq && (
                      <div className="text-xs text-blue-900 font-medium bg-blue-100/70 px-2.5 py-1 rounded-lg border border-blue-200">
                        Appeal from {pendingReq.requesterName} ({pendingReq.requesterRole}): "{pendingReq.appealNotes}"
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono">
                      Enforced on: {b.frozenAt ? new Date(b.frozenAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/host/batches/${b.id}`}
                      className="px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
                    >
                      Inspect Lifecycle →
                    </Link>

                    {pendingReq ? (
                      <a
                        href={`#appeal-${pendingReq.id}`}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                      >
                        Review Proof Appeal →
                      </a>
                    ) : (
                      <form action={async (formData) => { "use server"; await unfreezeBatch(formData); }}>
                        <input type="hidden" name="batchId" value={b.id} />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                        >
                          Lift Freeze ✓
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
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
