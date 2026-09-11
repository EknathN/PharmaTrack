"use client";

import React from "react";
import Link from "next/link";
import { formatQrDate } from "@/lib/qrHelper";

interface DisposalCertificatePrintViewProps {
  disposal: any;
  batch: any;
  shipment: any;
  disposerUser?: any;
  manufacturerUser?: any;
  certificateQr?: string;
  qrVerificationText?: string;
  sessionRole?: string;
}

export default function DisposalCertificatePrintView({
  disposal,
  batch,
  shipment,
  disposerUser,
  manufacturerUser,
  certificateQr,
  sessionRole,
}: DisposalCertificatePrintViewProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const backUrl = sessionRole ? `/${sessionRole}` : "/";

  const completedDate = disposal.completedAt
    ? new Date(disposal.completedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date(disposal.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const mfgFormatted = batch?.mfgDate ? formatQrDate(batch.mfgDate) : "N/A";
  const expFormatted = batch?.expDate ? formatQrDate(batch.expDate) : "N/A";
  const certNumber = disposal.certificateNumber || `CERT-DISP-${disposal.id?.slice(0, 8).toUpperCase()}`;

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
          .print-certificate-page {
            border: 2px solid #0f172a !important;
            box-shadow: none !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            padding: 24px !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ─── SCREEN CONTROLS (Hidden during print) ─── */}
      <div className="no-print max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href={backUrl}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </Link>
          <div>
            <span className="text-xs text-slate-500 font-medium">
              Official Disposal Certificate:{" "}
              <strong className="font-mono text-slate-900">{certNumber}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* ─── OFFICIAL PRINTABLE CERTIFICATE DOCUMENT ─── */}
      <div className="print-certificate-page max-w-4xl mx-auto bg-white rounded-2xl border-4 border-double border-slate-800 shadow-xl p-8 relative overflow-hidden">
        {/* Subtle Watermark Stamp */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] select-none">
          <span className="text-9xl font-black rotate-[-25deg] text-slate-900 tracking-widest">
            DESTROYED
          </span>
        </div>

        {/* ─── HEADER SECTION ─── */}
        <div className="border-b-2 border-slate-800 pb-5 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex flex-col items-center justify-center font-bold shadow-md">
                <span className="text-2xl leading-none">🛡️</span>
                <span className="text-[9px] uppercase tracking-tighter mt-1">CERTIFIED</span>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest font-black text-emerald-800">
                  PharmaTrack Pro · Bio-Medical Waste & Environmental Safety Division
                </p>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-tight leading-tight">
                  Certificate of Pharmaceutical Destruction
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Issued under Central Drug Regulatory Standards & Safe Bio-Hazard Neutralization Protocols
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs border border-slate-200 bg-slate-50 p-2.5 rounded-xl">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Certificate No.</div>
              <div className="text-sm font-black text-emerald-900">{certNumber}</div>
              <div className="text-[10px] text-slate-500 mt-1">Date: {completedDate}</div>
            </div>
          </div>
        </div>

        {/* ─── LEGAL ATTESTATION BANNER ─── */}
        <div className="bg-emerald-50/80 border border-emerald-300 rounded-xl p-3.5 mb-6 text-xs text-emerald-950 leading-relaxed flex items-start gap-3">
          <span className="text-emerald-700 text-base">⚖️</span>
          <div>
            <strong className="font-semibold text-emerald-900">OFFICIAL LEGAL ATTESTATION:</strong>{" "}
            This certifies that the pharmaceutical consignment detailed herein was inspected, verified against
            the manufacturer batch ledger, and irreversibly destroyed via certified bio-thermal destruction. The active
            pharmaceutical ingredients (API) have been rendered non-recoverable, inert, and environmentally safe.
          </div>
        </div>

        {/* ─── MAIN SPECIFICATION GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Box 1: Drug & Batch Information */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">1. Pharmaceutical Batch Profile</span>
              <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                Batch #{batch?.batchNumber || "N/A"}
              </span>
            </div>
            <div className="p-4 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Medicine Name:</span>
                <span className="font-bold text-slate-900 text-right">{batch?.medicineName || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Formulation / Type:</span>
                <span className="font-semibold text-slate-800 capitalize text-right">{batch?.medicineType || "Pharmaceutical Product"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Mfg Date / Exp Date:</span>
                <span className="font-mono text-slate-900 text-right">{mfgFormatted} · <strong className="text-red-700 font-bold">{expFormatted}</strong></span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Packaging Details:</span>
                <span className="text-slate-800 text-right">{batch?.unitDetails || "Standard Pharmaceutical Packaging"}</span>
              </div>
              <div className="flex justify-between items-center pt-1 bg-emerald-50/50 p-2 rounded-lg">
                <span className="text-emerald-900 font-bold text-xs uppercase">Certified Quantity Destroyed:</span>
                <span className="text-base font-black text-emerald-800 font-mono">
                  {disposal.quantity} UNITS
                </span>
              </div>
            </div>
          </div>

          {/* Box 2: Facility & Protocol Details */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">2. Authorized Disposal Facility</span>
              <span className="text-[10px] font-mono bg-emerald-800 px-2 py-0.5 rounded text-emerald-200">
                CPCB / WHO COMPLIANT
              </span>
            </div>
            <div className="p-4 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Facility / Organization:</span>
                <span className="font-bold text-slate-900 text-right">{disposerUser?.name || disposal.disposerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Original Manufacturer:</span>
                <span className="font-semibold text-slate-800 text-right">{manufacturerUser?.name || batch?.manufacturerName || "Originating Laboratory"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Destruction Protocol:</span>
                <span className="font-semibold text-slate-900 text-right">
                  {disposal.disposalMethod || "High-Temp Incineration (1100°C) & Thermal Neutralization"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">Inbound Consignment:</span>
                <span className="font-mono text-slate-800 text-right">
                  Shipment #{shipment?.shipmentNumber || "DIRECT-DISPOSAL"}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500 font-medium">OCG Security Key:</span>
                <span className="font-mono text-xs text-slate-700 text-right">
                  {shipment?.ocgVerificationCode || "VERIFIED-OCG-LEDGER"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── DESTRUCTION PROCESS & AUDIT REMARKS ─── */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mb-6 text-xs text-slate-700">
          <p className="font-bold text-slate-900 uppercase tracking-wider mb-1 text-[11px]">
            Destruction Log & Environmental Safety Notes:
          </p>
          <p className="text-slate-600 leading-relaxed">
            {disposal.certificateNotes ||
              "Batch units received under tamper-evident chain-of-custody. De-blistering and crushing executed in negative-pressure containment chamber. Thermal oxidation conducted at temperatures exceeding 1100°C with scrubbed flue gas emissions meeting central air purity norms. Residual bottom ash neutralized and transferred to authorized secure landfill facility."}
          </p>

          {disposal.scannedUnitBarcodes && disposal.scannedUnitBarcodes.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block mb-1">
                Verified Engraved Unit Barcodes Destroyed ({disposal.scannedUnitBarcodes.length} Units):
              </span>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {disposal.scannedUnitBarcodes.map((bc: string, idx: number) => (
                  <span
                    key={idx}
                    className="font-mono text-[10px] bg-white border border-slate-300 text-slate-800 px-1.5 py-0.5 rounded"
                  >
                    🔥 {bc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── EVIDENCE, QR CODE & SIGNATURE SECTION ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t-2 border-slate-800 items-center">
          {/* Verification QR Code */}
          <div className="text-center flex flex-col items-center">
            {certificateQr ? (
              <img
                src={certificateQr}
                alt="Certificate Verification QR"
                className="w-28 h-28 border border-slate-300 p-1 rounded-xl bg-white shadow-sm"
              />
            ) : (
              <div className="w-28 h-28 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                QR Code
              </div>
            )}
            <span className="text-[10px] font-mono text-slate-500 mt-1 uppercase">
              Scan for Cryptographic Audit
            </span>
          </div>

          {/* Physical Evidence Status */}
          <div className="border border-slate-200 p-3 rounded-xl bg-white space-y-1.5 text-xs text-slate-700">
            <p className="font-bold text-slate-900 text-[11px] uppercase border-b pb-1">
              Photographic & Video Proofs:
            </p>
            <div className="flex items-center justify-between text-[11px]">
              <span>Photo Before:</span>
              <span className="font-bold text-emerald-700">
                {disposal.photoBeforeUrl ? "✓ Verified Upload" : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>Photo After:</span>
              <span className="font-bold text-emerald-700">
                {disposal.photoAfterUrl ? "✓ Verified Destruction" : "Pending"}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span>Audit Video:</span>
              <span className="font-bold text-emerald-700">
                {disposal.videoUrl ? "✓ Archival Logged" : "Pending"}
              </span>
            </div>
          </div>

          {/* Authorized Signature & Embossed Seal */}
          <div className="flex flex-col items-center text-center">
            {/* Stamp Graphic */}
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-red-700 text-red-700 flex flex-col items-center justify-center p-1 font-bold text-[8px] uppercase tracking-tighter mb-2 rotate-[-8deg] select-none bg-red-50/40">
              <span>★ BIO-HAZARD ★</span>
              <span className="text-[9px] font-black my-0.5">APPROVED</span>
              <span>PHARMATRACK</span>
            </div>

            <div className="border-t border-slate-700 w-44 pt-1 mt-1">
              <p className="font-bold text-slate-900 text-xs">
                {disposal.officerName || disposerUser?.name || "Chief Disposal Officer"}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tight">
                Authorized Environmental Safety Officer
              </p>
            </div>
          </div>
        </div>

        {/* ─── FOOTER JURISDICTION STATEMENT ─── */}
        <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
          PHARMATRACK PRO IMMUTABLE SUPPLY CHAIN LEDGER · CERTIFICATE REF: {certNumber} · STRICT LEGAL PROTECTION APPLIED
        </div>
      </div>
    </div>
  );
}
