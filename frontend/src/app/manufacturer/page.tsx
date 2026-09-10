import Link from "next/link";
import { getManufacturerDashboard } from "@/app/actions/batches";
import { redirect } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ManufacturerDashboard() {
  const data = await getManufacturerDashboard();
  if (!data) redirect('/login');

  const { batches, stats, alerts, shipments, incomingReturns = [] } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manufacturer Dashboard</h1>
          <p className="text-slate-500 text-sm">Full supply chain visibility from your manufacturing plant.</p>
        </div>
        <div className="flex gap-2 items-center">
          <a href="/manufacturer" className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5" title="Refresh dashboard">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </a>
          <Link href="/manufacturer/receive" className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5">
            <span>📦</span>
            <span>Receive Returns {incomingReturns.length > 0 && `(${incomingReturns.length})`}</span>
          </Link>
          <Link href="/manufacturer/batches/new" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Add New Batch
          </Link>
        </div>
      </div>

      {/* Action Required: Incoming Near-Expiry Returns Alert */}
      {incomingReturns.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div>
                <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                  <span>Action Required:</span>
                  <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {incomingReturns.length} Return Consignment{incomingReturns.length === 1 ? '' : 's'} In-Transit
                  </span>
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  Distributors have dispatched near-expiry returned stock with verified OCG Gatepass sheets. Verify dual QR codes and proof photos to accept intake.
                </p>
              </div>
            </div>
            <Link
              href="/manufacturer/receive"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              Review & Receive Intake →
            </Link>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Available Stock', value: `${stats.totalStock} units`, icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'blue' },
          { label: 'Total Batches', value: batches.length, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', color: 'indigo' },
          { label: 'In Transit', value: stats.inTransit, icon: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4', color: 'sky' },
          { label: 'Near Expiry / Expired', value: stats.nearExpiry, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'amber' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <div className={`p-2 bg-${color}-50 text-${color}-600 rounded-lg`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon}/></svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      {/* Alerts + Batches grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-semibold text-slate-900">All Batches</h2>
            <Link href="/manufacturer/batches/new" className="text-xs text-blue-600 hover:underline font-medium">+ Create</Link>
          </div>
          {batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
              <p className="text-sm">No batches yet. <Link href="/manufacturer/batches/new" className="text-blue-500 hover:underline">Create your first batch</Link></p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Batch #</th>
                    <th className="px-5 py-3 text-left font-medium">Medicine</th>
                    <th className="px-5 py-3 text-left font-medium">Stock (Avail / Total)</th>
                    <th className="px-5 py-3 text-left font-medium">Expiry</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">QR</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((b: any) => (
                    <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/manufacturer/batches/${b.id}`} className="font-mono text-blue-600 hover:underline font-medium">{b.batchNumber}</Link>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{b.medicineName}</div>
                        <div className="text-xs text-slate-500 capitalize">{b.medicineType}</div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-slate-900">
                          {b.availableQuantity ?? 0} <span className="text-xs font-normal text-slate-500">/ {b.totalQuantity} units</span>
                        </div>
                        {(b.availableQuantity ?? 0) === 0 ? (
                          <span className="text-[10px] text-amber-600 font-medium block">All units dispatched/allotted</span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-medium block">Ready in warehouse</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{new Date(b.expDate).toLocaleDateString()}</td>
                      <td className="px-5 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-5 py-3">
                        <Link href={`/manufacturer/batches/${b.id}`} className="text-xs text-blue-500 hover:underline">View QR →</Link>
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
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>
            <h2 className="font-semibold text-slate-900">Live Alerts</h2>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No new alerts.</p>
            ) : alerts.map((a) => (
              <div key={a.id} className={`p-3 rounded-xl border text-sm
                ${a.type === 'danger' ? 'bg-red-50 border-red-100 text-red-800' :
                  a.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                  a.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                  'bg-blue-50 border-blue-100 text-blue-800'}`}>
                <p className="font-medium leading-snug">{a.message}</p>
                <p className="text-xs opacity-60 mt-1">{new Date(a.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Shipments */}
      {shipments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-semibold text-slate-900">Recent Shipments</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Shipment #</th>
                  <th className="px-5 py-3 text-left font-medium">Type</th>
                  <th className="px-5 py-3 text-left font-medium">To</th>
                  <th className="px-5 py-3 text-left font-medium">Qty</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {shipments.slice(0, 10).map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-slate-700 font-medium">{s.shipmentNumber}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.type} /></td>
                    <td className="px-5 py-3 text-slate-600">{s.toName}</td>
                    <td className="px-5 py-3 text-slate-600">{s.quantity}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/shipments/${s.id}/mandate`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print Mandate
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
