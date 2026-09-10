import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/db";
import { freezeBatch, unfreezeBatch, flagBatch, unflagBatch } from "@/app/actions/host";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HostBatchDetailPage({ params }: { params: { id: string } }) {
  const db = await readDb();
  const batch = db.batches.find(b => b.id === params.id || b.batchNumber === params.id);

  if (!batch) notFound();

  const now = Date.now();
  const expMs = new Date(batch.expDate).getTime();
  const daysRemaining = Math.ceil((expMs - now) / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;

  const shipments = db.shipments.filter(s => s.batchId === batch.id);
  const holdings = db.inventory.filter(i => i.batchId === batch.id && i.quantity > 0);
  const totalInInventory = holdings.reduce((sum, h) => sum + h.quantity, 0);

  const sales = db.sales.filter(s => s.batchId === batch.id);
  const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);

  const disposals = db.disposalRecords.filter(d => d.batchId === batch.id);
  const totalDisposed = disposals.filter(d => d.status === 'completed').reduce((sum, d) => sum + (d.quantity || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
            <Link href="/host/batches" className="hover:text-blue-600">All Batches</Link>
            <span>/</span>
            <span className="text-slate-600">{batch.batchNumber}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{batch.medicineName}</h1>
            {batch.isFrozen ? (
              <span className="text-xs px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-mono font-bold">
                ❄️ FROZEN BY HOST
              </span>
            ) : batch.isFlagged ? (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-mono font-bold">
                ⚠️ UNDER SURVEILLANCE
              </span>
            ) : (
              <StatusBadge status={batch.status} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/host/batches"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
          >
            ← Back to Batches
          </Link>
        </div>
      </div>

      {/* Freeze Directive Alert Banner if Active */}
      {batch.isFrozen && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❄️</span>
            <div>
              <h2 className="text-base font-bold text-rose-900">
                REGULATORY FREEZE DIRECTIVE ACTIVE
              </h2>
              <p className="text-xs text-rose-700">
                Reason: <strong>{batch.freezeReason || 'Regulatory Hold'}</strong> · Enforced by: <strong>{batch.frozenBy || 'Host Observer'}</strong> at {batch.frozenAt ? new Date(batch.frozenAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
          <p className="text-xs text-rose-700 leading-relaxed">
            All movements, dispatches, intakes, and retail POS sales regarding this batch are blocked nationwide.
          </p>
          <form action={async (formData) => { "use server"; await unfreezeBatch(formData); }}>
            <input type="hidden" name="batchId" value={batch.id} />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Lift Regulatory Freeze Directive ✓
            </button>
          </form>
        </div>
      )}

      {/* Overview Grid: Dossier + Regulatory Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Dossier Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase">OFFICIAL DOSSIER</span>
              <h3 className="text-lg font-bold text-slate-900 font-mono">{batch.batchNumber}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-mono">Current Status</span>
              <StatusBadge status={batch.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">TOTAL MINTED</span>
              <span className="text-slate-900 text-xl font-bold font-mono mt-1 block">{batch.totalQuantity.toLocaleString()}</span>
              <span className="text-[11px] text-slate-400">Fixed at origin</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">IN CIRCULATION</span>
              <span className="text-emerald-600 text-xl font-bold font-mono mt-1 block">{totalInInventory.toLocaleString()}</span>
              <span className="text-[11px] text-slate-400">{holdings.length} Node{holdings.length === 1 ? '' : 's'}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">DISPENSED (POS)</span>
              <span className="text-blue-600 text-xl font-bold font-mono mt-1 block">{totalSold.toLocaleString()}</span>
              <span className="text-[11px] text-slate-400">Patient verified</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">DISPOSED</span>
              <span className="text-orange-600 text-xl font-bold font-mono mt-1 block">{totalDisposed.toLocaleString()}</span>
              <span className="text-[11px] text-slate-400">Incinerated</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-700 block mb-2">Production & Specs</span>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5 text-slate-600">
                <span>Manufacturer:</span>
                <span className="font-medium text-slate-900">{batch.manufacturerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5 text-slate-600">
                <span>Formulation:</span>
                <span className="font-medium text-slate-900 capitalize">{batch.medicineType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5 text-slate-600">
                <span>Packaging:</span>
                <span className="font-medium text-slate-900">{batch.unitDetails}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Mfg Date:</span>
                <span className="font-medium text-slate-900 font-mono">{batch.mfgDate}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
              <span className="text-xs font-semibold text-slate-700 block mb-2">Expiry & QR Data</span>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5 text-slate-600">
                <span>Expiry Date:</span>
                <span className="font-medium text-slate-900 font-mono">{batch.expDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5 text-slate-600">
                <span>Shelf Status:</span>
                <span className={isExpired ? "text-rose-600 font-bold" : daysRemaining <= 60 ? "text-amber-600 font-bold" : "text-emerald-600 font-semibold"}>
                  {isExpired ? "EXPIRED" : `${daysRemaining} Days Left`}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5 text-slate-600">
                <span>QR Payload:</span>
                <span className="font-mono text-blue-600 truncate max-w-[150px]">{batch.qrData}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Mint Date:</span>
                <span className="font-medium text-slate-900">{new Date(batch.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Current Custody Holdings */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <span className="text-xs font-semibold text-slate-700 uppercase block">
              Current Physical Holdings ({holdings.length} Active Node{holdings.length === 1 ? '' : 's'})
            </span>
            {holdings.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No physical units remaining in circulation.</p>
            ) : (
              <div className="divide-y divide-slate-200/60 text-xs">
                {holdings.map(h => {
                  const user = db.users.find(u => u.id === h.ownerId);
                  return (
                    <div key={h.id} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-900">{user?.name || h.ownerId}</span>
                        <span className="text-[11px] text-slate-400 capitalize block">Role: {h.ownerRole}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-600">{h.quantity.toLocaleString()} units</span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {((h.quantity / batch.totalQuantity) * 100).toFixed(0)}% of batch
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Control Panel & QR Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Regulatory Interventions</h3>
              <p className="text-xs text-slate-500 mt-0.5">Issue legal holds or surveillance notices.</p>
            </div>

            {/* Freeze Action Form */}
            {!batch.isFrozen ? (
              <form action={async (formData) => { "use server"; await freezeBatch(formData); }} className="space-y-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                <input type="hidden" name="batchId" value={batch.id} />
                <span className="text-xs font-semibold text-rose-900 block font-mono">
                  🚨 Apply Emergency Freeze Directive
                </span>
                <p className="text-[11px] text-rose-700">
                  Blocks this batch from dispatch, transit, or retail POS sales network-wide.
                </p>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Regulatory Reason:
                  </label>
                  <input
                    type="text"
                    name="reason"
                    required
                    placeholder="e.g. Contamination report, failed lab test..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                >
                  Freeze Batch Network-Wide ❄️
                </button>
              </form>
            ) : (
              <form action={async (formData) => { "use server"; await unfreezeBatch(formData); }} className="space-y-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <input type="hidden" name="batchId" value={batch.id} />
                <span className="text-xs font-semibold text-emerald-900 block font-mono">
                  ✓ Lift Regulatory Hold
                </span>
                <p className="text-[11px] text-emerald-700">
                  Restores normal movement and dispense authorization.
                </p>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Clearance Remarks:
                  </label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="e.g. Quality re-verified..."
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                >
                  Authorize & Release Batch ✓
                </button>
              </form>
            )}

            {/* Flag / Unflag Form */}
            {!batch.isFrozen && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  {batch.isFlagged ? "⚠️ Active Surveillance Flag" : "Surveillance Flag"}
                </span>
                {batch.isFlagged ? (
                  <form action={async (formData) => { "use server"; await unflagBatch(formData); }}>
                    <input type="hidden" name="batchId" value={batch.id} />
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors"
                    >
                      Remove Surveillance Flag
                    </button>
                  </form>
                ) : (
                  <form action={async (formData) => { "use server"; await flagBatch(formData); }} className="space-y-2">
                    <input type="hidden" name="batchId" value={batch.id} />
                    <input
                      type="text"
                      name="reason"
                      placeholder="Surveillance notice reason..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors"
                    >
                      Flag for Observation ⚠️
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* QR Code Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center space-y-3">
            <span className="text-xs font-medium text-slate-500 block">Medicine Box QR</span>
            {batch.qrCode && (
              <div className="bg-white p-2 border border-slate-100 rounded-xl inline-block shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={batch.qrCode} alt="Batch QR" className="w-32 h-32 mx-auto" />
              </div>
            )}
            <pre className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap text-left leading-relaxed select-all">
              {batch.qrData}
            </pre>
            <Link
              href={`/verify?qr=${encodeURIComponent(batch.qrData)}`}
              className="text-xs text-blue-600 hover:underline font-medium block"
            >
              Open in Public Box Scanner →
            </Link>
          </div>
        </div>
      </div>

      {/* Complete Step-by-Step Chain of Custody */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="font-semibold text-slate-900 text-base">Complete Chain of Custody & Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-0.5">Chronological record of every scan, courier receipt, and custody transfer.</p>
        </div>

        <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-4">
          {batch.history.map((ev, idx) => (
            <div key={idx} className="relative">
              <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                ev.event.includes('FREEZE')
                  ? 'bg-rose-500'
                  : ev.event.includes('Created')
                  ? 'bg-blue-500'
                  : ev.event.includes('Received')
                  ? 'bg-emerald-500'
                  : 'bg-indigo-500'
              }`}></div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{ev.event}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {ev.actorRole}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(ev.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{ev.details || "Recorded on ledger."}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1">
                  Actor: {ev.actorName} ({ev.actorId.substring(0, 8)}...)
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Courier Proofs & OCG Verification */}
        {shipments.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Consignment Proofs & OCG Verification ({shipments.length})</h3>
              <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-medium">
                🛡️ Dual-Proof Anti-Tamper Secured
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shipments.map(s => (
                <div key={s.id} className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs space-y-3">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-blue-600">#{s.shipmentNumber}</span>
                    <span className="text-[10px] uppercase bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      {s.type} · {s.status}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] space-y-0.5">
                    <div>From: <strong className="text-slate-900">{s.fromName}</strong></div>
                    <div>To: <strong className="text-slate-900">{s.toName}</strong></div>
                    <div>Qty: <strong className="text-slate-900 font-mono">{s.quantity} units</strong></div>
                  </div>

                  {s.ocgVerificationCode && (
                    <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-lg p-2 text-[10px]">
                      <div className="text-emerald-800 font-semibold flex items-center justify-between font-mono">
                        <span>🛡️ OCG Code:</span>
                        <span className="font-bold">{s.ocgVerificationCode}</span>
                      </div>
                      <div className="text-emerald-700 text-[9px] mt-0.5">Order alignment cryptographic token active</div>
                    </div>
                  )}

                  <div className="space-y-2 pt-1 border-t border-slate-200/60">
                    <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide block">Dispatch Verification</span>
                    <div className="grid grid-cols-2 gap-2">
                      {s.senderProofUrl ? (
                        <div>
                          <span className="text-[9px] text-slate-500 block mb-1">Courier POD:</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.senderProofUrl} alt="POD" className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                        </div>
                      ) : (
                        <div className="h-20 bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                          No POD
                        </div>
                      )}
                      {s.senderOcgProofUrl ? (
                        <div>
                          <span className="text-[9px] text-emerald-700 font-medium block mb-1">OCG Sheet:</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.senderOcgProofUrl} alt="OCG Proof" className="w-full h-20 object-cover rounded-lg border border-emerald-300 shadow-xs" />
                        </div>
                      ) : (
                        <div className="h-20 bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-[9px] text-slate-400">
                          No OCG Photo
                        </div>
                      )}
                    </div>
                  </div>

                  {(s.receiverProofUrl || s.receiverOcgProofUrl) && (
                    <div className="space-y-2 pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] font-semibold text-slate-700 uppercase tracking-wide block">Receipt Intake Verification</span>
                      <div className="grid grid-cols-2 gap-2">
                        {s.receiverProofUrl ? (
                          <div>
                            <span className="text-[9px] text-slate-500 block mb-1">Receiver Proof:</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.receiverProofUrl} alt="Receipt Proof" className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                          </div>
                        ) : null}
                        {s.receiverOcgProofUrl ? (
                          <div>
                            <span className="text-[9px] text-emerald-700 font-medium block mb-1">Receiver OCG:</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={s.receiverOcgProofUrl} alt="Receiver OCG" className="w-full h-20 object-cover rounded-lg border border-emerald-300 shadow-xs" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center gap-2 text-[10px]">
                    <Link
                      href={`/shipments/${s.id}/ocg`}
                      target="_blank"
                      className="text-emerald-700 font-medium hover:underline flex items-center gap-1"
                    >
                      🛡️ View OCG Sheet
                    </Link>
                    <span className="text-slate-300">·</span>
                    <Link
                      href={`/shipments/${s.id}/mandate`}
                      target="_blank"
                      className="text-blue-600 font-medium hover:underline flex items-center gap-1"
                    >
                      📄 Shipping Mandate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
