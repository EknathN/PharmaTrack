"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createShipment, uploadSenderProof, getDistributorDashboard } from "@/app/actions/shipments";
import ProofUpload from "@/components/ProofUpload";
import Link from "next/link";

function DistributorShipContent() {
  const router = useRouter();
  const params = useSearchParams();
  const prefillBatchId = params.get('batchId');
  const returnTo = params.get('returnTo'); // 'manufacturer' when forwarding returns
  const isReturn = returnTo === 'manufacturer';

  const [step, setStep] = useState<'form' | 'proof' | 'done'>('form');
  const [data, setData] = useState<any>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(prefillBatchId || '');
  const [shipmentResult, setShipmentResult] = useState<any>(null);
  const [shipmentQr, setShipmentQr] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getDistributorDashboard().then((res) => {
      setData(res);
      if (prefillBatchId && res?.inventory?.some((i: any) => i.batchId === prefillBatchId)) {
        setSelectedBatchId(prefillBatchId);
      } else if (res?.inventory && res.inventory.length > 0 && !selectedBatchId) {
        setSelectedBatchId(res.inventory[0].batchId);
      }
    });
  }, [prefillBatchId]);

  const selectedInv = data?.inventory.find((i: any) => i.batchId === selectedBatchId);
  const selectedBatch = selectedInv?.batch;

  // If returning to manufacturer, auto-fill manufacturer ID
  const defaultToId = isReturn ? selectedBatch?.manufacturerId : '';

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    fd.set('type', isReturn ? 'return' : 'forward');
    if (isReturn && defaultToId) {
      fd.set('toId', defaultToId);
    }
    const res = await createShipment(fd);
    setIsSubmitting(false);
    if (res.success) {
      setShipmentResult(res);
      const fresh = await getDistributorDashboard();
      const ship = fresh?.outgoingShipments.find((s: any) => s.id === res.shipmentId);
      if (ship) setShipmentQr(ship.qrCode);
      setStep('proof');
    } else {
      setError(res.error || 'Failed to create shipment.');
    }
  };

  const handleProof = async () => {
    if (!proofUrl || !shipmentResult) {
      setError('Please upload dispatch proof first.');
      return;
    }
    setIsSubmitting(true);
    const res = await uploadSenderProof(shipmentResult.shipmentId, proofUrl);
    setIsSubmitting(false);
    if (res.success) {
      setStep('done');
    } else {
      setError(res.error || 'Failed to upload proof.');
    }
  };

  if (step === 'done') {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          {isReturn ? 'Return Dispatched to Manufacturer!' : 'Shipment In Transit!'}
        </h2>
        <p className="text-slate-600 mt-2">
          Shipment #{shipmentResult?.shipmentNumber} is now marked as <strong>In Transit</strong>.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <a
            href={`/shipments/${shipmentResult?.shipmentId}/mandate`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print Shipping Mandate
          </a>
          <button
            onClick={() => {
              router.refresh();
              window.location.href = isReturn ? '/distributor/returns' : '/distributor';
            }}
            className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            Back to {isReturn ? 'Returns' : 'Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'proof') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload Dispatch Proof</h1>
          <p className="text-slate-500 text-sm mt-1">Upload the courier signed receipt to confirm dispatch.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-semibold text-violet-900">Shipment #{shipmentResult?.shipmentNumber} Created ✓</p>
              <p className="text-xs text-violet-700 mt-1">
                Print shipping mandate & upload courier confirmation.
              </p>
            </div>
            <a
              href={`/shipments/${shipmentResult?.shipmentId}/mandate`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-violet-200 text-violet-700 text-xs font-semibold rounded-lg hover:bg-violet-50 transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Mandate
            </a>
          </div>
          {shipmentQr && (
            <div className="text-center">
              <img src={shipmentQr} alt="Shipment QR" className="w-36 h-36 mx-auto rounded-lg border border-slate-200 p-1" />
              <a href={shipmentQr} download={`Shipment-${shipmentResult?.shipmentNumber}.png`} className="text-xs text-violet-600 hover:underline mt-1 inline-block">
                Download QR Code
              </a>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}
          <ProofUpload
            label="Courier Signed Receipt Photo"
            accept="image/*"
            required
            onUploaded={setProofUrl}
            hint="Upload a clear photo of the courier delivery confirmation."
          />
          <button
            onClick={handleProof}
            disabled={isSubmitting || !proofUrl}
            className="w-full py-3.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Confirming...' : 'Confirm Dispatch → Mark In Transit'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isReturn ? 'Forward Return to Manufacturer' : 'Ship Stock to Retailer'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isReturn
              ? 'Return near-expiry products back to the original manufacturer.'
              : 'Select from your inventory and create a shipment to an authorized retailer.'}
          </p>
        </div>
        <Link href={isReturn ? '/distributor/returns' : '/distributor'} className="text-sm text-slate-500 hover:text-slate-700 font-medium">
          ← Cancel
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Batch from Inventory <span className="text-red-500">*</span>
            </label>
            <select
              required
              name="batchId"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white"
            >
              <option value="">Choose batch from inventory...</option>
              {data?.inventory.map((i: any) => (
                <option key={i.batchId} value={i.batchId}>
                  {i.batch?.batchNumber} — {i.batch?.medicineName} ({i.quantity} units available)
                </option>
              ))}
            </select>
          </div>

          {isReturn ? (
            /* Auto-filled Manufacturer Recipient */
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Destination Manufacturer <span className="text-xs text-emerald-600 font-medium">✓ Auto-filled</span>
              </label>
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedBatch?.manufacturerName || 'Original Manufacturer'}
                  </p>
                  <p className="text-xs text-slate-500">Original manufacturer of this batch</p>
                </div>
                <span className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded font-mono font-medium">
                  Auto-locked
                </span>
              </div>
              <input type="hidden" name="toId" value={defaultToId} />
            </div>
          ) : (
            /* Regular Retailer Selector */
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Retailer <span className="text-red-500">*</span>
              </label>
              <select
                required
                name="toId"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white"
              >
                <option value="">Choose retailer...</option>
                {data?.retailers.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Quantity <span className="text-red-500">*</span>
              </label>
              {isReturn && (
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  🔒 Non-editable
                </span>
              )}
            </div>
            {isReturn ? (
              <div className="relative">
                <input
                  required
                  readOnly
                  name="quantity"
                  type="number"
                  value={selectedInv?.quantity || 0}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-900 font-semibold cursor-not-allowed outline-none select-none pl-10"
                />
                <span className="absolute left-3.5 top-3.5 text-slate-400">🔒</span>
                <span className="absolute right-3.5 top-3.5 text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-mono font-medium">
                  {selectedInv?.quantity || 0} units
                </span>
              </div>
            ) : (
              <input
                required
                name="quantity"
                type="number"
                min="1"
                max={selectedInv?.quantity || undefined}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                placeholder={`Available: ${selectedInv?.quantity || 0} units`}
              />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedBatchId || (isReturn && !defaultToId)}
              className="flex-1 py-3.5 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? 'Creating...' : isReturn ? 'Initiate Return to Mfr →' : 'Create Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DistributorShipPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading shipment portal...</div>}>
      <DistributorShipContent />
    </Suspense>
  );
}
