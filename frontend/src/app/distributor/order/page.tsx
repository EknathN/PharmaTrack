"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createRestockOrder, getSuppliersForRole } from "@/app/actions/restock";

function DistributorOrderForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialMedicine = searchParams.get("medicine") || "";
  const initialQty = searchParams.get("suggested_qty") || "100";
  const initialSupplier = searchParams.get("supplier_id") || "";

  const [medicineName, setMedicineName] = useState(initialMedicine);
  const [quantity, setQuantity] = useState(initialQty);
  const [supplierId, setSupplierId] = useState(initialSupplier);
  const [priority, setPriority] = useState<"standard" | "urgent">("urgent");
  const [notes, setNotes] = useState("Distributor replenishment based on retail demand velocity.");

  const [manufacturers, setManufacturers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    getSuppliersForRole("manufacturer").then((list) => {
      setManufacturers(list);
      if (!initialSupplier && list.length > 0) {
        setSupplierId(list[0].id);
      }
    });
  }, [initialSupplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName || !quantity || parseInt(quantity) <= 0 || !supplierId) {
      setError("Please ensure medicine, valid quantity, and manufacturer are selected.");
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
        <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xs">
          <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Procurement Order Placed!</h2>
        <p className="text-slate-600 mt-2 text-sm">
          Purchase Order <strong className="font-mono text-slate-900">{result.orderNumber}</strong> has been transmitted to manufacturer{" "}
          <strong>{result.supplierName}</strong>.
        </p>

        <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Medicine</span>
            <span className="font-semibold text-slate-900">{result.medicineName}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Procurement Quantity</span>
            <span className="font-semibold text-violet-700">{result.quantity} units</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Supplier (Manufacturer)</span>
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
            The warehouse stock alert for <strong>{result.medicineName}</strong> is now marked as <strong>Restock Pending</strong>.
            Duplicate stock alerts are suppressed until the manufacturer batch shipment arrives.
          </span>
        </div>

        <div className="flex justify-center gap-3 mt-8">
          <Link
            href="/distributor"
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl text-sm transition-colors shadow-xs"
          >
            Back to Distributor Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link href="/distributor" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2">
          ← Back to Distributor Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Distributor Procurement Order</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Order bulk batches directly from licensed manufacturers based on retail outbound velocity.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200">
            🏭 Direct Factory Restock
          </span>
        </div>
      </div>

      {/* Context Banner */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200/80 rounded-2xl p-4 mb-6 text-sm text-violet-950 shadow-xs flex items-start gap-3">
        <span className="text-2xl">🔥</span>
        <div>
          <strong className="font-semibold block">Auto-Calculated Bulk Restock Parameters</strong>
          <span className="text-xs text-violet-800 leading-relaxed block mt-0.5">
            Suggested quantity was determined by daily shipments dispatched to partner pharmacies over the last 14 days. Click <strong>Confirm Order to Manufacturer</strong> to transmit.
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
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-slate-50/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Order Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Order Quantity (Units)
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Suggested buffer for wholesale supply.
            </span>
          </div>

          {/* Supplier Manufacturer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Manufacturer (Supplier)
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white"
            >
              {manufacturers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Authorized licensed pharmaceutical manufacturer.
            </span>
          </div>
        </div>

        {/* Priority & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white"
            >
              <option value="urgent">🚨 Urgent (Low Stock Fast Track)</option>
              <option value="standard">Standard Production Batch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Notes for Manufacturer
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Link
            href="/distributor"
            className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-md shadow-violet-600/20 transition-all flex items-center gap-2"
          >
            {isSubmitting ? (
              <span>Placing Order...</span>
            ) : (
              <>
                <span>Confirm Order to Manufacturer</span>
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

export default function DistributorOrderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading procurement form...</div>}>
      <DistributorOrderForm />
    </Suspense>
  );
}
