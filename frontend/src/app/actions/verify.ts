"use server";

import { readDb } from '@/lib/db';
import { extractBatchId, parseBatchQr } from '@/lib/qrHelper';
import { extractUnitBarcode } from '@/lib/barcodeHelper';
import crypto from 'crypto';

export interface CustodyEvent {
  timestamp: string;
  actorName: string;
  actorRole: string;
  event: string;
  details?: string;
}

export interface VerificationResult {
  found: boolean;
  searchedTerm: string;
  batch?: {
    id: string;
    batchNumber: string;
    medicineName: string;
    medicineType: string;
    unitDetails: string;
    totalQuantity: number;
    mfgDate: string;
    expDate: string;
    status: string;
    isFrozen?: boolean;
    freezeReason?: string;
    frozenAt?: string;
    frozenBy?: string;
    isFlagged?: boolean;
    flagReason?: string;
    qrCode: string;
    qrData: string;
    manufacturerId: string;
    manufacturerName: string;
    manufacturerAddress?: string;
    manufacturerCity?: string;
    manufacturerState?: string;
    manufacturerPincode?: string;
    manufacturerPhone?: string;
    manufacturerLicense?: string;
    isExpired: boolean;
    isNearExpiry: boolean;
    daysRemaining: number;
  };
  unitInfo?: {
    unitBarcode: string;
    packagingType?: string;
    status: 'in_stock' | 'sold' | 'disposed';
    soldAt?: string;
    disposedAt?: string;
    invoiceNumber?: string;
  };
  shipment?: {
    id: string;
    shipmentNumber: string;
    fromName: string;
    fromRole: string;
    fromAddress?: string;
    toName: string;
    toRole: string;
    toAddress?: string;
    status: string;
    ocgCode?: string;
    createdAt: string;
  };
  custodyEvents: CustodyEvent[];
  authenticityStatus: 'genuine' | 'near_expiry' | 'expired' | 'frozen' | 'disposed' | 'counterfeit';
  verificationHash: string;
  verifiedAt: string;
}

/**
 * Public drug QR verification action.
 * Resolves QR content or batch numbers across the nationwide blockchain/ledger.
 * Open to patients, doctors, field inspectors, and pharmacists without login requirement.
 */
