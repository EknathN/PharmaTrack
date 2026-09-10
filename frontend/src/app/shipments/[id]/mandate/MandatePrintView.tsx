"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { formatQrDate } from "@/lib/qrHelper";

interface MandatePrintViewProps {
  shipment: any;
  batch: any;
  fromUser?: any;
  toUser?: any;
  sessionRole?: string;
}

export default function MandatePrintView({
  shipment,
  batch,
  fromUser,
  toUser,
  sessionRole,
}: MandatePrintViewProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Format dates
  const shipmentDate = shipment.createdAt
    ? new Date(shipment.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const mfgFormatted = batch?.mfgDate ? formatQrDate(batch.mfgDate) : "N/A";
  const expFormatted = batch?.expDate ? formatQrDate(batch.expDate) : "N/A";

  const isReturn = shipment.type === "return";
  const isDisposal = shipment.type === "disposal";

  const backUrl = sessionRole ? `/${sessionRole}` : "/";

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 font-sans">
      {/* ─── SCREEN CONTROLS (Hidden during print) ─── */}
      <div className="no-print max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={backUrl}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </Link>
          <div className="hidden sm:block">
            <span className="text-xs text-slate-500 font-medium">
              Shipment Mandate: <strong className="font-mono text-slate-800">{shipment.shipmentNumber}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/shipments/${shipment.id}/ocg`}
            className="px-4 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <span>🛡️ View OCG Sheet</span>
          </Link>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Shipping Mandate</span>
          </button>
        </div>
      </div>

      {/* ─── PRINTABLE SHIPPING MANDATE / PARCEL LABEL CONTAINER ─── */}
      <div className="print-label max-w-4xl mx-auto bg-white border-2 border-slate-900 rounded-2xl shadow-md overflow-hidden text-slate-900">
        {/* Top Carrier Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-base">
              ✚
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase">
                PharmaTrack Secure Shipping Mandate
              </h1>
              <p className="text-[11px] text-slate-300 font-mono">
                Certified Pharmaceutical Chain-of-Custody Delivery Manifest
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">
              Manifest / Tracking ID
            </span>
            <span className="text-lg sm:text-xl font-black font-mono text-emerald-400">
              #{shipment.shipmentNumber}
            </span>
          </div>
        </div>

        {/* Sub-Header: Classification & Status */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 uppercase tracking-wider text-[11px]">
              Shipment Classification:
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                isReturn
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : isDisposal
                  ? "bg-red-100 text-red-900 border border-red-300"
                  : "bg-blue-100 text-blue-900 border border-blue-300"
              }`}
            >
              {isReturn
                ? "Reverse Logistics (Near-Expiry Return)"
                : isDisposal
                ? "Bio-Disposal (Certified Destruction)"
                : "Forward Commercial Distribution"}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-500 font-bold uppercase text-[11px]">Status:</span>
            <span
              className={`px-2.5 py-0.5 rounded-md font-bold uppercase text-[11px] ${
                shipment.status === "received"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : shipment.status === "in_transit"
                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              {shipment.status === "received"
                ? "Received ✓"
                : shipment.status === "in_transit"
                ? "In Transit ✈"
                : "Awaiting Dispatch Proof"}
            </span>
          </div>
        </div>

        {/* ─── FROM / TO ROUTING GRID ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-slate-900 divide-y sm:divide-y-0 sm:divide-x-2 divide-slate-900">
          {/* SHIP FROM (ORIGIN) */}
          <div className="p-5 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">
                SHIP FROM (SENDER / DISPATCHER)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 border border-slate-300 text-slate-700">
                Role: {shipment.fromRole}
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{shipment.fromName}</h2>
              {fromUser?.email && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">{fromUser.email}</p>
              )}
            </div>
            <div className="pt-1 text-xs text-slate-600 space-y-0.5">
              <div>
                <span className="text-slate-400">Dispatch Timestamp:</span>{" "}
                <strong className="font-mono">{shipmentDate}</strong>
              </div>
              <div>
                <span className="text-slate-400">Origin Node ID:</span>{" "}
                <code className="text-[11px] font-mono text-slate-700 bg-slate-100 px-1 rounded">
                  {shipment.fromId}
                </code>
              </div>
            </div>
          </div>

          {/* SHIP TO (CONSIGNEE) */}
          <div className="p-5 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">
                SHIP TO (RECIPIENT / CONSIGNEE)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 border border-slate-300 text-slate-700">
                Role: {shipment.toRole}
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{shipment.toName}</h2>
              {toUser?.email && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">{toUser.email}</p>
              )}
            </div>
            <div className="pt-1 text-xs text-slate-600 space-y-0.5">
              <div>
                <span className="text-slate-400">Intake Requirement:</span>{" "}
                <strong className="text-emerald-700 font-semibold">Dual-Scan QR + Courier POD</strong>
              </div>
              <div>
                <span className="text-slate-400">Consignee Node ID:</span>{" "}
                <code className="text-[11px] font-mono text-slate-700 bg-slate-100 px-1 rounded">
                  {shipment.toId}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MEDICINE & CONSIGNMENT SPECIFICATION ─── */}
        <div className="p-5 bg-slate-50/70 border-b-2 border-slate-900">
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono block mb-2">
            CONSIGNMENT SPECIFICATION & BATCH DOSSIER
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Medicine Name</span>
              <strong className="text-slate-900 text-sm font-bold block mt-0.5 leading-snug">
                {batch?.medicineName || "Pharmaceutical Unit"}
              </strong>
              {batch?.medicineType && (
                <span className="text-[10px] text-slate-500 capitalize">{batch.medicineType} form</span>
              )}
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch Number</span>
              <strong className="text-slate-900 text-sm font-bold font-mono block mt-0.5">
                {batch?.batchNumber || "N/A"}
              </strong>
              <span className="text-[10px] text-slate-500 font-mono truncate block">
                ID: {batch?.id || shipment.batchId}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantity Shipped</span>
              <strong className="text-emerald-700 text-base font-black font-mono block mt-0.5">
                {shipment.quantity?.toLocaleString()} Units
              </strong>
              <span className="text-[10px] text-slate-500">
                {batch?.unitDetails || "Verified tamper-evident pack"}
              </span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Mfg / Exp Dates</span>
              <div className="mt-0.5 space-y-0.5 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400">MFG:</span>{" "}
                  <strong className="text-slate-800">{mfgFormatted}</strong>
                </div>
                <div>
                  <span className="text-slate-400">EXP:</span>{" "}
                  <strong className="text-red-700">{expFormatted}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── DUAL QR CODE VERIFICATION ZONE ─── */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b-2 border-slate-900 items-center">
          {/* PRIMARY: LARGE SHIPMENT QR CODE */}
          <div className="border-2 border-slate-900 rounded-2xl p-4 bg-white text-center flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono">
                Primary Shipment QR (Outer Crate)
              </span>
            </div>

            {/* Large High-Res Shipment QR */}
            {shipment.qrCode ? (
              <img
                src={shipment.qrCode}
                alt="Large Shipment QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain border border-slate-200 p-2 rounded-xl bg-white"
              />
            ) : (
              <div className="w-48 h-48 bg-slate-100 flex items-center justify-center font-mono text-xs text-slate-400">
                QR Not Generated
              </div>
            )}

            <div className="text-[11px] font-mono text-slate-600 break-all bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 max-w-full">
              {shipment.qrData || `PHARMATRACK:SHIPMENT:${shipment.id}`}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Mandatory: Carrier scan at pickup & receiver intake checkpoint
            </p>
          </div>

          {/* SECONDARY: BATCH QR CODE */}
          <div className="border border-slate-300 rounded-2xl p-4 bg-slate-50/50 text-center flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
                Medicine Batch QR (Unit Provenance)
              </span>
            </div>

            {/* Compact Batch QR */}
            {batch?.qrCode ? (
              <img
                src={batch.qrCode}
                alt="Batch QR Code"
                className="w-36 h-36 sm:w-40 sm:h-40 object-contain border border-slate-200 p-2 rounded-xl bg-white"
              />
            ) : (
              <div className="w-36 h-36 bg-slate-100 flex items-center justify-center font-mono text-xs text-slate-400">
                Batch QR Ready
              </div>
            )}

            <div className="text-[11px] font-mono text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              Batch: <strong>{batch?.batchNumber}</strong> · ID: <strong>{batch?.id}</strong>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              Readable specifications encoded directly inside QR for field verification
            </p>
          </div>
        </div>

        {/* ─── COURIER INSTRUCTIONS & SIGN-OFF BLOCKS ─── */}
        <div className="p-5 bg-white text-xs">
          <div className="mb-4 p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-slate-700 text-[11px] leading-relaxed flex items-start gap-2">
            <span className="text-amber-800 font-bold text-sm leading-none">⚠️</span>
            <div>
              <strong className="text-slate-900">Carrier & Consignee Mandatory Handling Instructions:</strong>
              <p className="mt-0.5 text-slate-600">
                1. This parcel contains verified pharmaceutical inventory. Keep protected from moisture, direct sunlight, and temperature excursions.
                <br />
                2. Do not accept delivery if outer tamper-evident seal is compromised.
                <br />
                3. Both outer Shipment QR and inner Medicine QR must be scanned to complete intake in the PharmaTrack ledger.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-3">
                1. DISPATCHED BY (SENDER)
              </span>
              <div className="border-b border-slate-300 pb-1 mb-1">
                <span className="text-[10px] text-slate-400">Sign / Stamp:</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Date: {shipmentDate}</div>
            </div>

            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-3">
                2. COURIER / LOGISTICS PARTNER
              </span>
              <div className="border-b border-slate-300 pb-1 mb-1">
                <span className="text-[10px] text-slate-400">Name & Docket #:</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Pickup Date: _________________</div>
            </div>

            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/40">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-3">
                3. RECEIVED BY (CONSIGNEE)
              </span>
              <div className="border-b border-slate-300 pb-1 mb-1">
                <span className="text-[10px] text-slate-400">Intake Sign & Stamp:</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Delivery Date: _________________</div>
            </div>
          </div>

          {/* Footer Watermark */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Powered by PharmaTrack Pro · Cryptographic Supply Chain Integrity</span>
            <span>Security Hash: {shipment.id?.substring(0, 16).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ─── PRINT CSS STYLES ─── */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .min-h-screen {
            min-height: auto !important;
            padding: 0 !important;
            background: transparent !important;
          }
          .print-label {
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            border: 2px solid #000 !important;
            border-radius: 8px !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
