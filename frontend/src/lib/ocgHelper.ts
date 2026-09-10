import crypto from "crypto";

/**
 * Generates a deterministic, cryptographically secure Order Consignment Gatepass (OCG)
 * anti-tamper verification code based on immutable consignment parameters.
 * Format: OCG-SEC-XXXX-YYYY-ZZZZ
 */
export function generateOcgSecurityCode(
  shipmentNumber: string,
  batchIdOrNumber: string,
  quantity: number,
  fromId: string,
  toId: string,
  timestamp?: string
): string {
  const seed = `${shipmentNumber}|${batchIdOrNumber}|${quantity}|${fromId}|${toId}|${timestamp || "2026"}`;
  const hash = crypto.createHash("sha256").update(seed).digest("hex").toUpperCase();
  
  const segment1 = hash.slice(0, 4);
  const segment2 = hash.slice(4, 8);
  const segment3 = hash.slice(8, 12);
  
  return `OCG-SEC-${segment1}-${segment2}-${segment3}`;
}

/**
 * Generates an anti-tamper security matrix fingerprint for the OCG sheet.
 * This grid creates alignment points that can be physically inspected against the parcel.
 */
export function generateAlignmentGridData(ocgCode: string, shipmentNumber: string) {
  const cleanCode = ocgCode.replace(/[^A-Z0-9]/g, "");
  const chars = (cleanCode + shipmentNumber.replace(/[^A-Z0-9]/g, "") + "PHARMATRACKOCGSECURITY").slice(0, 16);
  
  return [
    { pos: "NW (0,0)", val: chars.slice(0, 4), crosshair: "┼ NW-ALIGN" },
    { pos: "NE (0,1)", val: chars.slice(4, 8), crosshair: "┼ NE-ALIGN" },
    { pos: "SW (1,0)", val: chars.slice(8, 12), crosshair: "┼ SW-ALIGN" },
    { pos: "SE (1,1)", val: chars.slice(12, 16), crosshair: "┼ SE-ALIGN" },
  ];
}

/**
 * Verifies if an OCG code format matches the official PharmaTrack specification.
 */
export function isValidOcgCodeFormat(code: string): boolean {
  if (!code) return false;
  return /^OCG-SEC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code.trim());
}
