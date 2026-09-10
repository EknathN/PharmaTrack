"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SmartStockAlertItem } from "@/app/actions/restock";

interface SmartRestockWidgetProps {
  recommendations: SmartStockAlertItem[];
  role: "retailer" | "distributor";
}

export default function SmartRestockWidget({
  recommendations: initialRecommendations,
  role,
}: SmartRestockWidgetProps) {
  const [items] = useState<SmartStockAlertItem[]>(initialRecommendations);

  if (!items || items.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg shadow-xs">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Smart Restock Recommendations
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  Optimal
                </span>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                All fast-moving products have healthy stock coverage. Predictive sales velocity analysis detected zero critical stock-outs.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const orderBasePath = role === "retailer" ? "/retailer/order" : "/distributor/order";

  return (
    <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <span>Smart Restock Recommendations</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {items.length} {items.length === 1 ? "Alert" : "Alerts"}
              </span>
            </h2>
            <p className="text-slate-500 text-xs">
              Real-time sales velocity monitoring & predictive inventory auto-reorder alerts.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium self-start sm:self-auto">
          Based on 7–30 day sales velocity
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 gap-3.5">
        {items.map((item) => {
          const isStockOut = item.alertType === "frequent_stock_out";
          const orderUrl = `${orderBasePath}?medicine=${encodeURIComponent(
            item.medicineName
          )}&suggested_qty=${item.suggestedReorderQty}&supplier_id=${encodeURIComponent(
            item.preferredSupplierId
          )}`;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isStockOut
                  ? "bg-rose-50/60 border-rose-200 hover:border-rose-300"
                  : "bg-amber-50/50 border-amber-200 hover:border-amber-300"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                        isStockOut
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-amber-500 text-white shadow-xs"
                      }`}
                    >
                      {isStockOut ? "🚨 Frequent Stock-Out" : "🔥 Fast-Moving Low Stock"}
                    </span>

                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {item.medicineName}
                    </span>

                    {item.isRestockPending && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Restock Pending
                      </span>
                    )}
                  </div>

                  {/* Dynamic Alert Message */}
                  <p className="text-slate-800 text-sm font-medium leading-relaxed">
                    {item.alertMessage}
                  </p>

                  {/* Metrics Badges */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400">Sales Velocity:</span>{" "}
                      <strong className="text-slate-800 font-semibold">{item.dailySalesVelocity} units/day</strong>
                    </div>
                    <span className="text-slate-300">•</span>
                    <div>
                      <span className="text-slate-400">Current Stock:</span>{" "}
                      <strong className={item.currentStock === 0 ? "text-rose-600 font-bold" : "text-slate-800 font-semibold"}>
                        {item.currentStock} units
                      </strong>
                    </div>
                    <span className="text-slate-300">•</span>
                    <div>
                      <span className="text-slate-400">Stock Coverage:</span>{" "}
                      <strong className={item.estimatedDaysLeft < 5 ? "text-rose-600 font-bold" : "text-amber-700 font-bold"}>
                        {item.estimatedDaysLeft} days left
                      </strong>
                    </div>
                    <span className="text-slate-300">•</span>
                    <div>
                      <span className="text-slate-400">Recommended Order:</span>{" "}
                      <strong className="text-emerald-700 font-bold">{item.suggestedReorderQty} units</strong>
                    </div>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  {item.isRestockPending ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs font-semibold">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Order Placed
                    </div>
                  ) : (
                    <Link
                      href={orderUrl}
                      className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 ${
                        isStockOut
                          ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
                          : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200"
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Order Now
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
