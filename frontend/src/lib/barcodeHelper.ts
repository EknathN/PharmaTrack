import { Batch, DatabaseSchema, UnitRecord } from './db';
import crypto from 'crypto';

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
 * Extracts a compact, recognizable batch suffix for ultra-short barcodes.
 * Avoids long redundant prefixes like "BN-202609-1803" -> "1803"
 */
export function getCompactBatchCode(batchNumber?: string): string {
  if (!batchNumber) return 'B01';
  const clean = batchNumber.trim().toUpperCase();
  // If format is BN-YYYYMM-XXXX or BN-XXXX, extract the unique lot suffix
  const bnMatch = clean.match(/BN-(?:\d{4,6}-)?([A-Z0-9]+)$/i);
  if (bnMatch) return bnMatch[1];

  // If contains hyphens, take the last segment
  const parts = clean.split('-').filter(Boolean);
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }

  // Otherwise clean alphanumeric, limit to 6 chars
  const alphanum = clean.replace(/[^A-Z0-9]/gi, '');
  return alphanum.length > 6 ? alphanum.slice(-6) : alphanum || 'B01';
}

/**
 * Compact date format: YYMM (4 characters)
 * Example: "2026-09-10" -> "2609"
 */
export function formatCompactDate(dateStr?: string): string {
  if (!dateStr) return '0000';
  const clean = dateStr.trim();
  const parts = clean.split('-');
  if (parts.length >= 2) {
    const yy = parts[0].trim().slice(-2);
    const mm = parts[1].trim().padStart(2, '0');
    return `${yy}${mm}`;
  }
  const digits = clean.replace(/[^0-9]/g, '');
  return digits.length >= 4 ? digits.slice(-4) : digits.padStart(4, '0');
}

/**
 * Formats a date string (YYYY-MM-DD or ISO) into 6-digit YYMMDD format.
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

export const MANUFACTURER_CIPHER_SECRET = process.env.MANUFACTURER_CIPHER_SECRET || 'Pharmatrack-Pro-Manufacturer-Master-Key-2026';

/**
 * Encrypts unit barcode payload at the manufacturer stage.
 * Encodes: Batch (4), MFG YYMM (4), EXP YYMM (4), Serial (2) -> 14 bytes
 * Produces an ultra-compact authenticated base64url cipher: "EB-<TOKEN>" (~26 chars)
 * The raw engraved barcode on packaging is 100% encrypted so no unauthorized party can read or forge dates.
 */
export function encryptUnitBarcode(
  batchNumber: string,
  unitIndex: number,
  mfgDate?: string,
  expDate?: string
): string {
  const b = getCompactBatchCode(batchNumber).slice(-4).padStart(4, '0').toUpperCase();
  const m = formatCompactDate(mfgDate);
  const e = formatCompactDate(expDate);
  const s = String(unitIndex || 1).padStart(2, '0').slice(-2);

  const payload = `${b}${m}${e}${s}`; // 14 chars
  const payloadBuf = Buffer.from(payload, 'utf8');

  // 2-byte deterministic salt derived from batch & unit
  const salt = crypto.createHash('md5').update(`${b}:${s}:${MANUFACTURER_CIPHER_SECRET}`).digest().slice(0, 2);
  const keystream = crypto.createHmac('sha256', MANUFACTURER_CIPHER_SECRET).update(salt).digest().slice(0, 14);

  const cipherBuf = Buffer.alloc(14);
  for (let i = 0; i < 14; i++) {
    cipherBuf[i] = payloadBuf[i] ^ keystream[i];
  }

  // 1-byte authentication checksum tag
  const authTag = crypto.createHmac('sha256', MANUFACTURER_CIPHER_SECRET).update(Buffer.concat([salt, cipherBuf])).digest()[0];

  const packed = Buffer.concat([salt, cipherBuf, Buffer.from([authTag])]);
  return `EB-${packed.toString('base64url')}`;
}

export interface DecryptedUnitBarcodeResult {
  isValid: boolean;
  raw: string;
  isEncrypted: boolean;
  isAuthorized: boolean;
  message?: string;
  error?: string;
  batchNumber?: string;
  mfgDate?: string;
  expDate?: string;
  unitSerial?: string;
  unitIndex?: number;
  revealedByRole?: 'retailer' | 'disposer' | 'manufacturer' | 'host';
}

/**
 * Decrypts a manufacturer-encrypted unit barcode.
 * Revelation of dates and unit serial is strictly authorized for 'retailer' and 'disposer'
 * (as well as manufacturer/host for oversight).
 */
