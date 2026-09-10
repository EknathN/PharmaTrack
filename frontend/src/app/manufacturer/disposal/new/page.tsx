"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createShipment, uploadSenderProof, getUsersByRole } from "@/app/actions/shipments";
import { getManufacturerDashboard } from "@/app/actions/batches";
import ProofUpload from "@/components/ProofUpload";

function DisposalContent() {
  const router = useRouter();
  const params = useSearchParams();
  const prefillBatchId = params.get('batchId');

  const [step, setStep] = useState<'form' | 'proof' | 'done'>('form');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(prefillBatchId || '');
  const [disposers, setDisposers] = useState<any[]>([]);
  const [shipmentResult, setShipmentResult] = useState<any>(null);
  const [shipmentQr, setShipmentQr] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getManufacturerDashboard().then(d => {
      if (d) {
        // Only show batches that are expired, near-expiry, or returned - never fresh unexpired stock
        const eligible = d.batches.filter((b: any) =>
          b.status !== 'fully_disposed' && (b.isExpired || b.isNearExpiry || b.status === 'near_expiry' || b.status === 'return_in_transit')
        );
        setBatches(eligible);
        if (prefillBatchId) {
          setSelectedBatchId(prefillBatchId);
        } else if (eligible.length > 0) {
          setSelectedBatchId(eligible[0].id);
        }
      }
    });
    getUsersByRole('disposer').then(setDisposers);
  }, [prefillBatchId]);

  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const availableQty = selectedBatch?.availableQuantity ?? 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBatch) {
      setError('Please select an expired or near-expiry batch.');
      return;
    }
    if (availableQty <= 0) {
      setError(`Cannot dispatch: Batch ${selectedBatch.batchNumber} has 0 units available in stock (all units already dispatched/allocated).`);
      return;
    }
    setIsSubmitting(true); setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('type', 'disposal');
    const res = await createShipment(fd);
    setIsSubmitting(false);
    if (res.success) {
      setShipmentResult(res);
      const db = await getManufacturerDashboard();
      const ship = db?.shipments.find((s: any) => s.id === res.shipmentId);
      if (ship) setShipmentQr(ship.qrCode);
      setStep('proof');
    } else setError(res.error || 'Failed.');
  };

  const handleProof = async () => {
    if (!proofUrl) { setError('Upload proof first.'); return; }
    setIsSubmitting(true);
    const res = await uploadSenderProof(shipmentResult.shipmentId, proofUrl);
    setIsSubmitting(false);
    if (res.success) setStep('done');
    else setError(res.error || 'Failed.');
  };

  if (step === 'done') return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Disposal Shipment In Transit</h2>
      <p className="text-slate-500 mt-2">The Disposer has been notified. You will be able to see the disposal certificate once they complete the process.</p>
      <button onClick={() => { router.refresh(); window.location.href = '/manufacturer'; }} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">Back to Dashboard</button>
    </div>
  );

  if (step === 'proof') return (
    <div className="max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Upload Dispatch Proof</h1>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
          <p className="font-semibold text-orange-900">Disposal Shipment #{shipmentResult?.shipmentNumber} Created ✓</p>
          <p className="text-sm text-orange-700 mt-1">Upload the signed courier receipt to confirm dispatch to the Disposer.</p>
        </div>
        {shipmentQr && <div className="text-center"><img src={shipmentQr} alt="QR" className="w-36 h-36 mx-auto"/></div>}
        {error && <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
        <ProofUpload label="Signed Courier Receipt" accept="image/*" required onUploaded={setProofUrl} />
        <button onClick={handleProof} disabled={isSubmitting || !proofUrl} className="w-full py-3 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 disabled:opacity-50">
          {isSubmitting ? 'Confirming...' : 'Confirm Dispatch to Disposer'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Send Stock to Disposer</h1>
        <p className="text-slate-500 text-sm mt-1">Only expired or near-expiry batches can be dispatched for safe bio-destruction.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <div>
            <strong>Disposer Rule:</strong> Disposers only accept expired or returned near-expiry stock. Fresh/valid batches cannot be sent here.
          </div>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
        
        {batches.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 className="font-semibold text-slate-800">No Expired Stock Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You currently have no batches marked as expired or near expiry. Unexpired medicines should be shipped to Distributors.
            </p>
            <button
              type="button"
              onClick={() => router.push('/manufacturer/shipments/new')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
            >
              Go to Ship Stock (Distributor)
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Expired / Near-Expiry Batch <span className="text-red-500">*</span></label>
              <select
                required
                name="batchId"
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white font-medium text-slate-800 text-sm"
              >
                <option value="">Choose batch...</option>
                {batches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} — {b.medicineName} [{b.isExpired ? 'EXPIRED' : 'Near Expiry'}] · Avail: {b.availableQuantity ?? 0} units
                  </option>
                ))}
              </select>
            </div>

            {selectedBatch && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Available Stock in Plant:</span>
                  <span className={`font-bold ${availableQty > 0 ? 'text-slate-900' : 'text-red-600'}`}>
                    {availableQty} units (of {selectedBatch.totalQuantity} total)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expiry Date:</span>
                  <span className={`font-semibold ${selectedBatch.isExpired ? 'text-red-600' : 'text-amber-600'}`}>
                    {new Date(selectedBatch.expDate).toLocaleDateString()} {selectedBatch.isExpired ? '(EXPIRED)' : '(Near Expiry)'}
                  </span>
                </div>
                {availableQty === 0 && (
                  <p className="text-red-600 font-medium pt-1">
                    ⚠️ 0 units available. All units of this batch have already been dispatched or allotted.
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Disposer <span className="text-red-500">*</span></label>
              <select required name="toId" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white">
                <option value="">Choose disposer...</option>
                {disposers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.email})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to Dispose <span className="text-red-500">*</span></label>
              <input
                required
                name="quantity"
                type="number"
                min="1"
                max={availableQty > 0 ? availableQty : undefined}
                disabled={availableQty === 0}
                placeholder={availableQty > 0 ? `Max: ${availableQty} units` : '0 units available'}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => router.back()} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200">Cancel</button>
              <button
                type="submit"
                disabled={isSubmitting || availableQty === 0}
                className="flex-1 py-3 bg-orange-600 text-white font-medium rounded-xl hover:bg-orange-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : availableQty === 0 ? '0 Units Available' : 'Create Disposal Shipment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ManufacturerDisposalPage() {
  return <Suspense fallback={<div className="text-center py-20 text-slate-500">Loading...</div>}><DisposalContent /></Suspense>;
}
