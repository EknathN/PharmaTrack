import QRCode from 'qrcode';

export interface BatchQrParams {
  manufacturerName: string;
  medicineName: string;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  unitDetails?: string;
  totalQuantity: number | string;
  batchId: string;
}

export interface ParsedBatchQr {
  isBatchQr: boolean;
  batchId?: string;
  manufacturer?: string;
  medicine?: string;
  batchNo?: string;
  mfgDate?: string;
  expDate?: string;
  strips?: string;
  totalQuantity?: string;
  rawText: string;
}

/**
 * Format a date string into readable DD-MM-YYYY format
 */
export function formatQrDate(dateStr: string): string {
  if (!dateStr) return '';
  // If in YYYY-MM-DD format, convert to DD-MM-YYYY
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }
  // If Date object or timestamp string
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
  } catch (e) {}
  return dateStr;
}

/**
 * Generates human-readable multi-line QR content for a batch.
 *
 * Example Output:
 * Manufacturer: Cipla
 * Medicine: Paracetamol 500mg
 * Batch No: BATCH2026-089
 * Mfg Date: 12-01-2026
 * Exp Date: 11-01-2028
 * Strips: 10 capsules per strip
 * Total Quantity: 100 boxes
 * Batch ID: BAT-9f3k2x7m
 */
export function generateBatchQrData(params: BatchQrParams): string {
  const mfgFormatted = formatQrDate(params.mfgDate);
  const expFormatted = formatQrDate(params.expDate);
  const stripsDetails = (params.unitDetails || '10 capsules per strip').trim();

  let qtyFormatted = String(params.totalQuantity).trim();
  if (!/\b(units|boxes|strips|bottles|packs|vials|cartons)\b/i.test(qtyFormatted)) {
    qtyFormatted = `${qtyFormatted} units`;
  }

  const lines = [
    `Manufacturer: ${params.manufacturerName || 'Pharma Manufacturer'}`,
    `Medicine: ${params.medicineName}`,
    `Batch No: ${params.batchNumber}`,
    `Mfg Date: ${mfgFormatted}`,
    `Exp Date: ${expFormatted}`,
    `Strips: ${stripsDetails}`,
    `Total Quantity: ${qtyFormatted}`,
    `Batch ID: ${params.batchId}`
  ];

  return lines.join('\n');
}

/**
 * Generate Base64 Data URL for a batch QR code
 */
export async function generateBatchQrCode(params: BatchQrParams): Promise<{ qrData: string; qrCode: string }> {
  const qrData = generateBatchQrData(params);
  const qrCode = await QRCode.toDataURL(qrData, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  });
  return { qrData, qrCode };
}

/**
 * Robustly extracts the Batch ID from any scanned QR text or manual input.
 * Handles:
 * 1. Multi-line QR text with "Batch ID: <id>"
 * 2. Legacy format "PHARMATRACK:BATCH:<id>"
 * 3. Already extracted or raw ID (e.g. "BAT-9f3k2x7m" or UUID)
 * 4. Fallback to batch number if id line is missing
 */
export function extractBatchId(raw: string): string {
  if (!raw) return '';
  const text = raw.trim();

  // 1. Structured "Batch ID: <id>" (case-insensitive, handles various whitespace)
  const batchIdMatch = text.match(/Batch\s*ID\s*:\s*([^\r\n]+)/i);
  if (batchIdMatch && batchIdMatch[1]) {
    return batchIdMatch[1].trim();
  }

  // 2. Legacy "PHARMATRACK:BATCH:<id>"
  const legacyMatch = text.match(/PHARMATRACK:BATCH:([^\r\n\s]+)/i);
  if (legacyMatch && legacyMatch[1]) {
    return legacyMatch[1].trim();
  }

  // 3. If it's a single line without colons (e.g. raw ID directly like BAT-xxx or UUID)
  if (!text.includes('\n') && !text.includes(':')) {
    return text;
  }

  // 4. Fallback: "Batch No: <batchNumber>"
  const batchNoMatch = text.match(/Batch\s*No(?:\.|\s*)?:\s*([^\r\n]+)/i);
  if (batchNoMatch && batchNoMatch[1]) {
    return batchNoMatch[1].trim();
  }

  return text;
}

/**
 * Parses all batch details from human-readable QR text for UI previews.
 */
export function parseBatchQr(raw: string): ParsedBatchQr {
  if (!raw) return { isBatchQr: false, rawText: '' };
  const text = raw.trim();
  const batchId = extractBatchId(text);
  const isBatchQr =
    text.includes('Batch ID:') ||
    text.includes('PHARMATRACK:BATCH:') ||
    text.toLowerCase().includes('ptp:batch') ||
    text.startsWith('BAT-') ||
    text.includes('Manufacturer:') ||
    text.includes('Medicine:') ||
    text.toLowerCase().includes('batch');

  const getField = (pattern: RegExp): string | undefined => {
    const m = text.match(pattern);
    return m && m[1] ? m[1].trim() : undefined;
  };

  return {
    isBatchQr: isBatchQr || !!batchId,
    batchId: batchId || text,
    manufacturer: getField(/Manufacturer\s*:\s*([^\r\n]+)/i),
    medicine: getField(/Medicine\s*:\s*([^\r\n]+)/i),
    batchNo: getField(/Batch\s*No(?:\.|\s*)?:\s*([^\r\n]+)/i) || (text.length < 30 ? text : undefined),
    mfgDate: getField(/Mfg\s*Date\s*:\s*([^\r\n]+)/i),
    expDate: getField(/Exp\s*Date\s*:\s*([^\r\n]+)/i),
    strips: getField(/(?:Strips|Pack\s*Details)\s*:\s*([^\r\n]+)/i),
    totalQuantity: getField(/Total\s*Quantity\s*:\s*([^\r\n]+)/i),
    rawText: text
  };
}