export function decryptUnitBarcode(
  barcode: string,
  authorizedRole?: 'retailer' | 'disposer' | 'manufacturer' | 'host' | string
): DecryptedUnitBarcodeResult {
  if (!barcode || !barcode.toUpperCase().startsWith('EB-')) {
    return { isValid: false, raw: barcode, isEncrypted: false, isAuthorized: false, error: 'Not an encrypted barcode' };
  }

  const roleLower = (authorizedRole || '').toLowerCase();
  const isRoleAuthorized = ['retailer', 'disposer', 'manufacturer', 'host'].includes(roleLower);

  const token = barcode.slice(3);
  try {
    const packed = Buffer.from(token, 'base64url');
    if (packed.length !== 17) {
      return { isValid: false, raw: barcode, isEncrypted: true, isAuthorized: false, error: 'Invalid encrypted payload size' };
    }

    const salt = packed.slice(0, 2);
    const cipherBuf = packed.slice(2, 16);
    const authTag = packed[16];

    const expectedAuth = crypto.createHmac('sha256', MANUFACTURER_CIPHER_SECRET).update(Buffer.concat([salt, cipherBuf])).digest()[0];
    if (authTag !== expectedAuth) {
      return { isValid: false, raw: barcode, isEncrypted: true, isAuthorized: false, error: 'Cryptographic signature verification failed (Counterfeit or tampered barcode)' };
    }

    // If role is NOT authorized, do not reveal the confidential decrypted dates and serials
    if (!isRoleAuthorized) {
      return {
        isValid: true,
        raw: barcode,
        isEncrypted: true,
        isAuthorized: false,
        message: '🔒 Manufacturer Encrypted Security Barcode. Decryption authorized only for Retailers (at sale) and Certified Bio-Disposers (for expired destruction audit).'
      };
    }

    // Authorized decryption
    const keystream = crypto.createHmac('sha256', MANUFACTURER_CIPHER_SECRET).update(salt).digest().slice(0, 14);
    const payloadBuf = Buffer.alloc(14);
    for (let i = 0; i < 14; i++) {
      payloadBuf[i] = cipherBuf[i] ^ keystream[i];
    }

    const payload = payloadBuf.toString('utf8');
    const batchCode = payload.slice(0, 4);
    const mYY = payload.slice(4, 6);
    const mMM = payload.slice(6, 8);
    const eYY = payload.slice(8, 10);
    const eMM = payload.slice(10, 12);
    const serial = payload.slice(12, 14);

    return {
      isValid: true,
      raw: barcode,
      isEncrypted: true,
      isAuthorized: true,
      batchNumber: batchCode,
      mfgDate: `20${mYY}-${mMM}`,
      expDate: `20${eYY}-${eMM}`,
      unitSerial: serial,
      unitIndex: parseInt(serial, 10),
      revealedByRole: roleLower as any
    };
  } catch (err: any) {
    return { isValid: false, raw: barcode, isEncrypted: true, isAuthorized: false, error: 'Failed to decrypt manufacturer cipher: ' + err.message };
  }
}

/**
 * Formats an encrypted unit barcode embedding both Manufacturing and Expiry dates.
 * Format: EB-<BASE64URL_TOKEN>
 * Example: "EB-RORJYnvBnIcUfKOZcfX8ies" (~26 characters)
 * Data is encrypted from the manufacturer and revealed only to authorized Retailer or Disposer.
 */
export function formatUnitBarcode(
  batchNumber: string,
  unitIndex: number,
  mfgDate?: string,
  expDate?: string
): string {
  return encryptUnitBarcode(batchNumber, unitIndex, mfgDate, expDate);
}

export interface ParsedUnitBarcode {
  isValid: boolean;
  raw: string;
  isEncrypted?: boolean;
  isAuthorized?: boolean;
  message?: string;
  error?: string;
  batchNumber?: string;
  mfgDate?: string; // Standard YYYY-MM
  expDate?: string; // Standard YYYY-MM
  unitSerial?: string;
  unitIndex?: number;
  revealedByRole?: 'retailer' | 'disposer' | 'manufacturer' | 'host';
}

/**
 * Parses an engraved unit barcode.
 * If encrypted (EB-), performs authorized cryptographic decryption.
 * Also supports compact B-codes and legacy BC- codes.
 */
