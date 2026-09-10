"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initiateReturn, getRetailerInventory, uploadSenderProof } from "@/app/actions/shipments";
import ProofUpload from "@/components/ProofUpload";
import Link from "next/link";
import { useRetailerLanguage } from "@/context/RetailerLanguageContext";

function ReturnContent() {
  const router = useRouter();
  const params = useSearchParams();
  const prefillBatchId = params.get('batchId');
  const { t } = useRetailerLanguage();

  const [step, setStep] = useState<'form' | 'proof' | 'done'>('form');
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(prefillBatchId || '');
  const [destinationType, setDestinationType] = useState<'supplier' | 'manufacturer'>('supplier');
  const [shipmentResult, setShipmentResult] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [ocgProofUrl, setOcgProofUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRetailerInventory().then((items) => {
      setInventory(items);
      setIsLoading(false);
      if (prefillBatchId && items.some((i: any) => i.batchId === prefillBatchId)) {
        setSelectedBatchId(prefillBatchId);
      } else if (items.length > 0 && !selectedBatchId) {
        // Default to first near-expiry batch or first batch
        const near = items.find((i: any) => i.daysToExpiry !== null && i.daysToExpiry <= 60);
        setSelectedBatchId(near ? near.batchId : items[0].batchId);
      }
    }).catch(() => setIsLoading(false));
  }, [prefillBatchId]);

  const selectedInv = inventory.find((i: any) => i.batchId === selectedBatchId);

  // Auto-filled recipient ID based on selection
  const recipientId = destinationType === 'supplier'
    ? selectedInv?.supplier?.id || selectedInv?.batch?.manufacturerId || ''
    : selectedInv?.manufacturer?.id || selectedInv?.supplier?.id || '';

  const recipientName = destinationType === 'supplier'
    ? selectedInv?.supplier?.name || selectedInv?.batch?.manufacturerName || 'Supplier'
    : selectedInv?.manufacturer?.name || selectedInv?.supplier?.name || 'Manufacturer';

  const recipientRole = destinationType === 'supplier'
    ? selectedInv?.supplier?.role || 'distributor'
    : 'manufacturer';

  const returnQuantity = selectedInv?.returnableQuantity ?? selectedInv?.boughtQuantity ?? 0;

  const handleInitiate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBatchId) {
      setError('Please select a batch to return.');
      return;
    }
    if (!recipientId) {
      setError('Could not identify the authorized recipient for this batch.');
      return;
    }

    const availableQty = selectedInv?.quantity || 0;
    const requestedQty = parseInt(returnQuantity.toString());

    if (isNaN(requestedQty) || requestedQty <= 0) {
      setError('Please enter a valid return quantity.');
      return;
    }
    if (requestedQty > availableQty) {
      setError(`Cannot return more than available stock (${availableQty} units).`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const fd = new FormData();
      fd.set('batchId', selectedBatchId);
      fd.set('toId', recipientId);
      fd.set('quantity', requestedQty.toString());
      const res = await initiateReturn(fd);

      setIsSubmitting(false);

      if (res.success) {
        setShipmentResult(res);
        setStep('proof');
      } else {
        setError(res.error || 'Failed to initiate return shipment.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'A network error occurred.');
    }
  };

  const handleProof = async () => {
    if (!proofUrl || !ocgProofUrl || !shipmentResult) {
      setError('Please upload both the signed courier proof photo AND the physical OCG Security Sheet photo.');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const res = await uploadSenderProof(shipmentResult.shipmentId, proofUrl, ocgProofUrl);
      setIsSubmitting(false);
      if (res.success) {
        setStep('done');
      } else {
        setError(res.error || 'Failed to confirm dispatch proof.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'A network error occurred.');
    }
  };

  const navigateToDashboard = () => {
    router.refresh();
    window.location.href = '/retailer';
  };

  if (step === 'done') {
    return (
      <div className="max-w-xl mx-auto text-center py-16 px-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{t('returnSuccessTitle', 'Return Shipment In Transit!')}</h2>
        <p className="text-slate-600 mt-2">
          Return Shipment <strong>#{shipmentResult?.shipmentNumber}</strong> for{' '}
          <strong className="text-amber-700 font-semibold">{returnQuantity} units</strong> of{' '}
          <strong>{selectedInv?.batch?.medicineName}</strong> is verified with OCG Order Alignment and dispatched to{' '}
          <strong>{recipientName}</strong>.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Stock has been removed from active inventory and both parties have been alerted.
        </p>
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
          <button
            onClick={navigateToDashboard}
            className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors shadow-sm text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (step === 'proof') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload Dispatch Verification Proofs</h1>
          <p className="text-slate-500 text-sm mt-1">
            Hand sealed return packages to the courier and upload both the signed POD receipt and the physical OCG Security Sheet.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-amber-900">Return Shipment #{shipmentResult?.shipmentNumber} Created ✓</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Returning <strong>{returnQuantity} units</strong> to <strong>{recipientName}</strong>.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-200/60">
              <a
                href={`/shipments/${shipmentResult?.shipmentId}/mandate`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 text-amber-900 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors shadow-xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Mandate
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
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Proof 1: Courier POD */}
          <ProofUpload
            label="1. Signed Courier Receipt / POD Photo"
            accept="image/*"
            required
            onUploaded={setProofUrl}
            hint="Upload a clear photo of the signed courier docket or consignment note confirming pickup."
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
            onClick={handleProof}
            disabled={isSubmitting || !proofUrl || !ocgProofUrl}
            className="w-full py-3.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Confirming Dual-Proof...</span>
              </>
            ) : (
              'Confirm Return Dispatch → Mark In Transit'
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('returnPageTitle', 'Initiate Near-Expiry Return')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('returnPageSubtitle', 'Supplier and bought quantity are automatically identified from delivery provenance.')}
          </p>
        </div>
        <Link href="/retailer" className="text-sm text-slate-500 hover:text-slate-700 font-medium">
          ← Cancel
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        {error && (
          <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center text-slate-400">Loading inventory provenance...</div>
        ) : inventory.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">{t('noInventory', 'No inventory items available to return.')}</p>
            <Link href="/retailer" className="mt-3 inline-block text-xs text-emerald-600 hover:underline font-medium">
              {t('backToDashboardBtn', 'Go to Dashboard')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleInitiate} className="space-y-6">
            {/* Batch Selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {t('selectBatchLabel', 'Select Batch to Return')} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none bg-white font-medium text-slate-800"
              >
                <option value="">Choose batch from inventory...</option>
                {inventory.map((i: any) => (
                  <option key={i.batchId} value={i.batchId}>
                    {i.batch?.batchNumber} — {i.batch?.medicineName} ({i.quantity} units, {i.daysToExpiry}d to expiry)
                  </option>
                ))}
              </select>
            </div>

            {selectedInv && (
              <>
                {/* Provenance Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Delivery Provenance
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                      ✓ Origin Verified
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-slate-400 block">Bought From (Supplier):</span>
                      <strong className="text-slate-800 font-semibold">
                        {selectedInv.supplier?.name || 'Distributor'}
                      </strong>
                      <span className="text-slate-400 block text-[11px] capitalize">
                        Role: {selectedInv.supplier?.role || 'distributor'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Original Manufacturer:</span>
                      <strong className="text-slate-800 font-semibold">
                        {selectedInv.manufacturer?.name || selectedInv.batch?.manufacturerName || 'Apex Pharma'}
                      </strong>
                      {selectedInv.supplier?.shipmentNumber && (
                        <span className="text-slate-400 block text-[11px] font-mono">
                          Shipment: #{selectedInv.supplier.shipmentNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Auto-filled Return Recipient */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('recipientLabel', 'Return Destination')} <span className="text-xs text-emerald-700 font-medium">✓ Auto-filled</span>
                  </label>
                  <div className="space-y-2">
                    {/* Supplier option */}
                    <label
                      onClick={() => setDestinationType('supplier')}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        destinationType === 'supplier'
                          ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="destChoice"
                          checked={destinationType === 'supplier'}
                          onChange={() => setDestinationType('supplier')}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedInv.supplier?.name || 'Original Distributor'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {t('distributorOption', 'Supplying Distributor (From delivery shipment)')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Recommended
                      </span>
                    </label>

                    {/* Manufacturer option */}
                    {selectedInv.manufacturer?.id && selectedInv.manufacturer?.id !== selectedInv.supplier?.id && (
                      <label
                        onClick={() => setDestinationType('manufacturer')}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          destinationType === 'manufacturer'
                            ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="destChoice"
                            checked={destinationType === 'manufacturer'}
                            onChange={() => setDestinationType('manufacturer')}
                            className="text-amber-600 focus:ring-amber-500"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {selectedInv.manufacturer?.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {t('manufacturerOption', 'Original Manufacturer (Direct Return)')}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Direct
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Non-Editable Quantity Bought / to Return */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      {t('returnQuantityLabel', 'Quantity to Return')} <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      🔒 Non-editable
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      required
                      readOnly
                      name="quantity"
                      type="number"
                      value={returnQuantity}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-900 font-semibold cursor-not-allowed outline-none select-none pl-10"
                    />
                    <span className="absolute left-3.5 top-3.5 text-slate-400">🔒</span>
                    <span className="absolute right-3.5 top-3.5 text-xs bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md font-mono font-medium">
                      {returnQuantity} units
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Locked to the exact quantity bought ({selectedInv.boughtQuantity} units) and currently in your stock.
                    </span>
                  </p>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedBatchId || !recipientId || !returnQuantity}
                className="flex-1 py-3.5 bg-amber-600 text-white font-medium rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating Return...</span>
                  </>
                ) : (
                  t('initiateReturnBtn', 'Initiate Return →')
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RetailerReturnPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading return portal...</div>}>
      <ReturnContent />
    </Suspense>
  );
}
