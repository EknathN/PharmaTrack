"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBatch } from "@/app/actions/batches";

const MEDICINE_TYPES = ['Tablet', 'Capsule', 'Syrup', 'Tonic', 'Injection', 'Cream', 'Drops', 'Gel', 'Powder', 'Other'];

export default function NewBatchPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');

  const generateBatchNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `BN-${year}${month}-${randomSuffix}`;
  };

  useEffect(() => {
    setBatchNumber(generateBatchNumber());
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const res = await createBatch(formData);
    setIsSubmitting(false);
    if (res.success) {
      router.push(`/manufacturer/batches/${res.batchId}`);
    } else {
      setError(res.error || 'Failed to create batch.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create New Batch</h1>
        <p className="text-slate-500 text-sm mt-1">All details are permanently locked after creation. A unique QR code will be generated.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
        {error && <div className="mb-5 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Name <span className="text-red-500">*</span></label>
              <input required name="medicineName" type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Amoxicillin 500mg" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Batch Number <span className="text-red-500">*</span></label>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Auto-Generated
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  required
                  name="batchNumber"
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full pl-4 pr-24 py-3 font-mono font-semibold text-slate-800 bg-slate-50/50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. BN-202609-1234"
                />
                <button
                  type="button"
                  onClick={() => setBatchNumber(generateBatchNumber())}
                  title="Generate new batch number"
                  className="absolute right-2 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 border border-blue-200/60"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  New
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Unique batch number generated automatically. Click New to regenerate.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medicine Type <span className="text-red-500">*</span></label>
              <select required name="medicineType" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white">
                {MEDICINE_TYPES.map(t => <option key={t} value={t.toLowerCase()}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Manufacturing Date <span className="text-red-500">*</span></label>
              <input
                required
                name="mfgDate"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date <span className="text-red-500">*</span></label>
              <input required name="expDate" type="date" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
              <p className="text-xs text-slate-400 mt-1">Batches expiring within 60 days or past expiry will automatically be flagged for disposal.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Quantity (Units) <span className="text-red-500">*</span></label>
              <input required name="totalQuantity" type="number" min="1" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. 10000" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Unit/Pack Details <span className="text-red-500">*</span></label>
              <input required name="unitDetails" type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. 10 capsules/strip, 10 strips/box, 100 boxes" />
              <p className="text-xs text-slate-500 mt-1">Describe the packaging format in detail.</p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <strong>⚠️ Important:</strong> Once you submit, all batch details will be permanently locked and cannot be edited by anyone. A unique QR code will be generated for printing.
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="flex-1 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50">
              {isSubmitting ? 'Creating & Generating QR...' : 'Create Batch & Generate QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
