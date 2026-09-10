import Link from "next/link";
import { getDisposerDashboard } from "@/app/actions/shipments";
import { redirect } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DisposerDashboard() {
  const data = await getDisposerDashboard();
  if (!data) redirect('/login');

  const { incomingShipments, disposalRecords, alerts } = data;
  const pending = disposalRecords.filter((d: any) => d.status === 'pending');
  const completed = disposalRecords.filter((d: any) => d.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disposer Dashboard</h1>
          <p className="text-slate-500 text-sm">Safely dispose of near-expiry pharmaceuticals with full documentation.</p>
        </div>
        <Link href="/disposer/receive" className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition-colors">Receive Shipment</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Incoming Shipments', value: incomingShipments.length },
          { label: 'Pending Disposal', value: pending.length },
          { label: 'Completed Disposals', value: completed.length },
          { label: 'Unread Alerts', value: alerts.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-3">{label}</p>
            <div className={`text-3xl font-bold ${label === 'Pending Disposal' && value > 0 ? 'text-orange-600' : 'text-slate-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Incoming Disposal Shipments Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-slate-900">Incoming Shipments from Manufacturers ({incomingShipments.length})</h2>
            <p className="text-xs text-slate-500 mt-0.5">Expired or returned pharmaceuticals en route for bio-destruction.</p>
          </div>
          <Link href="/disposer/receive" className="text-xs font-semibold px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            + Receive & Verify
          </Link>
        </div>
        {incomingShipments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
            <p className="text-sm">No incoming disposal shipments right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Shipment #</th>
                  <th className="px-5 py-3 text-left font-medium">Medicine</th>
                  <th className="px-5 py-3 text-left font-medium">Batch #</th>
                  <th className="px-5 py-3 text-left font-medium">Allotted Quantity</th>
                  <th className="px-5 py-3 text-left font-medium">From (Manufacturer)</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {incomingShipments.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-slate-700 font-medium">{s.shipmentNumber}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{s.batch?.medicineName || '—'}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{s.batch?.batchNumber || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-slate-900 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-mono">
                        {s.quantity} units
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{s.fromName}</td>
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
                        {s.status === 'in_transit' ? (
                          <Link href={`/disposer/receive?shipmentId=${s.id}`} className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline">
                            Scan to Receive →
                          </Link>
                        ) : (
                          <span className="text-xs text-amber-600">Awaiting dispatch</span>
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

      {/* Pending Disposal Actions */}
      {pending.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <h2 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            Action Required — Pending Disposal ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between bg-white rounded-xl p-4 border border-orange-100">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{d.batch?.medicineName}</p>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-semibold text-xs">
                      {d.quantity || d.shipment?.quantity || d.batch?.totalQuantity || '—'} units to destroy
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Batch: {d.batch?.batchNumber} · Received from {d.batch?.manufacturerName || 'Manufacturer'}</p>
                </div>
                <Link href={`/disposer/dispose/${d.id}`} className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-xl hover:bg-orange-700 transition-colors">
                  Upload Proof & Dispose →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completed Disposals */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-semibold text-slate-900">Disposal History ({completed.length} completed)</h2>
          </div>
          {completed.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-sm">No completed disposals yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Batch</th>
                    <th className="px-5 py-3 text-left font-medium">Medicine</th>
                    <th className="px-5 py-3 text-left font-medium">Quantity</th>
                    <th className="px-5 py-3 text-left font-medium">Completed</th>
                    <th className="px-5 py-3 text-left font-medium">Proofs</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((d: any) => (
                    <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-slate-600 text-xs">{d.batch?.batchNumber}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{d.batch?.medicineName}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800 text-xs">
                        {d.quantity || d.shipment?.quantity || '—'} units
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{d.completedAt ? new Date(d.completedAt).toLocaleString() : '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          {d.photoBeforeUrl && <a href={d.photoBeforeUrl} target="_blank" className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200">📷 Before</a>}
                          {d.photoAfterUrl && <a href={d.photoAfterUrl} target="_blank" className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200">📷 After</a>}
                          {d.videoUrl && <a href={d.videoUrl} target="_blank" className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs hover:bg-slate-200">🎬 Video</a>}
                          {d.certificateUrl && <a href={d.certificateUrl} target="_blank" className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs hover:bg-emerald-200">📄 Cert</a>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-semibold text-slate-900">Alerts</h2>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No alerts.</p>
            ) : alerts.map((a: any) => (
              <div key={a.id} className={`p-3 rounded-xl border text-sm
                ${a.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                <p className="font-medium leading-snug">{a.message}</p>
                <p className="text-xs opacity-60 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
