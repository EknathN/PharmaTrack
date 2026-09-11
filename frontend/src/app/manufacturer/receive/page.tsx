"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmReceipt, getIncomingShipments } from "@/app/actions/shipments";
import QrScanner from "@/components/QrScanner";
import ProofUpload from "@/components/ProofUpload";
import Link from "next/link";

function ManufacturerReceiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillShipmentId = searchParams.get('shipmentId');

  const [step, setStep] = useState<'scan' | 'confirm' | 'done'>('scan');
  const [incomingShipments, setIncomingShipments] = useState<any[]>([]);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [shipmentQr, setShipmentQr] = useState('');
  const [medicineQr, setMedicineQr] = useState('');
  const [quantity, setQuantity] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [ocgProofUrl, setOcgProofUrl] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(true);

  useEffect(() => {
    getIncomingShipments().then(list => {
      const inTransit = list.filter((s: any) => s.status === 'in_transit');
      setIncomingShipments(inTransit);
      setIsLoadingList(false);

      if (prefillShipmentId) {
        const found = inTransit.find((s: any) => s.id === prefillShipmentId);
        if (found) {
          applyShipment(found);
        }
      }
    }).catch(() => setIsLoadingList(false));
  }, [prefillShipmentId]);

  const applyShipment = (shipment: any) => {
    setSelectedShipment(shipment);
    setShipmentQr(shipment.qrData || `PHARMATRACK:SHIPMENT:${shipment.id}`);
    if (shipment.batch?.qrData) {
      setMedicineQr(shipment.batch.qrData);
    } else if (shipment.batchId) {
      setMedicineQr(`PHARMATRACK:BATCH:${shipment.batchId}`);
    }
    setQuantity(shipment.quantity.toString());
    setError('');
  };

  const handleConfirm = async () => {
    if (!shipmentQr || !medicineQr || !quantity || !proofUrl || !ocgProofUrl) {
      setError('All fields are required: both QR codes, quantity, signed courier proof photo, and physical OCG sheet verification photo.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const fd = new FormData();
    fd.set('shipmentQr', shipmentQr);
    fd.set('medicineQr', medicineQr);
    fd.set('quantity', quantity);
    fd.set('proofUrl', proofUrl);
    fd.set('ocgProofUrl', ocgProofUrl);

    try {
      const res = await confirmReceipt(fd);
      setIsSubmitting(false);
      if (res.success) {
        setResult(res);
        setStep('done');
      } else {
        setError(res.error || 'Failed to confirm return receipt.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err?.message || 'A network error occurred.');
    }
  };

  const navigateToReturns = () => {
    router.refresh();
    window.location.href = '/manufacturer/returns';
  };

  if (step === 'done') {
    return (
      <div className="max-w-xl mx-auto text-center py-12 px-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Return Stock Successfully Received!</h2>
        <p className="text-slate-600 mt-2">
          <strong className="text-blue-700 font-semibold">{result?.quantity} units</strong> of{' '}
          <strong>{result?.medicineName}</strong> have been accepted back into your plant warehouse.
        </p>
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left">
          <p className="font-semibold">⚠️ Batch Quarantined as Near-Expiry</p>
          <p className="mt-1">
            This returned batch is flagged for bio-destruction or quarantine. You can now dispatch it to an authorized Disposer.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href={`/manufacturer/disposal/new?batchId=${result?.batchId}`}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors shadow-sm"
          >
            Send to Disposer →
          </Link>
          <button
            onClick={navigateToReturns}
            className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            View Returns List
          </button>
          <button
            onClick={() => {
              setStep('scan');
              setResult(null);
              setSelectedShipment(null);
              setShipmentQr('');
              setMedicineQr('');
              setQuantity('');
              setProofUrl('');
              setOcgProofUrl('');
              getIncomingShipments().then(list => setIncomingShipments(list.filter((s: any) => s.status === 'in_transit')));
            }}
            className="px-5 py-3 bg-slate-50 text-slate-600 rounded-xl font-medium hover:bg-slate-100 transition-colors"
          >
            Receive Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Receive Returned Stock from Supply Chain</h1>
          <p className="text-slate-500 text-sm mt-1">
            Scan both QR codes and verify physical OCG security alignment to accept returned near-expiry stock back into the manufacturing facility.
          </p>
        </div>
        <Link href="/manufacturer/returns" className="text-sm text-slate-500 hover:text-slate-700 font-medium">
          ← Cancel
        </Link>
      </div>

      {/* Quick-Select In-Transit Shipments */}
      {!isLoadingList && incomingShipments.length > 0 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-blue-900 text-sm flex items-center gap-2">
              <span>📦</span> Incoming Return Shipments In-Transit ({incomingShipments.length})
            </h3>
            <span className="text-xs text-blue-700 font-medium">Click one to auto-fill</span>
          </div>
          <div className="space-y-2">
            {incomingShipments.map((s: any) => {
              const isSelected = selectedShipment?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => applyShipment(s)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white/80 border-blue-100 hover:bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">↩️</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm font-mono">{s.shipmentNumber}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-medium">
                          {s.quantity} units
                        </span>
                        {s.ocgVerificationCode && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                            🛡️ {s.ocgVerificationCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        From: <strong className="text-slate-700">{s.fromName}</strong> ({s.fromRole}) · {s.batch?.medicineName}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? 'Selected ✓' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoadingList && incomingShipments.length === 0 && (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center text-slate-500 text-sm">
          <span className="text-2xl block mb-2">📭</span>
          No incoming return shipments in-transit right now. When a distributor dispatches a return, it will appear here.
        </div>
      )}

      {selectedShipment && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Pre-filled for Shipment <strong>#{selectedShipment.shipmentNumber}</strong> ({selectedShipment.quantity} units of {selectedShipment.batch?.medicineName})</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedShipment(null);
              setShipmentQr('');
              setMedicineQr('');
              setQuantity('');
            }}
            className="text-blue-700 hover:underline font-semibold"
          >
            Clear
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div>
          <QrScanner
            label="Step 1: Scan Return Shipment QR Code"
            scanType="shipment"
            onScanned={setShipmentQr}
            placeholder="PHARMATRACK:SHIPMENT:..."
          />
          {shipmentQr && (
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-blue-700 font-medium">✓ Shipment QR captured</span>
              <code className="text-slate-500 font-mono truncate max-w-[280px]">{shipmentQr}</code>
            </div>
          )}
        </div>

        <div>
          <QrScanner
            label="Step 2: Scan Medicine / Batch QR Code"
            scanType="medicine"
            onScanned={setMedicineQr}
            placeholder="PHARMATRACK:BATCH:..."
          />
          {medicineQr && (
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-blue-700 font-medium">✓ Medicine QR captured</span>
              <code className="text-slate-500 font-mono truncate max-w-[280px]">{medicineQr}</code>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Step 3: Enter Quantity Received <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            placeholder="Enter exact quantity received"
          />
          <p className="text-xs text-amber-600 mt-1">⚠️ Quantity must match the shipment. A mismatch will raise an alert.</p>
        </div>

        <ProofUpload
          label="Step 4: Upload Signed Courier Receipt Photo (POD)"
          accept="image/*"
          required
          onUploaded={setProofUrl}
          hint="Upload a clear photo of the courier's signed proof of delivery document."
        />

        <ProofUpload
          label="Step 5: Upload Physical OCG Sheet Verification Photo (Anti-Tamper)"
          accept="image/*"
          required
          onUploaded={setOcgProofUrl}
          hint="Photograph the physical OCG Sheet on the consignment to verify cryptographic security alignment."
        />

        <button
          onClick={handleConfirm}
          disabled={isSubmitting || !shipmentQr || !medicineQr || !quantity || !proofUrl || !ocgProofUrl}
          className="w-full py-3.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Verifying & Accepting Return Intake...</span>
            </>
          ) : (
            'Confirm Receipt & Accept Return Intake'
          )}
        </button>
      </div>
    </div>
  );
}

export default function ManufacturerReceivePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading receive portal...</div>}>
      <ManufacturerReceiveContent />
    </Suspense>
  );
}
