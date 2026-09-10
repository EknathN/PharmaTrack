import { getAllShipments } from "@/app/actions/shipments";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

export default async function ManufacturerReturnsPage() {
  const allShipments = await getAllShipments();
  const returns = allShipments.filter((s: any) => s.type === 'return');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Near-Expiry Returns</h1>
          <p className="text-slate-500 text-sm">Stock returned from the supply chain due to near expiry.</p>
        </div>
        <Link href="/manufacturer/disposal/new" className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors">
          Send to Disposer →
        </Link>
      </div>

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
                    <td className="px-5 py-3 font-mono text-slate-700 font-medium">{s.shipmentNumber}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{s.batch?.medicineName || '—'}</div>
                      <div className="text-xs text-slate-500">{s.batch?.batchNumber}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.fromName} <span className="text-xs text-slate-400">({s.fromRole})</span></td>
                    <td className="px-5 py-3 text-slate-600">{s.quantity}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/shipments/${s.id}/mandate`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          Print Mandate
                        </Link>
                        {s.status === 'received' && s.toId !== s.fromId && (
                          <Link href={`/manufacturer/disposal/new?batchId=${s.batchId}`} className="text-xs text-red-600 hover:underline font-medium">
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