export async function verifyDrugQr(input: string): Promise<VerificationResult> {
  const query = (input || '').trim();
  const now = Date.now();
  const verifiedAt = new Date().toISOString();

  if (!query) {
    return {
      found: false,
      searchedTerm: '',
      custodyEvents: [],
      authenticityStatus: 'counterfeit',
      verificationHash: crypto.randomBytes(16).toString('hex'),
      verifiedAt
    };
  }

  const db = await readDb();

  // 1. Try parsing via structured QR helper
  const parsed = parseBatchQr(query);
  const extractedId = extractBatchId(query);
  const unitBc = extractUnitBarcode(query);

  // Normalize query terms
  const searchLower = query.toLowerCase();

  const matchedUnit = unitBc && Array.isArray(db.unitRecords)
    ? db.unitRecords.find(u => u.unitBarcode.toLowerCase() === unitBc.toLowerCase())
    : undefined;

  // 2. Find matching batch
  let matchedBatch = db.batches.find(b => {
    if (matchedUnit && b.id === matchedUnit.batchId) return true;
    if (unitBc && unitBc.toUpperCase().includes(b.batchNumber.replace(/[^A-Z0-9-]/gi, '').toUpperCase())) return true;
    if (parsed.batchId && b.id.toLowerCase() === parsed.batchId.toLowerCase()) return true;
    if (extractedId && b.id.toLowerCase() === extractedId.toLowerCase()) return true;
    if (b.id.toLowerCase() === searchLower) return true;
    if (b.batchNumber.toLowerCase() === searchLower) return true;
    if (parsed.batchNo && b.batchNumber.toLowerCase() === parsed.batchNo.toLowerCase()) return true;
    if (b.qrData && b.qrData.trim() === query) return true;
    if (query.includes(b.id) || (b.batchNumber && query.includes(b.batchNumber))) return true;
    return false;
  });

  // 3. If not found by batch directly, check if the scanned QR is a shipment QR
  let matchedShipment = db.shipments.find(s => {
    if (s.id.toLowerCase() === searchLower) return true;
    if (s.shipmentNumber.toLowerCase() === searchLower) return true;
    if (query.includes(s.id) || query.includes(s.shipmentNumber)) return true;
    if (s.qrData && s.qrData.trim() === query) return true;
    return false;
  });

  if (!matchedBatch && matchedShipment) {
    matchedBatch = db.batches.find(b => b.id === matchedShipment?.batchId);
  }

  // If still not found
  if (!matchedBatch) {
    return {
      found: false,
      searchedTerm: query,
      custodyEvents: [],
      authenticityStatus: 'counterfeit',
      verificationHash: crypto.createHash('sha256').update(`${query}:${verifiedAt}`).digest('hex').substring(0, 32),
      verifiedAt
    };
  }

  // 4. Resolve manufacturer facility details
  const mfgUser = db.users.find(u => u.id === matchedBatch.manufacturerId || u.name === matchedBatch.manufacturerName);

  // 5. Expiry calculations
  const expTime = new Date(matchedBatch.expDate).getTime();
  const isExpired = expTime < now;
  const daysRemaining = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
  const isNearExpiry = !isExpired && daysRemaining <= 60;

  // 6. Check disposal records
  const isDisposed = matchedBatch.status === 'fully_disposed' ||
    db.disposalRecords.some(d => d.batchId === matchedBatch.id && d.status === 'completed');

  // 7. Authenticity status determination
  let authenticityStatus: VerificationResult['authenticityStatus'] = 'genuine';
  if (matchedBatch.isFrozen) {
    authenticityStatus = 'frozen';
  } else if (isDisposed || matchedUnit?.status === 'disposed') {
    authenticityStatus = 'disposed';
  } else if (isExpired) {
    authenticityStatus = 'expired';
  } else if (isNearExpiry) {
    authenticityStatus = 'near_expiry';
  }

  // 8. Compile complete chain of custody timeline
  const custodyEvents: CustodyEvent[] = [];

  // Add all recorded history events from batch
  if (Array.isArray(matchedBatch.history)) {
    for (const h of matchedBatch.history) {
      custodyEvents.push({
        timestamp: h.timestamp,
        actorName: h.actorName,
        actorRole: h.actorRole,
        event: h.event,
        details: h.details
      });
    }
  }

  // Add shipment milestones if not duplicated
  const relatedShipments = db.shipments.filter(s => s.batchId === matchedBatch.id);
  for (const s of relatedShipments) {
    const exists = custodyEvents.some(c => c.details?.includes(s.shipmentNumber));
    if (!exists) {
      custodyEvents.push({
        timestamp: s.createdAt,
        actorName: s.fromName,
        actorRole: s.fromRole,
        event: `Shipment #${s.shipmentNumber} [${s.status.toUpperCase()}]`,
        details: `Dispatched from ${s.fromName} (${s.fromRole}) to ${s.toName} (${s.toRole}). Qty: ${s.quantity}. OCG: ${s.ocgVerificationCode || 'Verified'}`
      });
    }
  }

  // Add sales dispense records
  const relatedSales = db.sales.filter(sl => sl.batchId === matchedBatch.id);
  for (const sl of relatedSales) {
    custodyEvents.push({
      timestamp: sl.soldAt,
      actorName: sl.retailerName,
      actorRole: 'retailer',
      event: 'Dispensed to Patient at Pharmacy Counter',
      details: `Quantity: ${sl.quantity} units sold via verified POS scanner.`
    });
  }

  // Add disposal records
  const relatedDisposals = db.disposalRecords.filter(d => d.batchId === matchedBatch.id);
  for (const d of relatedDisposals) {
    custodyEvents.push({
      timestamp: d.completedAt || d.createdAt,
      actorName: d.disposerName,
      actorRole: 'disposer',
      event: `Bio-Hazard Destruction [${d.status.toUpperCase()}]`,
      details: `Destroyed ${d.quantity || 0} units at certified facility. Cert: ${d.certificateNumber || d.id.slice(0, 8)}`
    });
  }

  // Sort custody events chronologically
  custodyEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Generate cryptographic verification seal hash
  const verificationHash = crypto
    .createHash('sha256')
    .update(`${matchedBatch.id}:${matchedBatch.batchNumber}:${matchedBatch.expDate}:${verifiedAt}`)
    .digest('hex');

  return {
    found: true,
    searchedTerm: query,
    batch: {
      id: matchedBatch.id,
      batchNumber: matchedBatch.batchNumber,
      medicineName: matchedBatch.medicineName,
      medicineType: matchedBatch.medicineType,
      unitDetails: matchedBatch.unitDetails,
      totalQuantity: matchedBatch.totalQuantity,
      mfgDate: matchedBatch.mfgDate,
      expDate: matchedBatch.expDate,
      status: matchedBatch.status,
      isFrozen: matchedBatch.isFrozen,
      freezeReason: matchedBatch.freezeReason,
      frozenAt: matchedBatch.frozenAt,
      frozenBy: matchedBatch.frozenBy,
      isFlagged: matchedBatch.isFlagged,
      flagReason: matchedBatch.flagReason,
      qrCode: matchedBatch.qrCode,
      qrData: matchedBatch.qrData,
      manufacturerId: matchedBatch.manufacturerId,
      manufacturerName: matchedBatch.manufacturerName,
      manufacturerAddress: mfgUser?.address,
      manufacturerCity: mfgUser?.city,
      manufacturerState: mfgUser?.state,
      manufacturerPincode: mfgUser?.pincode,
      manufacturerPhone: mfgUser?.phone,
      manufacturerLicense: mfgUser?.licenseNumber,
      isExpired,
      isNearExpiry,
      daysRemaining
    },
    unitInfo: matchedUnit
      ? {
          unitBarcode: matchedUnit.unitBarcode,
          packagingType: matchedUnit.packagingType,
          status: matchedUnit.status,
          soldAt: matchedUnit.soldAt,
          disposedAt: matchedUnit.disposedAt,
          invoiceNumber: matchedUnit.invoiceNumber
        }
      : unitBc && matchedBatch
      ? {
          unitBarcode: unitBc,
          packagingType: matchedBatch.packagingType || 'Unit Package',
          status: (matchedBatch.status === 'fully_disposed' ? 'disposed' : 'in_stock') as 'in_stock' | 'sold' | 'disposed'
        }
      : undefined,
    shipment: matchedShipment
      ? {
          id: matchedShipment.id,
          shipmentNumber: matchedShipment.shipmentNumber,
          fromName: matchedShipment.fromName,
          fromRole: matchedShipment.fromRole,
          fromAddress: matchedShipment.fromAddress,
          toName: matchedShipment.toName,
          toRole: matchedShipment.toRole,
          toAddress: matchedShipment.toAddress,
          status: matchedShipment.status,
          ocgCode: matchedShipment.ocgVerificationCode,
          createdAt: matchedShipment.createdAt
        }
      : undefined,
    custodyEvents,
    authenticityStatus,
    verificationHash,
    verifiedAt
  };
}

/**
 * Returns a list of all active registered batch numbers for quick-testing demo buttons on public scanner
 */
export async function getPublicSampleBatches() {
  const db = await readDb();
  return (db.batches || []).slice(0, 6).map(b => ({
    id: b.id,
    batchNumber: b.batchNumber,
    medicineName: b.medicineName,
    qrData: b.qrData
  }));
}
