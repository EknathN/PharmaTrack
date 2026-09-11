import { Batch, DatabaseSchema, UnitRecord } from './db';

/**
 * Standard Code 128 (Type B) Patterns
 * Each pattern has 6 elements representing alternating bar/space module widths.
 * Sum of module widths for each character is always 11 (except Stop which is 13).
 */
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 103=StartA, 104=StartB, 105=StartC, 106=Stop
];

const START_B = 104;
const STOP = 106;

export interface BarcodeSvgOptions {
  height?: number;
  moduleWidth?: number;
  showText?: boolean;
  fontSize?: number;
  textColor?: string;
  barColor?: string;
  bgColor?: string;
  margin?: number;
}

/**
 * Generates a pure vector SVG barcode (Code 128 Type B) string.
 * Works uniformly in Node.js SSR, client browser, and printable documents.
 */
export function generateCode128Svg(text: string, options: BarcodeSvgOptions = {}): string {
  const safeText = (text || 'UNKNOWN').trim();
  const height = options.height ?? 50;
  const moduleWidth = options.moduleWidth ?? 2;
  const showText = options.showText ?? true;
  const fontSize = options.fontSize ?? 12;
  const barColor = options.barColor ?? '#0f172a';
  const bgColor = options.bgColor ?? 'transparent';
  const margin = options.margin ?? 8;

  // Calculate Code 128 symbol sequence using Start B
  const codes: number[] = [START_B];
  let checkSum = START_B;

  for (let i = 0; i < safeText.length; i++) {
    const charCode = safeText.charCodeAt(i);
    // Code 128 Type B maps ASCII 32 (' ') to 126 ('~') to values 0..94
    const val = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(val);
    checkSum += val * (i + 1);
  }

  codes.push(checkSum % 103);
  codes.push(STOP);

  // Convert widths into binary bars (1 = bar, 0 = space)
  let binaryString = '';
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code] || '212222';
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      const isBar = p % 2 === 0;
      binaryString += (isBar ? '1' : '0').repeat(width);
    }
  }

  const barcodeWidth = binaryString.length * moduleWidth;
  const totalWidth = barcodeWidth + margin * 2;
  const totalHeight = height + (showText ? fontSize + 8 : 0) + margin * 2;

  // Build SVG rects
  let rects = '';
  let x = margin;
  let barStart: number | null = null;

  for (let i = 0; i < binaryString.length; i++) {
    if (binaryString[i] === '1') {
      if (barStart === null) barStart = x;
    } else {
      if (barStart !== null) {
        rects += `<rect x="${barStart}" y="${margin}" width="${x - barStart}" height="${height}" fill="${barColor}" />`;
        barStart = null;
      }
    }
    x += moduleWidth;
  }
  if (barStart !== null) {
    rects += `<rect x="${barStart}" y="${margin}" width="${x - barStart}" height="${height}" fill="${barColor}" />`;
  }

  const textElement = showText
    ? `<text x="${totalWidth / 2}" y="${margin + height + fontSize + 2}" font-family="monospace, Courier, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${options.textColor || barColor}" text-anchor="middle" letter-spacing="1.5">${safeText}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}" style="background-color: ${bgColor}; max-width: 100%; height: auto;">${rects}${textElement}</svg>`;
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into compact 6-digit YYMMDD format.
 * Example: "2026-09-10" -> "260910"
 */
export function formatDateForBarcode(dateStr?: string): string {
  if (!dateStr) return '000000';
  const clean = dateStr.trim();
  const parts = clean.split('-');
  if (parts.length === 3) {
    const yyyy = parts[0].trim();
    const mm = parts[1].trim().padStart(2, '0');
    const dd = parts[2].trim().slice(0, 2).padStart(2, '0');
    const yy = yyyy.slice(-2);
    return `${yy}${mm}${dd}`;
  }
  const digits = clean.replace(/[^0-9]/g, '');
  return digits.length >= 6 ? digits.slice(-6) : digits.padStart(6, '0');
}

/**
 * Formats an anti-tamper unit barcode serial string embedding both Manufacturing and Expiry dates.
 * Format: BC-<BATCH>-M<YYMMDD>-E<YYMMDD>-<SERIAL>
 * Example: "BC-BN-202609-1803-M260910-E260912-0001"
 */
export function formatUnitBarcode(
  batchNumber: string,
  unitIndex: number,
  mfgDate?: string,
  expDate?: string
): string {
  const cleanBatch = (batchNumber || 'BATCH').replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  const mfg = formatDateForBarcode(mfgDate);
  const exp = formatDateForBarcode(expDate);
  const serial = String(unitIndex).padStart(4, '0');
  return `BC-${cleanBatch}-M${mfg}-E${exp}-${serial}`;
}

export interface ParsedUnitBarcode {
  isValid: boolean;
  raw: string;
  batchNumber?: string;
  mfgDate?: string; // Standard YYYY-MM-DD
  expDate?: string; // Standard YYYY-MM-DD
  unitSerial?: string;
  unitIndex?: number;
}

/**
 * Parses an engraved unit barcode, extracting the batch number, embedded manufacturing date,
 * expiry date, and unique unit serial.
 */
