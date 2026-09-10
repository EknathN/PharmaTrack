"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createRestockOrder, getSuppliersForRole } from "@/app/actions/restock";

function RetailerOrderForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMedicine = searchParams.get("medicine") || "";
  const initialQty = searchParams.get("suggested_qty") || "50";
  const initialSupplier = searchParams.get("supplier_id") || "";

  const [medicineName, setMedicineName] = useState(initialMedicine);
  const [quantity, setQuantity] = useState(initialQty);
  const [supplierId, setSupplierId] = useState(initialSupplier);
  const [priority, setPriority] = useState<"standard" | "urgent">("urgent");
  const [notes, setNotes] = useState("Predictive auto-reorder replenishment.");

  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    getSuppliersForRole("distributor").then((list) => {
      setSuppliers(list);
      if (!initialSupplier && list.length > 0) {
        setSupplierId(list[0].id);
      }
    });
  }, [initialSupplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName || !quantity || parseInt(quantity) <= 0 || !supplierId) {
      setError("Please ensure medicine, valid quantity, and supplier distributor are selected.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const res = await createRestockOrder({
      medicineName,
      quantity: parseInt(quantity),
      supplierId,
      priority,
      notes,
    });

    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      setResult(res.order);
    }
  };

  if (result) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
          <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Purchase Order Placed!</h2>
        <p className="text-slate-600 mt-2 text-sm">
          Order <strong className="font-mono text-slate-900">{result.orderNumber}</strong> has been transmitted to{" "}
          <strong>{result.supplierName}</strong>.
        </p>

        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Medicine</span>
            <span className="font-semibold text-slate-900">{result.medicineName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Order Quantity</span>
            <span className="font-semibold text-emerald-700">{result.quantity} units</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Supplier (Distributor)</span>
            <span className="font-semibold text-slate-900">{result.supplierName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Restock Status</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              restock_pending
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Priority</span>
            <span className="capitalize font-semibold text-amber-700">{result.priority}</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs text-left flex items-start gap-2">
          <span className="text-base">ℹ️</span>
          <span>
            The stock alert for <strong>{result.medicineName}</strong> is now marked as <strong>Restock Pending</strong>.
            Duplicate stock alerts are suppressed while your order is being fulfilled.
          </span>
        </div>

        <div className="flex justify-center gap-3 mt-8">
          <Link
            href="/retailer"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors shadow-xs"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <Link href="/retailer" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2">
          ← Back to Retailer Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pre-Filled Purchase Order</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              One-click restocking from authorized distributors based on real-time sales velocity.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            ⚡ Quick Restock
          </span>
        </div>
      </div>

      {/* Predictive Context Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 mb-6 text-sm text-amber-900 shadow-xs flex items-start gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <strong className="font-semibold block">Predictive Velocity Recommendation Applied</strong>
          <span className="text-xs text-amber-800 leading-relaxed block mt-0.5">
            This order form has been automatically populated with the recommended restock parameters. You only need to verify and click <strong>Confirm Order</strong>.
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Medicine Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Medicine Name
          </label>
          <input
            type="text"
            value={medicineName}
            onChange={(e) => setMedicineName(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Order Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Recommended Quantity (Units)
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Suggested buffer for ~10–14 days of sales.
            </span>
          </div>

          {/* Supplier Distributor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Distributor (Supplier)
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Authorized supply chain partner.
            </span>
          </div>
        </div>

        {/* Priority & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Order Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              <option value="urgent">🚨 Urgent (Low Stock Fast Track)</option>
              <option value="standard">Standard Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Notes for Distributor
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/retailer"
            className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Placing Order...</span>
            ) : (
              <>
                <span>Confirm Order</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function RetailerOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading order form...</div>}>
      <RetailerOrderForm />
    </Suspense>
  );
}
