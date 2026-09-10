import Link from "next/link";
import { readDb } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HostReturnsPage() {
  const db = await readDb();

  const returns = db.shipments.filter(s => s.type === 'return');
  returns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalReturnedUnits = returns.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const completedReturns = returns.filter(r => r.status === 'received');
  const inTransitReturns = returns.filter(r => r.status !== 'received');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reverse Returns Log</h1>
          <p className="text-slate-500 text-sm">Tracking all reverse-logistics returns flowing from pharmacies to distributors and manufacturers.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Returned Stock</span>
            <span className="text-lg font-bold text-violet-600 font-mono">{totalReturnedUnits.toLocaleString()} units</span>
          </div>
          <a
            href="/host/returns"
            className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            Refresh
          </a>
        </div>
      </div>

      {returns.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
          No return shipments have been recorded in the network.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-semibold text-slate-900 text-sm">
              All Returns ({returns.length} Total · {inTransitReturns.length} In Transit · {completedReturns.length} Delivered)
            </h2>
            <span className="text-xs text-slate-400 font-mono">Immutable Provenance</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Shipment #</th>
                  <th className="px-5 py-3">Medicine / Batch</th>
                  <th className="px-5 py-3">From (Sender)</th>
                  <th className="px-5 py-3">To (Recipient)</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Proofs</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {returns.map(s => {
                  const batch = db.batches.find(b => b.id === s.batchId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">
                        #{s.shipmentNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900">{batch?.medicineName || 'Medicine'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{batch?.batchNumber}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900">{s.fromName}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{s.fromRole}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900">{s.toName}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{s.toRole}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                        {s.quantity.toLocaleString()} units
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {s.senderProofUrl && (
                            <a
                              href={s.senderProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Dispatch POD ↗
                            </a>
                          )}
                          {s.receiverProofUrl && (
                            <a
                              href={s.receiverProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-emerald-600 hover:underline"
                            >
                              Intake Proof ↗
                            </a>
                          )}
                          {!s.senderProofUrl && !s.receiverProofUrl && (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/shipments/${s.id}/mandate`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded border border-indigo-200 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            Mandate
                          </Link>
                          {batch && (
                            <Link
                              href={`/host/batches/${batch.id}`}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-medium transition-colors"
                            >
                              Inspect →
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
