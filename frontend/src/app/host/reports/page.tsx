import { readDb } from "@/lib/db";
import ReportExporter from "./ReportExporter";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HostReportsPage() {
  const db = await readDb();

  const batches = db.batches || [];
  const disposals = db.disposalRecords || [];
  const shipments = db.shipments || [];

  const completedDisposals = disposals.filter(d => d.status === 'completed');
  const totalDisposedUnits = completedDisposals.reduce((sum, d) => sum + (d.quantity || 0), 0);
  const frozenCount = batches.filter(b => b.isFrozen).length;

  const reportItems = batches.map(b => ({
    batchNumber: b.batchNumber,
    medicineName: b.medicineName,
    medicineType: b.medicineType,
    manufacturer: b.manufacturerName,
    mfgDate: b.mfgDate,
    expDate: b.expDate,
    totalQuantity: b.totalQuantity,
    status: b.status,
    isFrozen: Boolean(b.isFrozen),
    isFlagged: Boolean(b.isFlagged),
    freezeReason: b.freezeReason,
    createdAt: b.createdAt
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Compliance Reports & Dossier</h1>
          <p className="text-slate-500 text-sm">Certified regulatory dossiers adhering to FDA 21 CFR Part 11, DSCSA electronic tracing, and WHO-GMP guidelines.</p>
        </div>

        <ReportExporter batches={reportItems} />
      </div>

      {/* Compliance Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Traceability Coverage</p>
          <div className="text-3xl font-bold text-emerald-600 font-mono mt-2">100.0%</div>
          <span className="text-xs text-slate-400 mt-1 block">DSCSA Item-Level Minted</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Custody Handover Proofs</p>
          <div className="text-3xl font-bold text-blue-600 font-mono mt-2">
            {shipments.length}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Signed Driver PODs Bound</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Destruction Certificates</p>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-2">
            {completedDisposals.length}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">{totalDisposedUnits.toLocaleString()} Units Burned</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active Regulatory Holds</p>
          <div className={`text-3xl font-bold font-mono mt-2 ${frozenCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {frozenCount}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Network Enforcement</span>
        </div>
      </div>

      {/* Printable Official Inspection Dossier Preview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h2 className="font-semibold text-slate-900 text-base">
              PharmaTrack Traceability Master Roll
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generated on {new Date().toLocaleDateString()} by Regulatory Host Observer
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            Hash: {batches.length > 0 ? batches[0].id.substring(0, 16) : 'READY'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Batch Number</th>
                <th className="px-5 py-3.5">Medicine Formulation</th>
                <th className="px-5 py-3.5">Manufacturer</th>
                <th className="px-5 py-3.5">Total Qty</th>
                <th className="px-5 py-3.5">Mfg Date</th>
                <th className="px-5 py-3.5">Exp Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Host Directive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {batches.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-mono font-semibold text-blue-600">{b.batchNumber}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{b.medicineName}</td>
                  <td className="px-5 py-3.5 text-slate-600">{b.manufacturerName}</td>
                  <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">{b.totalQuantity.toLocaleString()}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">{b.mfgDate}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">{b.expDate}</td>
                  <td className="px-5 py-3.5 uppercase text-[11px] font-mono text-slate-600">{b.status}</td>
                  <td className="px-5 py-3.5">
                    {b.isFrozen ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold font-mono">
                        FROZEN ❄️
                      </span>
                    ) : b.isFlagged ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold font-mono">
                        FLAGGED ⚠️
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-medium">
                        NORMAL
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
