"use client";

import React, { useState, useRef } from "react";
import Barcode from "./Barcode";
import { formatUnitBarcode, drawCode128OnCanvas } from "@/lib/barcodeHelper";

export interface DualPackagingLabelProps {
  medicineName: string;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  packagingType?: string;
  manufacturerName?: string;
  qrCodeUrl: string;
  totalQuantity?: number;
  initialUnitIndex?: number;
}

export default function DualPackagingLabel({
  medicineName,
  batchNumber,
  mfgDate,
  expDate,
  packagingType = "Medicine Strip / Bottle",
  manufacturerName = "Apex Pharmaceuticals Ltd",
  qrCodeUrl,
  totalQuantity = 100,
  initialUnitIndex = 1,
}: DualPackagingLabelProps) {
  const [unitIndex, setUnitIndex] = useState<number>(initialUnitIndex);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute active unit barcode
  const currentBarcode = formatUnitBarcode(batchNumber, unitIndex, mfgDate, expDate);

  /**
   * Generates a high-resolution 300-DPI combined label image on HTML5 Canvas
   * and triggers download as PNG.
   */
  const handleDownloadCombinedImage = async () => {
    setIsGenerating(true);

    try {
      const canvas = document.createElement("canvas");
      // High-resolution canvas dimensions (1200 x 640) for crisp printing
      const width = 1200;
      const height = 640;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        alert("Canvas rendering is not supported on this browser.");
        setIsGenerating(false);
        return;
      }

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Outer border
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 6;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      // Top Security Header Banner
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(16, 16, width - 32, 70);

      // PharmaTrack Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
      ctx.fillText("PHARMATRACK PRO · DUAL-SCAN SECURITY PACKAGING LABEL", 36, 60);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 16px monospace";
      ctx.fillText("UNIT #" + String(unitIndex).padStart(2, "0"), width - 180, 60);

      // Medicine Info Section
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
      ctx.fillText(medicineName, 40, 130);

      ctx.fillStyle = "#475569";
      ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
      ctx.fillText(`Packaging: ${packagingType} · Mfr: ${manufacturerName}`, 40, 162);

      // Batch & Dates Metadata Box
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(40, 180, width - 80, 56);
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 180, width - 80, 56);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 17px monospace";
      ctx.fillText(`BATCH: ${batchNumber}`, 56, 215);

      ctx.fillStyle = "#047857";
      ctx.fillText(`MFG: ${mfgDate}`, 420, 215);

      ctx.fillStyle = "#b91c1c";
      ctx.fillText(`EXP: ${expDate}`, 700, 215);

      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 15px system-ui, -apple-system, sans-serif";
      ctx.fillText("SEAL: ENCRYPTED", width - 230, 215);

      // Divider
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(40, 255);
      ctx.lineTo(width - 40, 255);
      ctx.stroke();

      // Dual Scannable Zone: Left = 2D QR, Right = 1D Barcode
      // 1. Draw 2D Batch QR Code
      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error("Failed to load QR image"));
        qrImg.src = qrCodeUrl;
      });

      const qrSize = 250;
      const qrX = 60;
      const qrY = 275;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BATCH TRACEABILITY QR", qrX + qrSize / 2, qrY + qrSize + 25);
      ctx.font = "12px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText("Scan for provenance & chain of custody", qrX + qrSize / 2, qrY + qrSize + 45);

      // Vertical separator line between QR and Barcode
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(370, 275);
      ctx.lineTo(370, 560);
      ctx.stroke();

      // 2. Draw 1D Unit Barcode (Code 128)
      ctx.textAlign = "left";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
      ctx.fillText("ENCRYPTED UNIT BARCODE", 410, 310);

      ctx.fillStyle = "#64748b";
      ctx.font = "13px system-ui, -apple-system, sans-serif";
      ctx.fillText(
        "Scanned at Retail POS Sale & Bio-Destruction Audit (Confidential Dates Sealed)",
        410,
        335
      );

      // Draw Barcode bars directly with canvas helper
      const barcodeStartX = 410;
      const barcodeStartY = 360;
      const barcodeHeight = 110;
      const barcodeModuleWidth = 2.4;

      drawCode128OnCanvas(
        ctx,
        currentBarcode,
        barcodeStartX,
        barcodeStartY,
        barcodeHeight,
        barcodeModuleWidth,
        "#0f172a"
      );

      // Barcode Human-Readable Text
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 16px monospace";
      ctx.fillText(currentBarcode, barcodeStartX + 20, barcodeStartY + barcodeHeight + 28);

      // Security Badges on Right Column
      ctx.fillStyle = "#ecfdf5";
      ctx.fillRect(410, 520, width - 450, 40);
      ctx.strokeStyle = "#a7f3d0";
      ctx.strokeRect(410, 520, width - 450, 40);

      ctx.fillStyle = "#065f46";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.fillText(
        `🛡️ Dual-Authenticity Verified · Unit Serial: #${String(unitIndex).padStart(2, "0")} · Single-Scan Aligned`,
        425,
        545
      );

      // Bottom Footer Bar
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(16, height - 42, width - 32, 26);
      ctx.fillStyle = "#64748b";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        "GOVERNMENT & FDA 21 CFR COMPLIANT PACKAGING STICKER · UNAUTHORIZED TAMPERING VOIDS AUTHENTICITY",
        width / 2,
        height - 25
      );

      // Trigger download
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${batchNumber}-Unit${String(unitIndex).padStart(2, "0")}-CombinedLabel.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert("Error generating combined label image: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Opens print dialog with the combined dual-scan label pre-formatted
   */
  const handlePrintLabel = () => {
    const printWindow = window.open("", "_blank", "width=850,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Label - ${batchNumber}</title>
          <style>
            @page { size: 100mm 55mm; margin: 0; }
            body { margin: 0; padding: 12px; font-family: system-ui, sans-serif; -webkit-print-color-adjust: exact; }
            .label { border: 2px solid #0f172a; padding: 10px; border-radius: 8px; width: 360px; box-sizing: border-box; }
            .header { display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; }
            .title { font-weight: bold; font-size: 14px; }
            .meta { font-size: 10px; color: #475569; font-family: monospace; }
            .dual-grid { display: flex; gap: 8px; align-items: center; margin-top: 6px; }
            .qr-col { text-align: center; }
            .qr-col img { width: 90px; height: 90px; }
            .barcode-col { flex: 1; text-align: center; }
            .barcode-text { font-family: monospace; font-size: 9px; font-weight: bold; margin-top: 4px; }
            .footer { font-size: 8px; color: #64748b; text-align: center; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 3px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="header">
              <div>
                <div class="title">${medicineName}</div>
                <div class="meta">${packagingType} · ${manufacturerName}</div>
              </div>
              <div class="meta" style="text-align: right;">
                <div>BATCH: <strong>${batchNumber}</strong></div>
                <div>EXP: <strong>${expDate}</strong></div>
              </div>
            </div>
            <div class="dual-grid">
              <div class="qr-col">
                <img src="${qrCodeUrl}" alt="QR" />
                <div style="font-size: 8px; font-weight: bold; margin-top: 2px;">BATCH QR</div>
              </div>
              <div class="barcode-col">
                <div style="font-size: 9px; font-weight: bold; margin-bottom: 4px;">UNIT #${String(unitIndex).padStart(2, "0")} BARCODE</div>
                <div>${Barcode({ value: currentBarcode, height: 38, moduleWidth: 1.2, showText: false }).props.children}</div>
                <div class="barcode-text">${currentBarcode}</div>
              </div>
            </div>
            <div class="footer">PHARMATRACK DUAL-SCAN AUTHENTICATED LABEL · SECURE ENCRYPTED SEAL</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 space-y-6">
      {/* Top Title & Explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-slate-900">
              🏷️ Unified Packaging Security Label (QR + Barcode)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-100 text-blue-800 border border-blue-200">
              Dual-Scan Co-Located
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Both the <strong>Batch QR Code</strong> and <strong>Unit Barcode</strong> are located at the same place on the packaging sticker so dual camera viewfinders capture both simultaneously.
          </p>
        </div>

        {/* Unit Serial Selector */}
        <div className="flex items-center gap-2 self-start sm:self-center bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <label className="text-xs font-semibold text-slate-600 pl-1">Unit Serial:</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setUnitIndex((prev) => Math.max(1, prev - 1))}
              disabled={unitIndex <= 1}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-700 disabled:opacity-40"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={totalQuantity}
              value={unitIndex}
              onChange={(e) => setUnitIndex(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-14 text-center font-mono text-xs font-bold py-1 bg-white border border-slate-200 rounded-lg text-slate-900"
            />
            <button
              type="button"
              onClick={() => setUnitIndex((prev) => Math.min(totalQuantity, prev + 1))}
              disabled={unitIndex >= totalQuantity}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-xs text-slate-700 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Visual Live Preview of the Combined Sticker */}
      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 bg-gradient-to-b from-slate-50 to-white shadow-inner">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border-2 border-slate-900 p-5 shadow-lg space-y-4">
          {/* Label Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg">{medicineName}</span>
                <span className="text-[11px] font-mono bg-slate-900 text-white font-bold px-2 py-0.5 rounded">
                  UNIT #{String(unitIndex).padStart(2, "0")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {packagingType} · {manufacturerName}
              </p>
            </div>
            <div className="text-right font-mono text-xs space-y-0.5">
              <div>
                <span className="text-slate-400">BATCH:</span> <strong>{batchNumber}</strong>
              </div>
              <div className="text-emerald-700">
                <span className="text-slate-400">MFG:</span> <strong>{mfgDate}</strong>
              </div>
              <div className="text-rose-700">
                <span className="text-slate-400">EXP:</span> <strong>{expDate}</strong>
              </div>
            </div>
          </div>

          {/* Co-Located Dual Scannable Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center pt-1">
            {/* Left 2/5: 2D Batch QR */}
            <div className="sm:col-span-2 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <img
                src={qrCodeUrl}
                alt="Batch QR Code"
                className="w-32 h-32 object-contain bg-white p-1 rounded-lg border border-slate-200 shadow-xs"
              />
              <span className="text-[11px] font-mono font-bold text-slate-800 mt-2 block">
                BATCH QR CODE
              </span>
              <span className="text-[10px] text-slate-400 block">Complete Provenance</span>
            </div>

            {/* Right 3/5: 1D Encrypted Unit Barcode */}
            <div className="sm:col-span-3 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] font-mono font-bold text-slate-800 mb-1 flex items-center gap-1">
                <span>🔒 ENCRYPTED UNIT BARCODE</span>
              </span>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs w-full flex justify-center overflow-hidden">
                <Barcode
                  value={currentBarcode}
                  height={48}
                  moduleWidth={1.8}
                  showText={true}
                  fontSize={10}
                  className="scale-95"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1.5 block">
                Unlocked by Retailer POS & Bio-Disposer
              </span>
            </div>
          </div>

          {/* Footer of the sticker */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>🛡️ PHARMATRACK ANTI-TAMPER LABEL</span>
            <span>DSCSA & CDSCO COMPLIANT</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Download Combined Image, Print Sticker */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs text-slate-500">
          Downloads full 300 DPI high-resolution label image ready for sticker printing.
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePrintLabel}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print Sticker</span>
          </button>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleDownloadCombinedImage}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>
              {isGenerating
                ? "Generating High-Res Image..."
                : "Download Combined Label (QR + Barcode) Image"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