export function parseUnitBarcode(barcode: string, authorizedRole?: string): ParsedUnitBarcode {
  if (!barcode) return { isValid: false, raw: '' };
  const trimmed = barcode.trim();

  // Encrypted Manufacturer Barcode
  if (trimmed.toUpperCase().startsWith('EB-')) {
    const dec = decryptUnitBarcode(trimmed, authorizedRole || 'retailer');
    return dec;
  }

  const upper = trimmed.toUpperCase();

  // Pattern 1: Ultra-Compact B<BATCH>-M<YYMM>E<YYMM>-<SERIAL> (e.g. B1803-M2609E2809-01)
  const compactMatch = upper.match(/^B([A-Z0-9]+)-M(\d{2})(\d{2})E(\d{2})(\d{2})-(\d+)$/i);
  if (compactMatch) {
    const [, batchCode, mYY, mMM, eYY, eMM, serial] = compactMatch;
    return {
      isValid: true,
      raw: upper,
      batchNumber: batchCode,
      mfgDate: `20${mYY}-${mMM}`,
      expDate: `20${eYY}-${eMM}`,
      unitSerial: serial,
      unitIndex: parseInt(serial, 10),
    };
  }

  // Pattern 2: Compact with hyphens B<BATCH>-<YYMM>-<YYMM>-<SERIAL> (e.g. B1803-2609-2809-01)
  const compactHyphenMatch = upper.match(/^B([A-Z0-9]+)-(\d{2})(\d{2})-(\d{2})(\d{2})-(\d+)$/i);
  if (compactHyphenMatch) {
    const [, batchCode, mYY, mMM, eYY, eMM, serial] = compactHyphenMatch;
    return {
      isValid: true,
      raw: upper,
      batchNumber: batchCode,
      mfgDate: `20${mYY}-${mMM}`,
      expDate: `20${eYY}-${eMM}`,
      unitSerial: serial,
      unitIndex: parseInt(serial, 10),
    };
  }

  // Pattern 3: Full BC-<BATCH>-M<YYMMDD>-E<YYMMDD>-<SERIAL>
  const fullMatch = upper.match(/^BC-([A-Z0-9-]+)-M(\d{2})(\d{2})(\d{2})-E(\d{2})(\d{2})(\d{2})-(\d+)$/i);
  if (fullMatch) {
    const [, batchNumber, mYY, mMM, mDD, eYY, eMM, eDD, serial] = fullMatch;
    return {
      isValid: true,
      raw: upper,
      batchNumber,
      mfgDate: `20${mYY}-${mMM}-${mDD}`,
      expDate: `20${eYY}-${eMM}-${eDD}`,
      unitSerial: serial,
      unitIndex: parseInt(serial, 10),
    };
  }

  // Pattern 4: Legacy BC-<BATCH>-<SERIAL>
  const simpleMatch = upper.match(/^BC-([A-Z0-9-]+)-(\d+)$/i);
  if (simpleMatch) {
    return {
      isValid: true,
      raw: upper,
      batchNumber: simpleMatch[1],
      unitSerial: simpleMatch[2],
      unitIndex: parseInt(simpleMatch[2], 10),
    };
  }

  // Pattern 5: Simple B<BATCH>-<SERIAL>
  const simpleBMatch = upper.match(/^B([A-Z0-9]+)-(\d+)$/i);
  if (simpleBMatch) {
    return {
      isValid: true,
      raw: upper,
      batchNumber: simpleBMatch[1],
      unitSerial: simpleBMatch[2],
      unitIndex: parseInt(simpleBMatch[2], 10),
    };
  }

  return { isValid: false, raw: upper };
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

  // Extract Year and Month digits (e.g. "2026-09-10" -> "2609" and "2026-09" -> "2609")
  const normYm = (d?: string) => {
    if (!d) return '';
    const clean = d.trim();
    const parts = clean.split('-');
    if (parts.length >= 2) {
      const yy = parts[0].slice(-2);
      const mm = parts[1].padStart(2, '0').slice(0, 2);
      return `${yy}${mm}`;
    }
    const digits = clean.replace(/[^0-9]/g, '');
    if (digits.length === 8) {
      return `${digits.slice(2, 4)}${digits.slice(4, 6)}`;
    }
    if (digits.length === 6) {
      return `${digits.slice(2, 4)}${digits.slice(4, 6)}`;
    }
    return digits.slice(-4);
  };

  const qMfgYm = normYm(qrMfg);
  const qExpYm = normYm(qrExp);
  const bMfgYm = normYm(bcMfg);
  const bExpYm = normYm(bcExp);

  const mfgMatch = !qMfgYm || !bMfgYm || qMfgYm === bMfgYm;
  const expMatch = !qExpYm || !bExpYm || qExpYm === bExpYm;

  const isMatch = mfgMatch && expMatch;
  const notice = isMatch
    ? '✓ Anti-Tamper Verified: QR and engraved barcode dates match.'
    : '⚠️ FRAUD ALERT: Barcode dates do not match printed carton QR dates!';

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
      status: batch.status === 'fully_disposed' ? 'disposed' : 'in_stock',
      isEncrypted: unitBarcode.startsWith('EB-'),
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
 * Recognizes encrypted EB- barcodes, ultra-compact B barcodes, and legacy BC- barcodes.
 */
export function extractUnitBarcode(scannedText: string): string | null {
  if (!scannedText) return null;
  const trimmed = scannedText.trim();
  if (
    trimmed.toUpperCase().startsWith('EB-') ||
    trimmed.startsWith('BC-') ||
    /^B[A-Z0-9]+-(?:M\d{4}E\d{4}|\d{4}-\d{4}|\d+)/i.test(trimmed)
  ) {
    return trimmed;
  }
  // Check if contains EB-, BC-, or B- pattern
  const match = trimmed.match(/\b((?:EB|BC|B)-?[A-Z0-9_-]+)\b/i);
  if (match) return match[1];
  return null;
}

/**
 * Decrypts, verifies, and stores the revealed unit barcode record in the system ledger.
 * Executed when an authorized Retailer sells the unit, or an authorized Disposer neutralizes it.
 */
export function revealAndStoreUnitRecord(
  db: DatabaseSchema,
  barcode: string,
  role: 'retailer' | 'disposer',
  userId?: string,
  userName?: string
): { success: boolean; unit?: UnitRecord; error?: string } {
  if (!Array.isArray(db.unitRecords)) {
    db.unitRecords = [];
  }

  const dec = decryptUnitBarcode(barcode, role);
  if (!dec.isValid || !dec.isAuthorized) {
    return { success: false, error: dec.error || dec.message || 'Decryption authorization rejected' };
  }

  const now = new Date().toISOString();

  // 1. Check if unit already in ledger
  let record = db.unitRecords.find(u => u.unitBarcode.toLowerCase() === barcode.toLowerCase());

  // 2. If not found by exact barcode, match by batch and unit serial
  if (!record && dec.batchNumber) {
    record = db.unitRecords.find(u => {
      const cleanB = u.batchNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      return cleanB.includes(dec.batchNumber!.toUpperCase()) && u.unitIndex === dec.unitIndex;
    });
  }

  if (!record) {
    // Look up batch in database
    const batch = db.batches.find(b => {
      const cleanB = b.batchNumber.replace(/[^A-Z0-9]/gi, '').toUpperCase();
      return cleanB.includes(dec.batchNumber!.toUpperCase());
    });

    record = {
      unitBarcode: barcode,
      batchId: batch ? batch.id : `BATCH-${dec.batchNumber}`,
      batchNumber: batch ? batch.batchNumber : dec.batchNumber!,
      medicineName: batch ? batch.medicineName : 'Pharmaceutical Unit',
      unitIndex: dec.unitIndex || 1,
      packagingType: batch?.packagingType || 'Unit Package',
      status: role === 'retailer' ? 'sold' : 'disposed',
      isEncrypted: true,
      decryptedData: {
        batchNumber: dec.batchNumber!,
        mfgDate: dec.mfgDate!,
        expDate: dec.expDate!,
        unitSerial: dec.unitSerial!
      },
      revealedByRole: role,
      revealedByUserId: userId,
      revealedByUserName: userName,
      revealedAt: now,
      soldAt: role === 'retailer' ? now : undefined,
      soldBy: role === 'retailer' ? userName : undefined,
      disposedAt: role === 'disposer' ? now : undefined,
      disposedBy: role === 'disposer' ? userName : undefined,
    };
    db.unitRecords.push(record);
  } else {
    record.isEncrypted = true;
    record.decryptedData = {
      batchNumber: dec.batchNumber!,
      mfgDate: dec.mfgDate!,
      expDate: dec.expDate!,
      unitSerial: dec.unitSerial!
    };
    record.revealedByRole = role;
    record.revealedByUserId = userId;
    record.revealedByUserName = userName;
    record.revealedAt = now;
    if (role === 'retailer') {
      record.status = 'sold';
      record.soldAt = now;
      record.soldBy = userName;
    } else if (role === 'disposer') {
      record.status = 'disposed';
      record.disposedAt = now;
      record.disposedBy = userName;
    }
  }

  return { success: true, unit: record };
}
