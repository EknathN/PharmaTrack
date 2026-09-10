import { getAllShipments } from "@/app/actions/shipments";
import { redirect } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";

export default async function DistributorReturnsPage() {
  const allShipments = await getAllShipments();
  const returns = (allShipments as any[]).filter(s => s.type === 'return');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Returns Management</h1>
          <p className="text-slate-500 text-sm">Handle near-expiry stock returned from retailers and forward to manufacturers.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/distributor/shipments/new?returnTo=manufacturer" className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors shadow-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Return to Manufacturer
          </Link>
          <Link href="/distributor/receive" className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors">
            Receive Return
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Return Shipments ({returns.length})</h2>
        </div>
        {returns.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm">No return shipments yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Shipment #</th>
                  <th className="px-5 py-3 text-left font-medium">Direction</th>
                  <th className="px-5 py-3 text-left font-medium">Medicine</th>
                  <th className="px-5 py-3 text-left font-medium">Qty</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-slate-700 font-medium">{s.shipmentNumber}</td>
                    <td className="px-5 py-3 text-xs text-slate-600">{s.fromName} → {s.toName}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{s.batch?.medicineName || '—'}</div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.quantity}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/shipments/${s.id}/mandate`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          Print Mandate
                        </Link>
                        {s.status === 'received' && (
                          <Link href={`/distributor/shipments/new?batchId=${s.batchId}&returnTo=manufacturer`} className="text-xs text-violet-600 hover:underline font-medium">Forward to Mfr →</Link>
                        )}
                        {s.status === 'in_transit' && s.toRole === 'distributor' && (
                          <Link href="/distributor/receive" className="text-xs text-amber-600 hover:underline font-medium">Receive →</Link>
                        )}
                        {s.status === 'in_transit' && s.fromRole === 'distributor' && (
                          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">Dispatched to Mfr</span>
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