export function parseUnitBarcode(barcode: string): ParsedUnitBarcode {
  if (!barcode) return { isValid: false, raw: '' };
  const trimmed = barcode.trim().toUpperCase();

  // Pattern 1: BC-<BATCH>-M<YYMMDD>-E<YYMMDD>-<SERIAL>
  const fullMatch = trimmed.match(/^BC-([A-Z0-9-]+)-M(\d{2})(\d{2})(\d{2})-E(\d{2})(\d{2})(\d{2})-(\d+)$/i);
  if (fullMatch) {
    const [, batchNumber, mYY, mMM, mDD, eYY, eMM, eDD, serial] = fullMatch;
    return {
      isValid: true,
      raw: trimmed,
      batchNumber,
      mfgDate: `20${mYY}-${mMM}-${mDD}`,
      expDate: `20${eYY}-${eMM}-${eDD}`,
      unitSerial: serial,
      unitIndex: parseInt(serial, 10),
    };
  }

  // Pattern 2: Legacy or simplified BC-<BATCH>-<SERIAL>
  const simpleMatch = trimmed.match(/^BC-([A-Z0-9-]+)-(\d+)$/i);
  if (simpleMatch) {
    return {
      isValid: true,
      raw: trimmed,
      batchNumber: simpleMatch[1],
      unitSerial: simpleMatch[2],
      unitIndex: parseInt(simpleMatch[2], 10),
    };
  }

  return { isValid: false, raw: trimmed };
}

/**
 * Compares dates extracted from the master QR code with dates embedded in the engraved unit barcode.
 * Detects tampering or label forgery immediately.
 */
export function compareQrAndBarcodeDates(
  qrMfg?: string,
  qrExp?: string,
  bcMfg?: string,
  bcExp?: string
): { isMatch: boolean; mfgMatch: boolean; expMatch: boolean; notice: string } {
  if (!bcMfg || !bcExp) {
    return { isMatch: true, mfgMatch: true, expMatch: true, notice: 'Legacy barcode format (no embedded dates).' };
  }

  const norm = (d?: string) => (d || '').replace(/[^0-9]/g, '').slice(-6); // compare YYMMDD or MMDDYY
  const mfgMatch = !qrMfg || norm(qrMfg) === norm(bcMfg) || qrMfg === bcMfg;
  const expMatch = !qrExp || norm(qrExp) === norm(bcExp) || qrExp === bcExp;

  const isMatch = mfgMatch && expMatch;
  const notice = isMatch
    ? '✓ Tamper-proof verification passed: QR and engraved barcode dates match.'
    : '⚠️ TAMPER ALERT: Barcode engraved dates do not match printed carton QR dates!';

  return { isMatch, mfgMatch, expMatch, notice };
}

/**
 * Detects unit packaging type from batch description or unitDetails
 */
export function inferPackagingType(batch: Batch): string {
  if (batch.packagingType) return batch.packagingType;
  const text = `${batch.unitDetails} ${batch.medicineName} ${batch.medicineType}`.toLowerCase();
  if (text.includes('bottle') || text.includes('syrup') || text.includes('tonic') || text.includes('suspension')) {
    return 'Tonic Bottle';
  }
  if (text.includes('cream') || text.includes('ointment') || text.includes('gel') || text.includes('tube')) {
    return 'Cream Tube';
  }
  if (text.includes('vial') || text.includes('inj') || text.includes('ampoule')) {
    return 'Injection Vial';
  }
  if (text.includes('capsule') || text.includes('tablet') || text.includes('strip')) {
    return 'Medicine Strip';
  }
  return 'Unit Pack';
}

/**
 * Resolves or auto-generates unit records for a batch in the database.
 * Ensures every unit has its unique serial barcode with embedded MFG and EXP dates.
 */
export function getOrGenerateBatchUnits(db: DatabaseSchema, batch: Batch): UnitRecord[] {
  if (!Array.isArray(db.unitRecords)) {
    db.unitRecords = [];
  }

  let existing = db.unitRecords.filter(u => u.batchId === batch.id);
  if (existing.length > 0) {
    return existing;
  }

  const packagingType = inferPackagingType(batch);
  const totalCount = Math.min(Math.max(batch.totalQuantity || 10, 1), 200); // realistic serial tracking count up to 200 units
  const generated: UnitRecord[] = [];
  const unitBarcodeList: string[] = [];

  for (let i = 1; i <= totalCount; i++) {
    const unitBarcode = formatUnitBarcode(batch.batchNumber, i, batch.mfgDate, batch.expDate);
    unitBarcodeList.push(unitBarcode);

    const record: UnitRecord = {
      unitBarcode,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      medicineName: batch.medicineName,
      unitIndex: i,
      packagingType,
      status: batch.status === 'fully_disposed' ? 'disposed' : 'in_stock'
    };
    generated.push(record);
    db.unitRecords.push(record);
  }

  batch.packagingType = packagingType;
  batch.unitBarcodes = unitBarcodeList;

  return generated;
}

/**
 * Checks whether scanned string represents an engraved unit barcode, batch ID, or raw QR text.
 */
export function extractUnitBarcode(scannedText: string): string | null {
  if (!scannedText) return null;
  const trimmed = scannedText.trim();
  if (trimmed.startsWith('BC-')) {
    return trimmed;
  }
  // Check if contains BC- pattern
  const match = trimmed.match(/\b(BC-[A-Z0-9-]+)\b/i);
  if (match) return match[1].toUpperCase();
  return null;
}
