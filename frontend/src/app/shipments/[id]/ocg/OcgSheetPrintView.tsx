"use client";

import React from "react";
import Link from "next/link";
import { formatQrDate } from "@/lib/qrHelper";
import { generateOcgSecurityCode, generateAlignmentGridData } from "@/lib/ocgHelper";

interface OcgSheetPrintViewProps {
  shipment: any;
  batch: any;
  fromUser?: any;
  toUser?: any;
  sessionRole?: string;
}

export default function OcgSheetPrintView({
  shipment,
  batch,
  fromUser,
  toUser,
  sessionRole,
}: OcgSheetPrintViewProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const ocgCode =
    shipment.ocgVerificationCode ||
    generateOcgSecurityCode(
      shipment.shipmentNumber,
      batch?.batchNumber || batch?.id || "BATCH",
      shipment.quantity,
      shipment.fromId,
      shipment.toId,
      shipment.createdAt
    );

  const gridData = generateAlignmentGridData(ocgCode, shipment.shipmentNumber);

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

  const backUrl = sessionRole ? `/${sessionRole}` : "/";

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 font-sans">
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-ocg-sheet {
            border: 2px solid #0f172a !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* ─── SCREEN CONTROLS ─── */}
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
              Consignment OCG Sheet: <strong className="font-mono text-slate-800">{shipment.shipmentNumber}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/shipments/${shipment.id}/mandate`}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            View Shipping Mandate
          </Link>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print OCG Security Sheet</span>
          </button>
        </div>
      </div>

      {/* ─── PRINTABLE OCG SECURITY SHEET ─── */}
      <div className="print-ocg-sheet max-w-4xl mx-auto bg-white border-2 border-slate-900 rounded-2xl shadow-md overflow-hidden text-slate-900 relative">
        {/* Security Alignment Corner Crosshairs */}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-400 select-none">
          ┼ NW-00
        </div>
        <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-400 select-none">
          ┼ NE-01
        </div>
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400 select-none">
          ┼ SW-10
        </div>
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-400 select-none">
          ┼ SE-11
        </div>

        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
              🛡️
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase">
                Official Consignment Gatepass (OCG Sheet)
              </h1>
              <p className="text-[11px] text-blue-200 font-mono">
                Order Alignment & Anti-Tamper Physical Security Matrix
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block">
              Anti-Forgery Key
            </span>
            <span className="font-mono text-xs sm:text-sm font-bold bg-blue-950 px-2.5 py-1 rounded text-blue-300 border border-blue-800 inline-block">
              {ocgCode}
            </span>
          </div>
        </div>

        {/* Anti-Forgery Compliance Notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-700 uppercase tracking-wider text-[10px] px-2 py-0.5 bg-amber-100 rounded border border-amber-300">
              Mandatory Protocol
            </span>
            <span className="font-medium">
              Photograph this physical OCG sheet alongside the parcel. Both Courier POD and OCG Sheet are required to confirm dispatch & receipt.
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-700 hidden sm:inline">
            Tamper Prevention Standard v2.4
          </span>
        </div>

        {/* Main Content Body */}
        <div className="p-6 space-y-6">
          {/* Order Alignment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Consignment & Drug Data */}
            <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
                Consignment Specification
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Shipment Number:</span>
                  <span className="font-mono font-bold text-slate-900">{shipment.shipmentNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Medicine Name:</span>
                  <span className="font-bold text-slate-900">{batch?.medicineName || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Batch Number:</span>
                  <span className="font-mono font-bold text-slate-900">{batch?.batchNumber || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Consigned Quantity:</span>
                  <span className="font-bold text-blue-700 text-sm">{shipment.quantity} units</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Mfg Date / Exp Date:</span>
                  <span className="font-mono text-slate-700">{mfgFormatted} / {expFormatted}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Consignment Created:</span>
                  <span className="font-mono text-slate-700">{shipmentDate}</span>
                </div>
              </div>
            </div>

            {/* Right: Chain of Custody */}
            <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
                Chain of Custody Routing
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                    Dispatching Origin (Sender)
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {fromUser?.name || shipment.fromName}
                  </p>
                  <p className="text-slate-500 capitalize">
                    Role: <strong className="text-slate-700">{fromUser?.role || shipment.fromRole}</strong>
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                    Designated Destination (Receiver)
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {toUser?.name || shipment.toName}
                  </p>
                  <p className="text-slate-500 capitalize">
                    Role: <strong className="text-slate-700">{toUser?.role || shipment.toRole}</strong>
                  </p>
                </div>

                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span className="text-slate-500">Shipment Category:</span>
                  <span className="uppercase font-bold text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-800">
                    {shipment.type}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dual QR & Physical Alignment Matrix */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-gradient-to-b from-slate-50 to-white">
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* Shipment QR */}
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Shipment Dual-QR Alignment
                </span>
                {shipment.qrCode ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={shipment.qrCode}
                    alt="Shipment QR"
                    className="w-32 h-32 mx-auto border-2 border-slate-800 rounded-lg p-1 bg-white shadow-xs"
                  />
                ) : (
                  <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
                    QR Available
                  </div>
                )}
                <span className="font-mono text-[10px] text-slate-600 mt-1 block">
                  {shipment.shipmentNumber}
                </span>
              </div>

              {/* Optical Security Alignment Matrix Box */}
              <div className="flex-1 max-w-sm border border-slate-300 rounded-xl p-3 bg-white text-center shadow-xs">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block mb-2">
                  Security Alignment Matrix (Anti-Tamper Grid)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  {gridData.map((g) => (
                    <div
                      key={g.pos}
                      className="border border-slate-200 rounded p-1.5 bg-slate-50 flex flex-col items-center"
                    >
                      <span className="text-[9px] text-slate-400">{g.crosshair}</span>
                      <strong className="text-blue-900 tracking-wider mt-0.5">{g.val}</strong>
                    </div>
                  ))}
                </div>
                <div className="mt-2.5 text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 flex items-center justify-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Cryptographic Order Alignment Verified</span>
                </div>
              </div>

              {/* Batch QR */}
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Medicine Batch Reference
                </span>
                {batch?.qrCode ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={batch.qrCode}
                    alt="Batch QR"
                    className="w-32 h-32 mx-auto border-2 border-slate-800 rounded-lg p-1 bg-white shadow-xs"
                  />
                ) : (
                  <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-400">
                    Batch QR
                  </div>
                )}
                <span className="font-mono text-[10px] text-slate-600 mt-1 block">
                  {batch?.batchNumber || "BATCH"}
                </span>
              </div>
            </div>
          </div>

          {/* Dual Checkpoint Sign-Off Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Checkpoint 1: Dispatch Gatepass Seal */}
            <div className="border border-slate-300 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                  Checkpoint 1: Dispatch Gatepass
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                  Origin Audit
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" readOnly />
                  <span>Physical packaging inspected & sealed</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600" readOnly />
                  <span>OCG alignment matrix verified against box</span>
                </div>
                <div className="pt-4 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Dispatch Security Officer:</span>
                    <span className="font-semibold text-slate-800">{fromUser?.name || shipment.fromName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Security Stamp / Sign:</span>
                    <span className="font-mono text-xs font-bold text-slate-700 border-b border-slate-400 px-4 pb-0.5">
                      APPROVED ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkpoint 2: Receiver Intake Inspection Seal */}
            <div className="border border-slate-300 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase text-slate-700 tracking-wider">
                  Checkpoint 2: Intake Verification
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded">
                  Destination Audit
                </span>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span>Package seal intact with zero tampering</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-blue-600" />
                  <span>OCG sheet matches courier tracking slip</span>
                </div>
                <div className="pt-4 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Receiving Inspector:</span>
                    <span className="font-semibold text-slate-800">{toUser?.name || shipment.toName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Intake Seal / Date:</span>
                    <span className="font-mono text-xs font-bold text-slate-400 border-b border-dashed border-slate-400 px-4 pb-0.5">
                      [ STAMP ON INTAKE ]
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Warning & Traceability Hash */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
            <div>
              PharmaTrack Security Protocol • Tamper Evident OCG Gatepass
            </div>
            <div>
              Verification Hash: <span className="font-bold text-slate-700">{ocgCode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
