"use client";

import { useState } from "react";

interface BatchReportItem {
  batchNumber: string;
  medicineName: string;
  medicineType: string;
  manufacturer: string;
  mfgDate: string;
  expDate: string;
  totalQuantity: number;
  status: string;
  isFrozen: boolean;
  isFlagged: boolean;
  freezeReason?: string;
  createdAt: string;
}

export default function ReportExporter({ batches }: { batches: BatchReportItem[] }) {
  const [downloading, setDownloading] = useState(false);

  const downloadCSV = () => {
    setDownloading(true);
    try {
      const headers = [
        "Batch Number",
        "Medicine Name",
        "Formulation",
        "Manufacturer",
        "Mfg Date",
        "Expiry Date",
        "Total Quantity",
        "Operational Status",
        "Regulatory Freeze",
        "Freeze Reason",
        "Registration Date"
      ];

      const rows = batches.map(b => [
        `"${b.batchNumber}"`,
        `"${b.medicineName}"`,
        `"${b.medicineType}"`,
        `"${b.manufacturer}"`,
        `"${b.mfgDate}"`,
        `"${b.expDate}"`,
        b.totalQuantity,
        `"${b.status}"`,
        b.isFrozen ? "YES (FROZEN)" : "NO",
        `"${b.freezeReason || ''}"`,
        `"${new Date(b.createdAt).toLocaleDateString()}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pharmatrack_regulatory_dossier_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  const printDossier = () => {
    window.print();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={downloadCSV}
        disabled={downloading}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>{downloading ? "Exporting..." : "Download CSV Ledger"}</span>
      </button>

      <button
        onClick={printDossier}
        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        <span>Print Dossier</span>
      </button>
    </div>
  );
}
