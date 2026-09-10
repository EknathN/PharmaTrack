"use client";

import Link from "next/link";
import { useRetailerLanguage } from "@/context/RetailerLanguageContext";
import RetailerStatusBadge from "@/components/RetailerStatusBadge";
import SmartRestockWidget from "@/components/SmartRestockWidget";
import { cancelReturnShipment } from "@/app/actions/shipments";

interface RetailerDashboardViewProps {
  inventory: any[];
  alerts: any[];
  incomingShipments: any[];
  returnShipments: any[];
  nearExpiry: any[];
  totalUnits: number;
  smartRestockRecommendations?: any[];
}

export default function RetailerDashboardView({
  inventory,
  alerts,
  incomingShipments,
  returnShipments,
  nearExpiry,
  totalUnits,
  smartRestockRecommendations = [],
}: RetailerDashboardViewProps) {
  const { t } = useRetailerLanguage();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('title', 'Retailer Dashboard')}</h1>
          <p className="text-slate-500 text-sm">{t('subtitle', 'Sell medicines, monitor expiry, and manage returns.')}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <a
            href="/retailer"
            className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t('refresh', 'Refresh')}
          </a>
          <Link
            href="/retailer/receive"
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-xs"
          >
            {t('receiveStockBtn', 'Receive Stock')}
          </Link>
          <Link
            href="/retailer/sell"
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 transition-colors shadow-xs"
          >
            {t('recordSaleBtn', 'Record Sale')}
          </Link>
        </div>
      </div>

      {/* Near-Expiry Alert Banner */}
      {nearExpiry.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-lg mt-0.5">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 text-sm sm:text-base">
                {t('nearExpiryAlertTitle', '⚠️ NEAR-EXPIRY ALERT — Batch(es) Require Immediate Action!')} ({nearExpiry.length})
              </h3>
              <div className="mt-2 space-y-1.5">
                {nearExpiry.map((i: any) => (
                  <div key={i.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-lg p-2.5 border border-red-100 gap-2">
                    <div>
                      <span className="font-medium text-red-900 text-sm">{i.batch?.medicineName}</span>
                      <span className="text-red-600 text-xs ml-2 font-mono font-semibold">
                        ({i.daysToExpiry} {t('daysLeftText', 'days left!')})
                      </span>
                    </div>
                    <Link
                      href={`/retailer/returns/new?batchId=${i.batchId}`}
                      className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors self-start sm:self-center shrink-0"
                    >
                      {t('initiateReturnBtn', 'Initiate Return →')}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Restock Recommendations */}
      <SmartRestockWidget recommendations={smartRestockRecommendations} role="retailer" />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('kpiInventoryItems', 'Inventory Items'), value: inventory.length },
          { label: t('kpiTotalUnits', 'Total Units'), value: totalUnits.toLocaleString() },
          { label: t('kpiNearExpiry', 'Near Expiry'), value: nearExpiry.length, isWarning: nearExpiry.length > 0 },
          { label: t('kpiIncoming', 'Incoming'), value: incomingShipments.length },
        ].map(({ label, value, isWarning }) => (
          <div key={label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
            <div className={`text-3xl font-bold font-mono ${isWarning ? 'text-red-600' : 'text-slate-900'}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-semibold text-slate-900 text-base">{t('currentInventory', 'Current Inventory')}</h2>
              <span className="text-xs font-mono text-slate-400">{inventory.length} Batches</span>
            </div>

            {inventory.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-sm">
                  {t('noInventory', 'No inventory yet.')}{' '}
                  <Link href="/retailer/receive" className="text-emerald-600 hover:underline font-medium">
                    {t('receiveStockLink', 'Receive stock')}
                  </Link>{' '}
                  {t('fromDistributor', 'from a distributor.')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 uppercase border-b border-slate-100 bg-slate-50/50 font-semibold">
                    <tr>
                      <th className="px-5 py-3 text-left">{t('thBatch', 'Batch')}</th>
                      <th className="px-5 py-3 text-left">{t('thMedicine', 'Medicine')}</th>
                      <th className="px-5 py-3 text-left">{t('thQty', 'Qty')}</th>
                      <th className="px-5 py-3 text-left">{t('thExpiry', 'Expiry')}</th>
                      <th className="px-5 py-3 text-left">{t('thDaysLeft', 'Days Left')}</th>
                      <th className="px-5 py-3 text-left">{t('thAction', 'Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map((i: any) => {
                      const isNear = i.daysToExpiry !== null && i.daysToExpiry <= 60;
                      return (
                        <tr
                          key={i.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isNear ? 'bg-red-50/30' : ''
                          }`}
                        >
                          <td className="px-5 py-3 font-mono text-slate-600 text-xs font-semibold">
                            {i.batch?.batchNumber || '—'}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-900">
                            {i.batch?.medicineName || '—'}
                          </td>
                          <td className="px-5 py-3 font-mono font-semibold text-slate-900">
                            {i.quantity.toLocaleString()}
                          </td>
                          <td className="px-5 py-3 text-slate-500 text-xs font-mono">
                            {i.batch ? new Date(i.batch.expDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-5 py-3 font-mono">
                            {i.daysToExpiry !== null ? (
                              <span
                                className={`font-semibold text-xs ${
                                  i.daysToExpiry <= 30
                                    ? 'text-red-600'
                                    : i.daysToExpiry <= 60
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {i.daysToExpiry}d
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {i.batch?.isFrozen ? (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono">
                                {t('status_frozen', 'Frozen ❄️')}
                              </span>
                            ) : i.quantity < 20 ? (
                              <span className="text-xs text-amber-600 font-medium">
                                {t('lowStock', 'Low Stock!')}
                              </span>
                            ) : isNear ? (
                              <Link
                                href={`/retailer/returns/new?batchId=${i.batchId}`}
                                className="text-xs text-red-600 hover:underline font-medium"
                              >
                                {t('returnAction', 'Return →')}
                              </Link>
                            ) : (
                              <Link
                                href="/retailer/sell"
                                className="text-xs text-emerald-600 hover:underline font-medium"
                              >
                                {t('sellAction', 'Sell →')}
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h2 className="font-semibold text-slate-900 text-base">{t('liveAlerts', 'Live Alerts')}</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{alerts.length}</span>
          </div>

          <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">{t('noAlerts', 'No new alerts.')}</p>
            ) : (
              alerts.map((a: any) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-xl border text-xs sm:text-sm ${
                    a.type === 'danger'
                      ? 'bg-red-50 border-red-100 text-red-800'
                      : a.type === 'warning'
                      ? 'bg-amber-50 border-amber-100 text-amber-800'
                      : a.type === 'success'
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                      : 'bg-blue-50 border-blue-100 text-blue-800'
                  }`}
                >
                  <p className="font-medium leading-snug">{a.message}</p>
                  <p className="text-[10px] opacity-60 mt-1 font-mono">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Incoming Shipments */}
      {incomingShipments.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <h2 className="font-semibold text-emerald-900 mb-3 text-sm sm:text-base">
            {t('incomingTitle', 'Incoming Shipments Awaiting Receipt')} ({incomingShipments.length})
          </h2>
          <div className="space-y-2">
            {incomingShipments.map((s: any) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl p-3 border border-emerald-100 gap-2"
              >
                <div>
                  <p className="font-mono font-medium text-slate-800 text-sm">{s.shipmentNumber}</p>
                  <p className="text-xs text-slate-500">
                    {t('fromLabel', 'From:')} {s.fromName} — {s.quantity} {t('unitsOf', 'units of')} {s.batch?.medicineName}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Link
                    href={`/shipments/${s.id}/mandate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    {t('printMandateBtn', 'Print Mandate')}
                  </Link>
                  <Link
                    href={`/retailer/receive?shipmentId=${s.id}`}
                    className="text-xs text-emerald-600 hover:underline font-medium"
                  >
                    {t('receiveAction', 'Receive →')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return Shipments Initiated by Retailer */}
      {returnShipments.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5">
          <h2 className="font-semibold text-amber-900 mb-3 text-sm sm:text-base">
            {t('returnShipmentsTitle', 'Your Return Shipments')} ({returnShipments.length})
          </h2>
          <div className="space-y-2">
            {returnShipments.map((s: any) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-xl p-3 border border-amber-100 gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-medium text-slate-800 text-sm">{s.shipmentNumber}</p>
                    <RetailerStatusBadge status={s.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('toLabel', 'To:')} {s.toName} ({s.toRole}) — {s.quantity} {t('unitsOf', 'units of')} {s.batch?.medicineName}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Link
                    href={`/shipments/${s.id}/mandate`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    {t('printMandateBtn', 'Print Mandate')}
                  </Link>
                  {s.status !== 'received' && (
                    <form
                      action={async () => {
                        await cancelReturnShipment(s.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg font-medium transition-colors"
                        title="Undo this return and restore units to your inventory"
                      >
                        {t('undoReturnBtn', 'Undo Return')}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
