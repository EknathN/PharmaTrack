"use client";

import React, { useMemo } from "react";
import { generateCode128Svg, BarcodeSvgOptions } from "@/lib/barcodeHelper";

interface BarcodeProps extends BarcodeSvgOptions {
  value: string;
  className?: string;
  label?: string;
  showDownload?: boolean;
}

export default function Barcode({
  value,
  height = 52,
  moduleWidth = 2.4,
  showText = true,
  fontSize = 12,
  barColor = "#000000",
  bgColor = "transparent",
  margin = 8,
  className = "",
  label,
  showDownload = false,
}: BarcodeProps) {
  const svgMarkup = useMemo(() => {
    return generateCode128Svg(value || "UNKNOWN", {
      height,
      moduleWidth,
      showText,
      fontSize,
      barColor,
      bgColor,
      margin,
    });
  }, [value, height, moduleWidth, showText, fontSize, barColor, bgColor, margin]);

  const handleDownload = () => {
    const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Barcode-${value}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {label && (
        <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mb-1">
          {label}
        </span>
      )}
      <div
        className="barcode-svg-wrapper flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      {showDownload && (
        <button
          type="button"
          onClick={handleDownload}
          className="mt-1 text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-medium print:hidden"
        >
          Download Barcode SVG ↓
        </button>
      )}
    </div>
  );
}
