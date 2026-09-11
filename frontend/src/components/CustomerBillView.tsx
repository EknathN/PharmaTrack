"use client";

import React from "react";
import Link from "next/link";
import Barcode from "@/components/Barcode";
import { Sale } from "@/lib/db";

interface CustomerBillViewProps {
  invoice: Sale;
  onClose?: () => void;
}

export default function CustomerBillView({ invoice, onClose }: CustomerBillViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const items = invoice.items && invoice.items.length > 0 ? invoice.items : [
    {
      batchId: invoice.batchId,
      batchNumber: invoice.batchNumber,
      medicineName: invoice.medicineName,
      packagingType: 'Medicine Unit',
      scannedUnitBarcodes: invoice.scannedUnitBarcodes || [],
      quantity: invoice.quantity,
      unitPrice: invoice.unitPrice || 0,
      taxRatePercent: 5,
      taxAmount: invoice.taxAmount || 0,
      lineTotal: invoice.totalAmount || (invoice.unitPrice || 0) * invoice.quantity
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex items-center justify-between gap-3 print:hidden bg-slate-900 text-white p-4 rounded-2xl shadow-md">
        <div>
          <h2 className="font-bold text-base">Customer Tax Invoice Generated</h2>
          <p className="text-xs text-slate-300">
            Invoice <strong className="font-mono text-emerald-400">#{invoice.invoiceNumber || invoice.id.slice(0, 8)}</strong> ready for printing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              ← New Sale
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <span>🖨️</span>
            <span>Print Customer Bill</span>
          </button>
        </div>
      </div>

      {/* ─── PHYSICAL PRINTABLE INVOICE SHEET ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-sm max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 text-slate-900 font-sans">
        
        {/* Header: Retail Pharmacy Branding */}
        <div className="border-b-2 border-slate-900 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💊</span>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  {invoice.retailerShopName || invoice.retailerName || "City Care Pharmacy"}
                </h1>
              </div>
              <p className="text-xs font-medium text-slate-600 mt-1 max-w-md">
                {[invoice.retailerAddress, invoice.retailerCity, invoice.retailerState, invoice.retailerPincode].filter(Boolean).join(', ') || 'Licensed Pharmaceutical Retailer & Chemist'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 mt-1 font-medium">
                {invoice.retailerPhone && <span>Phone: <strong>{invoice.retailerPhone}</strong></span>}
                {invoice.retailerLicense && <span>Drug License No: <strong className="font-mono">{invoice.retailerLicense}</strong></span>}
              </div>
            </div>

            <div className="text-right sm:text-right border sm:border-0 p-3 sm:p-0 rounded-xl bg-slate-50 sm:bg-transparent">
              <span className="inline-block bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md mb-1.5">
                TAX INVOICE / CASH MEMO
              </span>
              <div className="font-mono font-bold text-slate-900 text-sm">
                #{invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8).toUpperCase()}`}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {new Date(invoice.soldAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Prescription Info */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Details</span>
            <div className="font-bold text-slate-900 text-sm">{invoice.customerName || "Walk-in Customer"}</div>
            {invoice.customerPhone && (
              <div className="text-slate-600 font-medium mt-0.5">Phone: {invoice.customerPhone}</div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billing Details</span>
            <div className="text-slate-700">Payment Mode: <strong className="uppercase font-bold text-emerald-700">{invoice.paymentMode || 'Cash'}</strong></div>
            {invoice.doctorName && (
              <div className="text-slate-600 mt-0.5">Prescribed By: <strong>Dr. {invoice.doctorName}</strong></div>
            )}
          </div>
        </div>

        {/* Itemized Medicine Table */}
        <div className="mt-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-[11px] text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 font-bold">#</th>
                <th className="py-2.5 font-bold">Medicine Description & Packaging</th>
                <th className="py-2.5 font-bold">Batch No</th>
                <th className="py-2.5 font-bold text-center">Qty</th>
                <th className="py-2.5 font-bold text-right">Rate</th>
                <th className="py-2.5 font-bold text-right">Tax</th>
                <th className="py-2.5 font-bold text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-3 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-3 pr-2">
                    <div className="font-bold text-slate-900 text-sm">{item.medicineName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                        {item.packagingType || 'Unit Pack'}
                      </span>
                    </div>

                    {/* Engraved Unit Barcodes list */}
                    {item.scannedUnitBarcodes && item.scannedUnitBarcodes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.scannedUnitBarcodes.map((bc, bIdx) => (
                          <span
                            key={bIdx}
                            className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 rounded font-medium"
                          >
                            <span>🏷️</span>
                            <span>{bc}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 font-mono text-slate-700 text-xs font-semibold whitespace-nowrap">
                    {item.batchNumber}
                  </td>
                  <td className="py-3 font-bold text-center text-slate-900">
                    {item.quantity}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-700">
                    ₹{(item.unitPrice || 0).toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-500 text-[11px]">
                    {item.taxRatePercent || 5}%
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-slate-900">
                    ₹{(item.lineTotal || (item.unitPrice * item.quantity)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation & Net Summary */}
        <div className="mt-6 pt-4 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="text-[11px] text-slate-500 space-y-1 max-w-sm">
            <p className="font-semibold text-slate-700">Pharmacist Terms & Safe Usage:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Keep all medicines stored below 25°C away from direct sunlight.</li>
              <li>Returns accepted within 7 days with intact serial barcode & original invoice.</li>
              <li>Schedule H & H1 prescription drugs to be used strictly as directed by registered medical practitioner.</li>
            </ul>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">₹{(invoice.subtotal || invoice.totalAmount || 0).toFixed(2)}</span>
            </div>

            {invoice.taxAmount !== undefined && invoice.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span>Total GST / Tax:</span>
                <span className="font-mono">₹{invoice.taxAmount.toFixed(2)}</span>
              </div>
            )}

            {invoice.discountAmount !== undefined && invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 text-[11px]">
                <span>Special Discount:</span>
                <span className="font-mono font-semibold">-₹{invoice.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline text-slate-900 font-bold text-base">
              <span>Grand Total:</span>
              <span className="font-mono text-lg text-emerald-700">
                ₹{(invoice.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Signature & Digital Invoice Barcode */}
        <div className="mt-8 pt-6 border-t border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <Barcode
              value={invoice.invoiceNumber || invoice.id.slice(0, 12).toUpperCase()}
              height={36}
              moduleWidth={1.5}
              showText={true}
              fontSize={10}
              className="scale-95 origin-left"
            />
            <span className="text-[10px] text-slate-400 mt-1">Authentic Digital Tax Invoice Serial</span>
          </div>

          <div className="text-center sm:text-right space-y-12">
            <div className="text-xs text-slate-400">Authorized Signatory / Registered Pharmacist</div>
            <div className="w-48 border-t border-slate-400 mx-auto sm:ml-auto"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
