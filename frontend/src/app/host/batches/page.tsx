import Link from "next/link";
import { readDb } from "@/lib/db";
import { freezeBatch, unfreezeBatch, flagBatch, unflagBatch } from "@/app/actions/host";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HostBatchesPage({
  searchParams,
}: {
  searchParams?: { q?: string; status?: string };
}) {
  const db = await readDb();
  const now = Date.now();

  const query = (searchParams?.q || '').toLowerCase().trim();
  const statusFilter = searchParams?.status || 'all';

  let filtered = db.batches || [];

  if (query) {
    filtered = filtered.filter(b =>
      b.batchNumber.toLowerCase().includes(query) ||
      b.medicineName.toLowerCase().includes(query) ||
      b.manufacturerName.toLowerCase().includes(query)
    );
  }

  if (statusFilter === 'frozen') {
    filtered = filtered.filter(b => b.isFrozen);
  } else if (statusFilter === 'flagged') {
    filtered = filtered.filter(b => b.isFlagged);
  } else if (statusFilter === 'near_expiry') {
    filtered = filtered.filter(b => {
      const expMs = new Date(b.expDate).getTime();
      return (expMs - now) <= 60 * 24 * 60 * 60 * 1000 || b.status === 'near_expiry';
    });
  } else if (statusFilter === 'disposed') {
    filtered = filtered.filter(b => b.status === 'fully_disposed');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Pharmaceutical Batches</h1>
          <p className="text-slate-500 text-sm">Full nationwide registry of all manufactured batches, holdings, and status.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/host/reports"
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            Export CSV
          </Link>
          <a
            href="/host/batches"
            className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            Refresh
          </a>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form method="GET" className="flex-1 w-full flex items-center gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchParams?.q || ''}
            placeholder="Search by batch number (e.g. BN-202609), medicine name, or manufacturer..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shrink-0"
          >
            Search
          </button>
          {query && (
            <Link
              href="/host/batches"
              className="text-xs text-slate-500 hover:text-slate-800 underline shrink-0 px-1"
            >
              Clear
            </Link>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'All Batches' },
            { id: 'near_expiry', label: 'Near Expiry (≤60d)' },
            { id: 'frozen', label: 'Frozen ❄️' },
            { id: 'flagged', label: 'Flagged ⚠️' },
            { id: 'disposed', label: 'Fully Disposed' },
          ].map(tab => (
            <Link
              key={tab.id}
              href={`/host/batches?status=${tab.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === tab.id
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Batches Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-semibold text-slate-900 text-sm">
            Showing {filtered.length} Batch Record{filtered.length === 1 ? '' : 's'}
          </h2>
          <span className="text-xs text-slate-400 font-mono">Real-Time Provenance Verified</span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No pharmaceutical batches matched your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Batch Serial</th>
                  <th className="px-5 py-3">Medicine Formulation</th>
                  <th className="px-5 py-3">Manufacturer</th>
                  <th className="px-5 py-3">Mfg / Expiry</th>
                  <th className="px-5 py-3">Total Qty</th>
                  <th className="px-5 py-3">Active Stock Ownership</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Regulatory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map(batch => {
                  const expMs = new Date(batch.expDate).getTime();
                  const daysLeft = Math.ceil((expMs - now) / (1000 * 60 * 60 * 24));
                  const isExpired = daysLeft <= 0;

                  const holdings = db.inventory.filter(i => i.batchId === batch.id && i.quantity > 0);

                  return (
                    <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">
                        <Link href={`/host/batches/${batch.id}`} className="hover:underline">
                          {batch.batchNumber}
                        </Link>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-900">{batch.medicineName}</div>
                        <div className="text-[11px] text-slate-400 capitalize">{batch.medicineType} · {batch.unitDetails}</div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {batch.manufacturerName}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        <div>Mfg: {batch.mfgDate}</div>
                        <div className={`font-semibold ${isExpired ? 'text-rose-600 font-bold' : daysLeft <= 60 ? 'text-amber-600 font-bold' : 'text-slate-600'}`}>
                          Exp: {batch.expDate} ({isExpired ? 'EXPIRED' : `${daysLeft}d left`})
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                        {batch.totalQuantity.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5">
                        {holdings.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">Exhausted / Disposed</span>
                        ) : (
                          <div className="space-y-1">
                            {holdings.map(h => {
                              const user = db.users.find(u => u.id === h.ownerId);
                              return (
                                <div key={h.id} className="text-[11px] flex items-center justify-between gap-3">
                                  <span className="text-slate-700 truncate max-w-[130px] font-medium">{user?.name || h.ownerRole}</span>
                                  <span className="font-mono text-emerald-600 font-semibold">{h.quantity} units</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                            Inspect →
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
                              <input type="hidden" name="reason" value="Regulatory Investigation Hold" />
                              <button
                                type="submit"
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-medium transition-colors"
                                title="Emergency Freeze"
                              >
                                Freeze ❄️
                              </button>
                            </form>
                          )}

                          {!batch.isFrozen && (
                            batch.isFlagged ? (
                              <form action={async (formData) => { "use server"; await unflagBatch(formData); }}>
                                <input type="hidden" name="batchId" value={batch.id} />
                                <button
                                  type="submit"
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Unflag
                                </button>
                              </form>
                            ) : (
                              <form action={async (formData) => { "use server"; await flagBatch(formData); }}>
                                <input type="hidden" name="batchId" value={batch.id} />
                                <input type="hidden" name="reason" value="Surveillance Notice" />
                                <button
                                  type="submit"
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium transition-colors"
                                >
                                  Flag ⚠️
                                </button>
                              </form>
                            )
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
    </div>
  );
}
