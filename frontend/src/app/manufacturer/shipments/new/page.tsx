"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createShipment, uploadSenderProof, getUsersByRole } from "@/app/actions/shipments";
import { getManufacturerDashboard } from "@/app/actions/batches";
import ProofUpload from "@/components/ProofUpload";
import StatusBadge from "@/components/StatusBadge";

function NewShipmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillBatchId = searchParams.get('batchId');
  const orderId = searchParams.get('orderId');
  const prefillToId = searchParams.get('toId');
  const prefillQty = searchParams.get('qty');
  const prefillMedicine = searchParams.get('medicine');

  const [step, setStep] = useState<'form' | 'proof' | 'done'>('form');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(prefillBatchId || '');
  const [distributors, setDistributors] = useState<any[]>([]);
  const [shipmentResult, setShipmentResult] = useState<any>(null);
  const [shipmentQr, setShipmentQr] = useState<string>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [ocgProofUrl, setOcgProofUrl] = useState('');
  const [shipmentType, setShipmentType] = useState('forward');

  useEffect(() => {
    getManufacturerDashboard().then(d => {
      if (d) {
        setBatches(d.batches);
        if (prefillBatchId) {
          setSelectedBatchId(prefillBatchId);
        } else if (prefillMedicine) {
          const match = d.batches.find((b: any) => b.medicineName?.toLowerCase() === prefillMedicine.toLowerCase() && (b.availableQuantity ?? 0) > 0) ||
                        d.batches.find((b: any) => b.medicineName?.toLowerCase() === prefillMedicine.toLowerCase());
          if (match) setSelectedBatchId(match.id);
          else if (d.batches.length > 0) setSelectedBatchId(d.batches[0].id);
        } else if (d.batches.length > 0) {
          setSelectedBatchId(d.batches[0].id);
        }
      }
    });
    getUsersByRole('distributor').then(setDistributors);
  }, [prefillBatchId, prefillMedicine]);

  // Filter batches based on shipment type:
  // - forward (to distributor): valid, unexpired stock
  // - disposal (to disposer): strictly expired or near-expiry stock
  const eligibleBatches = batches.filter(b => {
    if (['fully_disposed', 'return_in_transit', 'disposal_in_transit'].includes(b.status)) return false;
    if (shipmentType === 'disposal') {
      return b.status === 'near_expiry';
    }
    return b.status === 'in_stock';
  });

  const selectedBatch = batches.find(b => b.id === selectedBatchId);
  const availableQty = selectedBatch?.availableQuantity ?? selectedBatch?.totalQuantity ?? 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBatchId) { setError('Select a batch.'); return; }
    if (availableQty <= 0) {
      setError(`Cannot dispatch: Batch ${selectedBatch?.batchNumber} has 0 units available.`);
      return;
    }
    setIsSubmitting(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    formData.set('type', shipmentType);
    if (orderId) {
      formData.set('orderId', orderId);
    }
    const res = await createShipment(formData);
    setIsSubmitting(false);
    if (res.success) {
      setShipmentResult(res);
      const db = await getManufacturerDashboard();
      const ship = db?.shipments.find((s: any) => s.id === res.shipmentId);
      if (ship) setShipmentQr(ship.qrCode);
      setStep('proof');
    } else {
      setError(res.error || 'Failed to create shipment.');
    }
  };

  const handleUploadProof = async () => {
    if (!proofUrl || !ocgProofUrl || !shipmentResult) {
      setError('Please upload both the Courier POD photo and the physical OCG Security Sheet photo.');
      return;
    }
    setIsSubmitting(true);
    const res = await uploadSenderProof(shipmentResult.shipmentId, proofUrl, ocgProofUrl);
    setIsSubmitting(false);
    if (res.success) {
      setStep('done');
    } else {
      setError(res.error || 'Failed to upload proof.');
    }
  };

  if (step === 'done') {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Shipment In Transit!</h2>
        <p className="text-slate-500 mt-2">Shipment #{shipmentResult?.shipmentNumber} is verified with OCG Order Alignment and marked as <strong>In Transit</strong>.</p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <a
            href={`/shipments/${shipmentResult?.shipmentId}/mandate`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-sm transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print Shipping Mandate
          </a>
          <a
            href={`/shipments/${shipmentResult?.shipmentId}/ocg`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm transition-colors text-sm"
          >
            <span>🛡️ Print OCG Sheet</span>
          </a>
          <button onClick={() => { router.refresh(); window.location.href = '/manufacturer'; }} className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors text-sm">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (step === 'proof') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload Dispatch Verification Proofs</h1>
          <p className="text-slate-500 text-sm mt-1">Upload both the signed courier POD and physical OCG security sheet to prevent tampering.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">Shipment #{shipmentResult?.shipmentNumber} Created ✓</p>
                <p className="text-xs text-blue-700 mt-0.5">Print security documents and attach with the consignment.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 border-t border-blue-200/60">
              <a
                href={`/shipments/${shipmentResult?.shipmentId}/mandate`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Mandate Label
              </a>
              <a
                href={`/shipments/${shipmentResult?.shipmentId}/ocg`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-xs"
              >
                <span>🛡️ Print OCG Security Sheet</span>
              </a>
            </div>
          </div>

          {shipmentQr && (
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700 mb-2">Shipment QR Code</p>
              <img src={shipmentQr} alt="Shipment QR" className="w-36 h-36 mx-auto border border-slate-200 rounded-lg p-1" />
              <a href={shipmentQr} download={`${shipmentResult?.shipmentNumber}-QR.png`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">Download QR</a>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

          {/* Proof 1: Courier POD */}
          <ProofUpload
            label="1. Courier Signed Receipt / POD Photo"
            accept="image/*"
            required
            onUploaded={setProofUrl}
            hint="Upload a clear photo of the courier's signed proof of delivery / consignment note."
          />

          {/* Proof 2: OCG Sheet Photo */}
          <ProofUpload
            label="2. OCG Sheet Photo Verification (Anti-Tamper Order Alignment)"
            accept="image/*"
            required
            onUploaded={setOcgProofUrl}
            hint="Photograph the physical signed OCG Sheet alongside the parcel to lock cryptographic order alignment and prevent QR forgery."
          />

          <button
            onClick={handleUploadProof}
            disabled={isSubmitting || !proofUrl || !ocgProofUrl}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'Confirming Dual-Proof...' : 'Confirm Dispatch → Mark In Transit'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Shipment</h1>
        <p className="text-slate-500 text-sm mt-1">Select the batch and recipient to generate a Shipment QR code.</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
        
        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">Shipment Type</label>
          <div className="flex gap-2">
            {[{v: 'forward', l: 'To Distributor (Valid Stock)'}, {v: 'disposal', l: 'To Disposer (Expired/Near-Expiry)'}].map(t => (
              <button key={t.v} type="button" onClick={() => setShipmentType(t.v)}
                className={`flex-1 py-2.5 px-3 text-xs md:text-sm font-medium rounded-xl border transition-all ${shipmentType === t.v ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm font-semibold' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {t.l}
              </button>
            ))}
          </div>
        </div>

        {shipmentType === 'disposal' && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <div>
              <strong>Disposal Rule:</strong> Disposers only accept expired or returned near-expiry stock for bio-destruction. Fresh/valid batches cannot be sent to Disposers.
            </div>
          </div>
        )}

        {orderId && (
          <div className="mb-4 p-3.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📦</span>
              <span>Fulfilling Procurement Order from Distributor. Dispatching this package will automatically mark the purchase order as dispatched.</span>
            </div>
            <span className="font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-bold">
              Linked Order
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Batch <span className="text-red-500">*</span>
            </label>
            {eligibleBatches.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-center">
                {shipmentType === 'disposal' ? (
                  <>
                    <p className="font-semibold text-slate-800">No Expired Stock Found</p>
                    <p className="mt-1">You have no batches marked as expired or near expiry. Valid stock must be sent to Distributors.</p>
                  </>
                ) : (
                  <p>No batches available for shipment.</p>
                )}
              </div>
            ) : (
              <select
                required
                name="batchId"
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-sm"
              >
                <option value="">Choose a batch...</option>
                {eligibleBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} — {b.medicineName} {b.isExpired ? '[EXPIRED]' : b.isNearExpiry ? '[Near Expiry]' : ''} · Avail: {b.availableQuantity ?? 0} units
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedBatch && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Available in Plant:</span>
                <span className={`font-bold ${availableQty > 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  {availableQty} units (of {selectedBatch.totalQuantity} total)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiry Date:</span>
                <span className={`font-semibold ${selectedBatch.isExpired ? 'text-red-600' : selectedBatch.isNearExpiry ? 'text-amber-600' : 'text-slate-700'}`}>
                  {new Date(selectedBatch.expDate).toLocaleDateString()} {selectedBatch.isExpired ? '(EXPIRED)' : selectedBatch.isNearExpiry ? '(Near Expiry)' : ''}
                </span>
              </div>
              {availableQty === 0 && (
                <p className="text-red-600 font-medium pt-1">
                  ⚠️ 0 units available. All {selectedBatch.totalQuantity} units of this batch have already been allotted or dispatched.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {shipmentType === 'disposal' ? 'Select Disposer' : 'Select Distributor'} <span className="text-red-500">*</span>
            </label>
            <RecipientSelect type={shipmentType === 'disposal' ? 'disposer' : 'distributor'} defaultValue={prefillToId || undefined} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Quantity to Ship <span className="text-red-500">*</span></label>
            <input
              required
              name="quantity"
              type="number"
              min="1"
              max={availableQty > 0 ? availableQty : undefined}
              disabled={availableQty === 0}
              defaultValue={prefillQty || ''}
              placeholder={availableQty > 0 ? `Max: ${availableQty} units` : '0 units available'}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
            <textarea
              name="notes"
              rows={2}
              defaultValue={orderId ? `Fulfilling procurement order for ${prefillQty || ''} units` : ''}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
              placeholder="Any notes for the recipient..."
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting || availableQty === 0 || eligibleBatches.length === 0}
              className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : availableQty === 0 ? '0 Units Available' : 'Create Shipment & Generate QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecipientSelect({ type, defaultValue }: { type: string; defaultValue?: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState(defaultValue || '');

  useEffect(() => {
    getUsersByRole(type).then((list) => {
      setUsers(list);
      if (defaultValue && list.some(u => u.id === defaultValue)) {
        setSelected(defaultValue);
      }
    });
  }, [type, defaultValue]);

  const selectedUser = users.find(u => u.id === selected);

  return (
    <div className="space-y-2">
      <select
        required
        name="toId"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-sm"
      >
        <option value="">Choose recipient...</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>
            {u.name} — {u.city ? `${u.city}, ${u.state || ''}` : u.email}
          </option>
        ))}
      </select>

      {selectedUser && selectedUser.address && (
        <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-blue-900">
            <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Registered Courier Delivery Address</span>
          </div>
          <p className="text-slate-700 leading-relaxed pl-5">
            {selectedUser.address}, {selectedUser.city}, {selectedUser.state} - <span className="font-mono font-semibold">{selectedUser.pincode}</span>
          </p>
          {selectedUser.phone && (
            <p className="text-slate-500 pl-5">
              Contact: <span className="font-medium text-slate-700">{selectedUser.phone}</span>
              {selectedUser.licenseNumber && ` · License: ${selectedUser.licenseNumber}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewShipmentPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-500">Loading...</div>}>
      <NewShipmentContent />
    </Suspense>
  );
}
