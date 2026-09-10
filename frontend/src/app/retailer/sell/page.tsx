"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordSale } from "@/app/actions/shipments";
import QrScanner from "@/components/QrScanner";
import { useRetailerLanguage } from "@/context/RetailerLanguageContext";

export default function RetailerSellPage() {
  const router = useRouter();
  const { t } = useRetailerLanguage();

  const [medicineQr, setMedicineQr] = useState('');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSale = async () => {
    if (!medicineQr || !quantity || parseInt(quantity) <= 0) {
      setError('Medicine QR and quantity are required.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const fd = new FormData();
    fd.set('medicineQr', medicineQr);
    fd.set('quantity', quantity);
    const res = await recordSale(fd);
    setIsSubmitting(false);
    if (res.success) setResult(res);
    else setError(res.error || 'Failed.');
  };

  if (result) return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900">{t('saleRecordedTitle', 'Sale Recorded!')}</h2>
      <p className="text-slate-500 mt-2">
        <strong>{quantity} {t('unitsOf', 'units of')}</strong> <strong>{result.medicineName}</strong> {t('unitsSoldMsg', 'sold.')} <strong>{result.remaining}</strong> {t('remainingMsg', 'units remaining.')}
      </p>
      {result.remaining < 20 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
          ⚠️ {t('lowStockNotice', 'Low Stock Alert! Only few units left. Consider ordering more.')}
        </div>
      )}
      <div className="flex gap-3 justify-center mt-6">
        <button
          onClick={() => { setResult(null); setMedicineQr(''); setQuantity(''); }}
          className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
        >
          {t('recordAnotherBtn', 'Record Another Sale')}
        </button>
        <button
          onClick={() => { router.refresh(); window.location.href = '/retailer'; }}
          className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          {t('navDashboard', 'Dashboard')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t('sellPageTitle', 'Record a Sale')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('sellPageSubtitle', 'Scan the medicine QR code and enter quantity sold to update inventory.')}</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium">{error}</div>}
        <QrScanner label={t('scanMedicineQr', 'Scan Medicine QR Code')} onScanned={setMedicineQr} placeholder="PHARMATRACK:BATCH:..." />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t('quantitySoldLabel', 'Quantity Sold')} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 text-sm"
            placeholder={t('quantitySoldPlaceholder', 'e.g. 10')}
          />
        </div>
        <button
          onClick={handleSale}
          disabled={isSubmitting || !medicineQr || !quantity}
          className="w-full py-3.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-40 shadow-xs"
        >
          {isSubmitting ? '...' : t('confirmSaleBtn', 'Confirm & Record Sale')}
        </button>
      </div>
    </div>
  );
}
