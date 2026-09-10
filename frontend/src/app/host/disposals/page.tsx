import Link from "next/link";
import { readDb } from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HostDisposalsPage() {
  const db = await readDb();

  const disposals = db.disposalRecords || [];
  disposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const completed = disposals.filter(d => d.status === 'completed');
  const totalUnitsDisposed = completed.reduce((sum, d) => sum + (d.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bio-Disposal & Destruction Audits</h1>
          <p className="text-slate-500 text-sm">Official regulatory records of incinerated expired pharmaceuticals, photo/video evidence, and state destruction certificates.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-right">
            <span className="text-xs text-slate-400 block font-medium">Disposed Units</span>
            <span className="text-lg font-bold text-orange-600 font-mono">{totalUnitsDisposed.toLocaleString()} units</span>
          </div>
          <a
            href="/host/disposals"
            className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            Refresh
          </a>
        </div>
      </div>

      {disposals.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
          No bio-disposal records logged in the system yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {disposals.map(rec => {
            const batch = db.batches.find(b => b.id === rec.batchId);

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">
                      DISPOSAL RECORD #{rec.id.substring(0, 8)}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {batch?.medicineName || 'Medicine'}
                    </h3>
                    <div className="text-xs font-mono text-blue-600 font-semibold mt-0.5">
                      {batch?.batchNumber}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase font-mono ${
                    rec.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {rec.status === 'completed' ? 'Disposed ✓' : 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">DISPOSER FACILITY</span>
                    <span className="text-slate-900 font-medium mt-0.5 block">{rec.disposerName}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[11px] block">QUANTITY DESTROYED</span>
                    <span className="text-orange-600 font-bold font-mono text-sm mt-0.5 block">
                      {rec.quantity?.toLocaleString() || 0} units
                    </span>
                  </div>
                </div>

                {/* Proof Gallery */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Destruction Verification Evidence:
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {rec.photoBeforeUrl ? (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-medium block">Before Incineration:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rec.photoBeforeUrl}
                          alt="Before destruction"
                          className="w-full h-24 object-cover rounded-xl border border-slate-200"
                        />
                      </div>
                    ) : (
                      <div className="h-24 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                        No before photo
                      </div>
                    )}

                    {rec.photoAfterUrl ? (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-medium block">After Residue:</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={rec.photoAfterUrl}
                          alt="After destruction"
                          className="w-full h-24 object-cover rounded-xl border border-slate-200"
                        />
                      </div>
                    ) : (
                      <div className="h-24 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                        No after photo
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                  {rec.certificateUrl && (
                    <a
                      href={rec.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span>📜 View Destruction Cert</span>
                    </a>
                  )}
                  {rec.videoUrl && (
                    <a
                      href={rec.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span>🎥 Video Log</span>
                    </a>
                  )}
                  {batch && (
                    <Link
                      href={`/host/batches/${batch.id}`}
                      className="ml-auto px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
                    >
                      Inspect Batch →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
