"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmReceipt, getIncomingShipments } from "@/app/actions/shipments";
import QrScanner from "@/components/QrScanner";
import ProofUpload from "@/components/ProofUpload";
import Link from "next/link";
import { useRetailerLanguage } from "@/context/RetailerLanguageContext";

function RetailerReceiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillShipmentId = searchParams.get('shipmentId');
  const { t } = useRetailerLanguage();

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

  // Fetch pending shipments addressed to this retailer
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
      } else {
        setError(res.error || 'Failed to confirm receipt.');
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

  if (result) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 px-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">{t('receiptSuccessTitle', 'Stock Successfully Received!')}</h2>
        <p className="text-slate-600 mt-2">
          <strong className="text-emerald-700 font-semibold">{result.quantity} units</strong> of{' '}
          <strong>{result.medicineName}</strong> {t('receiptSuccessSubtitle', 'have been confirmed and added to your active inventory.')}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Automated expiry monitoring is active. You can now sell this medicine or manage returns.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={navigateToDashboard}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>{t('viewInventoryBtn', 'View in Inventory')} →</span>
          </button>
          <button
            onClick={() => {
              setResult(null);
              setSelectedShipment(null);
              setShipmentQr('');
              setMedicineQr('');
              setQuantity('');
              setProofUrl('');
              setOcgProofUrl('');
              getIncomingShipments().then(list => setIncomingShipments(list.filter((s: any) => s.status === 'in_transit')));
            }}
            className="px-5 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
          >
            {t('receiveStockBtn', 'Receive Another Shipment')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('receivePageTitle', 'Receive Stock from Distributor')}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {t('receivePageSubtitle', 'Verify shipment details, scan QR codes, and upload courier proof to immediately add stock to your inventory.')}
          </p>
        </div>
        <Link href="/retailer" className="text-sm text-slate-500 hover:text-slate-700 font-medium">
          ← Cancel
        </Link>
      </div>

      {/* Pending Incoming Shipments Quick-Select */}
      {!isLoadingList && incomingShipments.length > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-emerald-900 text-sm flex items-center gap-2">
              <span>📦</span> Incoming Shipments In-Transit ({incomingShipments.length})
            </h3>
            <span className="text-xs text-emerald-700 font-medium">Click one to auto-fill</span>
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
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white/80 border-emerald-100 hover:bg-white hover:border-emerald-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-800">{s.shipmentNumber}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                        {s.quantity} units
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      <strong>{s.batch?.medicineName || 'Medicine'}</strong> · From: {s.fromName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyShipment(s);
                    }}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Auto-Fill'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedShipment && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
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
            className="text-emerald-700 hover:underline font-semibold"
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
            label={t('shipmentQrLabel', 'Step 1: Scan Shipment QR Code')}
            onScanned={(code) => setShipmentQr(code)}
            placeholder="PHARMATRACK:SHIPMENT:..."
          />
          {shipmentQr && (
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-medium">✓ Shipment QR captured</span>
              <code className="text-slate-500 font-mono truncate max-w-[280px]">{shipmentQr}</code>
            </div>
          )}
        </div>

        <div>
          <QrScanner
            label={t('medicineQrLabel', 'Step 2: Scan Medicine / Batch QR Code (on medicine box)')}
            onScanned={(code) => setMedicineQr(code)}
            placeholder="PHARMATRACK:BATCH:..."
          />
          {medicineQr && (
            <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-medium">✓ Medicine QR captured</span>
              <code className="text-slate-500 font-mono truncate max-w-[280px]">{medicineQr}</code>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('receivedQtyLabel', 'Step 3: Enter Quantity Received')} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            placeholder="Exact quantity on delivery"
          />
          <p className="text-xs text-slate-500 mt-1">Must match the quantity specified by the distributor.</p>
        </div>

        <ProofUpload
          label={t('proofPhotoLabel', 'Step 4: Upload Signed Courier Receipt Photo (POD)')}
          accept="image/*"
          required
          onUploaded={setProofUrl}
          hint="Upload a clear photo of the signed delivery confirmation document from the courier."
        />

        <ProofUpload
          label={t('ocgProofPhotoLabel', 'Step 5: Upload Physical OCG Sheet Verification Photo (Anti-Tamper)')}
          accept="image/*"
          required
          onUploaded={setOcgProofUrl}
          hint="Photograph the physical OCG Sheet on the consignment to verify cryptographic security alignment."
        />

        <button
          onClick={handleConfirm}
          disabled={isSubmitting || !shipmentQr || !medicineQr || !quantity || !proofUrl || !ocgProofUrl}
          className="w-full py-3.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Verifying & Adding to Inventory...</span>
            </>
          ) : (
            t('confirmReceiptBtn', 'Confirm Receipt & Add to Inventory')
          )}
        </button>
      </div>
    </div>
  );
}

export default function RetailerReceivePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading receive portal...</div>}>
      <RetailerReceiveContent />
    </Suspense>
  );
}
