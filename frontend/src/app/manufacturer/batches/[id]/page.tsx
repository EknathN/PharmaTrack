import { getBatchDetail } from "@/app/actions/batches";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import Link from "next/link";
import BatchRectificationCard from "@/components/BatchRectificationCard";
import Barcode from "@/components/Barcode";
import DualPackagingLabel from "@/components/DualPackagingLabel";
import { formatUnitBarcode } from "@/lib/barcodeHelper";

export default async function BatchDetailPage({ params }: { params: { id: string } }) {
  const data = await getBatchDetail(params.id);
  if (!data) notFound();

  const { batch, shipments, disposalRecord } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/manufacturer" className="text-sm text-blue-600 hover:underline">← Back to Dashboard</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{batch.medicineName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-mono text-slate-500 text-sm">{batch.batchNumber}</span>
            <StatusBadge status={batch.status} />
            <span className="text-xs text-slate-400 bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-full">🔒 Locked</span>
          </div>
        </div>
        <div className="flex gap-2">
          {!batch.isFrozen && (
            <Link href={`/manufacturer/shipments/new?batchId=${batch.id}`} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
              Ship This Batch →
            </Link>
          )}
        </div>
      </div>

      {batch.isFrozen && (
        <BatchRectificationCard
          batchId={batch.id}
          batchNumber={batch.batchNumber}
          medicineName={batch.medicineName}
          freezeReason={batch.freezeReason}
          hasPendingRectification={batch.hasPendingRectification}
        />
      )}

      {/* Unified Dual Packaging Security Label (QR + Barcode at the same place, downloadable as single image) */}
      <DualPackagingLabel
        medicineName={batch.medicineName}
        batchNumber={batch.batchNumber}
        mfgDate={batch.mfgDate}
        expDate={batch.expDate}
        packagingType={batch.packagingType || batch.unitDetails}
        manufacturerName={batch.manufacturerName}
        qrCodeUrl={batch.qrCode}
        totalQuantity={batch.totalQuantity || 100}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch Details (immutable) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Batch Details (Immutable Record)
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ['Batch Number', batch.batchNumber],
                ['Medicine Name', batch.medicineName],
                ['Medicine Type', batch.medicineType],
                ['Manufacturer', batch.manufacturerName],
                ['Manufacturing Date', new Date(batch.mfgDate).toLocaleDateString()],
                ['Expiry Date', new Date(batch.expDate).toLocaleDateString()],
                ['Total Quantity', `${batch.totalQuantity} units`],
                ['Pack Details', batch.unitDetails],
                ['Created At', new Date(batch.createdAt).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide">{k}</dt>
                  <dd className="mt-1 font-medium text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* History Timeline */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Full Journey Timeline</h2>
            <div className="relative">
              {batch.history.map((event, i) => (
                <div key={i} className="flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center flex-shrink-0 z-10">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    </div>
                    {i < batch.history.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1"></div>}
                  </div>
                  <div className="pt-1 pb-3">
                    <p className="font-semibold text-slate-900 text-sm">{event.event}</p>
                    {event.details && <p className="text-xs text-slate-500 mt-0.5">{event.details}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      {event.actorName} ({event.actorRole}) · {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disposal Certificate */}
          {disposalRecord?.status === 'completed' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <h2 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Disposal Certificate Available
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {disposalRecord.photoBeforeUrl && <a href={disposalRecord.photoBeforeUrl} target="_blank" className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50">📷 Photo Before</a>}
                {disposalRecord.photoAfterUrl && <a href={disposalRecord.photoAfterUrl} target="_blank" className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50">📷 Photo After</a>}
                {disposalRecord.videoUrl && <a href={disposalRecord.videoUrl} target="_blank" className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50">🎬 Video Proof</a>}
                {disposalRecord.certificateUrl && <a href={disposalRecord.certificateUrl} target="_blank" className="flex items-center gap-2 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50">📄 Certificate</a>}
              </div>
              <p className="text-xs text-emerald-600 mt-3">Disposed by: {disposalRecord.disposerName} on {disposalRecord.completedAt ? new Date(disposalRecord.completedAt).toLocaleString() : 'N/A'}</p>
            </div>
          )}
        </div>

        {/* QR Code + Shipments */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
            <h3 className="font-semibold text-slate-900 mb-3">Medicine QR Code</h3>
            <img src={batch.qrCode} alt="Batch QR Code" className="w-48 h-48 mx-auto" />
            <div className="mt-3 text-left">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Encoded QR Content:</span>
              <pre className="text-xs text-slate-700 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                {batch.qrData}
              </pre>
            </div>
            <a href={batch.qrCode} download={`${batch.batchNumber}-QR.png`} className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Download QR
            </a>
          </div>

          {/* Engraved Unit Barcode Specification */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900 text-sm">Engraved Unit Barcode</h3>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold uppercase">
                Code 128
              </span>
            </div>

            <p className="text-xs text-slate-500 text-left">
              Each individual unit packaging ({batch.packagingType || 'bottle / strip / cream tube'}) carries an engraved serial barcode scanned at retail checkout and bio-hazard disposal:
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
              <Barcode
                value={formatUnitBarcode(batch.batchNumber, 1, batch.mfgDate, batch.expDate)}
                height={52}
                moduleWidth={2.4}
                showText={true}
                showDownload={true}
                barColor="#000000"
              />
              <span className="text-[11px] text-slate-500 font-mono font-bold mt-2">
                Serial Range: {formatUnitBarcode(batch.batchNumber, 1, batch.mfgDate, batch.expDate)} ... {formatUnitBarcode(batch.batchNumber, Math.min(batch.totalQuantity || 10, 200), batch.mfgDate, batch.expDate)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-left space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <span>⚡ High-Speed 1D Barcode (Easy to Scan)</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Short, clean Code 128 format with bold optical bars for effortless scanning across budget webcams, smartphone dual cameras, and retail barcode guns. Scanned units are instantly tracked at Retail checkout and Bio-Hazard disposal.
              </p>
            </div>
          </div>

          {/* Shipments */}
          {shipments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Shipments</h3>
              <div className="space-y-2">
                {shipments.map(s => (
                  <div key={s.id} className="p-3 bg-slate-50 rounded-xl text-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-slate-700 font-medium">{s.shipmentNumber}</div>
                      <Link
                        href={`/shipments/${s.id}/mandate`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        Print Mandate
                      </Link>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{s.fromName} → {s.toName}</div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs text-slate-500 font-mono">{s.quantity} units</span>
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
