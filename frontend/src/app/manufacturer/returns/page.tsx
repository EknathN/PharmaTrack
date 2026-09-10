import { getAllShipments } from "@/app/actions/shipments";
import { getCurrentSession } from "@/app/actions/auth";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

export default async function ManufacturerReturnsPage() {
  const session = await getCurrentSession();
  const allShipments = await getAllShipments();
  const returns = allShipments.filter((s: any) => s.type === 'return');
  const incomingInTransit = returns.filter((s: any) => s.status === 'in_transit' && s.toId === session?.sub);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Near-Expiry Returns Management</h1>
          <p className="text-slate-500 text-sm">Review incoming return consignments from distributors and forward to bio-destruction disposers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/manufacturer/receive" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm">
            <span>📦</span>
            <span>Receive Return {incomingInTransit.length > 0 && `(${incomingInTransit.length})`}</span>
          </Link>
          <Link href="/manufacturer/disposal/new" className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors">
            Send to Disposer →
          </Link>
        </div>
      </div>

      {incomingInTransit.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-amber-900 text-sm">
                {incomingInTransit.length} Return Consignment{incomingInTransit.length === 1 ? '' : 's'} In-Transit
              </p>
              <p className="text-xs text-amber-700">Stock has been returned by distributors and requires dual-proof intake inspection.</p>
            </div>
          </div>
          <Link
            href="/manufacturer/receive"
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            Open Receive Portal →
          </Link>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Return Shipments ({returns.length})</h2>
        </div>
        {returns.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
            <p className="text-sm">No return shipments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Shipment #</th>
                  <th className="px-5 py-3 text-left font-medium">Medicine</th>
                  <th className="px-5 py-3 text-left font-medium">From</th>
                  <th className="px-5 py-3 text-left font-medium">Qty</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-slate-700 font-medium">
                      <div>{s.shipmentNumber}</div>
                      {s.ocgVerificationCode && (
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          🛡️ {s.ocgVerificationCode}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{s.batch?.medicineName || '—'}</div>
                      <div className="text-xs text-slate-500">{s.batch?.batchNumber}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.fromName} <span className="text-xs text-slate-400">({s.fromRole})</span></td>
                    <td className="px-5 py-3 text-slate-600 font-semibold">{s.quantity}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/shipments/${s.id}/mandate`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md border border-indigo-200 transition-colors"
                        >
                          Mandate
                        </Link>
                        <Link
                          href={`/shipments/${s.id}/ocg`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 font-semibold bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 transition-colors"
                        >
                          🛡️ OCG
                        </Link>
                        {s.status === 'in_transit' && s.toId === session?.sub && (
                          <Link
                            href={`/manufacturer/receive?shipmentId=${s.id}`}
                            className="inline-flex items-center gap-1 text-xs text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors"
                          >
                            Receive Return →
                          </Link>
                        )}
                        {s.status === 'received' && s.toId === session?.sub && (
                          <Link
                            href={`/manufacturer/disposal/new?batchId=${s.batchId}`}
                            className="text-xs text-red-600 hover:underline font-medium"
                          >
                            Send to Disposer →
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
