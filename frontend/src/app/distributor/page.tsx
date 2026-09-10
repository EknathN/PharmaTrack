import Link from "next/link";
import { getDistributorDashboard } from "@/app/actions/shipments";
import { getSmartRestockRecommendations } from "@/app/actions/restock";
import { redirect } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import SmartRestockWidget from "@/components/SmartRestockWidget";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DistributorDashboard() {
  const data = await getDistributorDashboard();
  if (!data) redirect('/login');

  const { inventory, incomingShipments, outgoingShipments, alerts } = data;
  const pendingReceipts = incomingShipments.filter((s: any) => s.status !== 'received');

  // Fetch predictive smart restock recommendations based on wholesale velocity
  const smartRestockRecommendations = await getSmartRestockRecommendations(14);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Distributor Dashboard</h1>
          <p className="text-slate-500 text-sm">Manage incoming stock, forward to retailers, and handle returns.</p>
        </div>
        <div className="flex gap-2 items-center">
          <a href="/distributor" className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5" title="Refresh inventory and alerts">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Refresh
          </a>
          <Link href="/distributor/receive" className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors">Receive Stock</Link>
          <Link href="/distributor/shipments/new" className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 transition-colors">Ship to Retailer</Link>
        </div>
      </div>

      {/* Smart Restock Recommendations */}
      <SmartRestockWidget recommendations={smartRestockRecommendations} role="distributor" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Inventory Items', value: inventory.length, icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4', color: 'violet' },
          { label: 'Incoming (Pending)', value: pendingReceipts.length, icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16', color: 'blue' },
          { label: 'Outgoing', value: outgoingShipments.length, icon: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4', color: 'indigo' },
          { label: 'Alerts', value: alerts.length, icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', color: 'amber' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-3">{label}</p>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-semibold text-slate-900">My Inventory</h2>
          </div>
          {inventory.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-sm">No inventory yet. <Link href="/distributor/receive" className="text-violet-500 hover:underline">Receive stock</Link> from a manufacturer.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Batch #</th>
                    <th className="px-5 py-3 text-left font-medium">Medicine</th>
                    <th className="px-5 py-3 text-left font-medium">Qty</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((i: any) => (
                    <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-slate-700">{i.batch?.batchNumber || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-900">{i.batch?.medicineName || '—'}</div>
                        <div className="text-xs text-slate-500">Exp: {i.batch ? new Date(i.batch.expDate).toLocaleDateString() : '—'}</div>
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{i.quantity}</td>
                      <td className="px-5 py-3"><StatusBadge status={i.status} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Link href={`/distributor/shipments/new?batchId=${i.batchId}`} className="text-xs text-violet-600 hover:underline font-medium">Ship →</Link>
                          <Link href={`/distributor/shipments/new?batchId=${i.batchId}&returnTo=manufacturer`} className="text-xs text-amber-600 hover:underline font-medium">Return to Mfr →</Link>
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
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span></span>
            <h2 className="font-semibold text-slate-900">Live Alerts</h2>
          </div>
          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No new alerts.</p>
            ) : alerts.map((a: any) => (
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

      {/* Incoming Shipments requiring action */}
      {pendingReceipts.length > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
          <h2 className="font-semibold text-violet-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            Action Required — Incoming Shipments ({pendingReceipts.length})
          </h2>
          <div className="space-y-2">
            {pendingReceipts.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-violet-100">
                <div>
                  <p className="font-mono font-medium text-slate-800 text-sm">{s.shipmentNumber}</p>
                  <p className="text-xs text-slate-500">From: {s.fromName} — {s.quantity} units of {s.batch?.medicineName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/shipments/${s.id}/mandate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md border border-indigo-200 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Mandate
                  </Link>
                  <StatusBadge status={s.status} />
                  <Link href={`/distributor/receive?shipmentId=${s.id}`} className="text-xs text-violet-600 hover:underline font-medium">Receive →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
