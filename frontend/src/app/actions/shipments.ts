"use server";

import { readDb, writeDb, Shipment, createAlert, InventoryItem } from '@/lib/db';
import { getCurrentSession } from './auth';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { extractBatchId, generateBatchQrCode } from '@/lib/qrHelper';
import { generateOcgSecurityCode } from '@/lib/ocgHelper';

function revalidateAllDashboards() {
  try {
    revalidatePath('/retailer');
    revalidatePath('/distributor');
    revalidatePath('/distributor/returns');
    revalidatePath('/manufacturer');
    revalidatePath('/manufacturer/returns');
    revalidatePath('/manufacturer/receive');
    revalidatePath('/disposer');
    revalidatePath('/', 'layout');
  } catch (e) {
    // Ignore outside of request context
  }
}

// ─── CREATE SHIPMENT (Manufacturer → Distributor, Distributor → Retailer, etc.) ───
export async function createShipment(data: FormData) {
  const session = await getCurrentSession();
  if (!session) return { error: 'Unauthorized' };

  const batchId = data.get('batchId') as string;
  const toId = data.get('toId') as string;
  const quantityStr = data.get('quantity') as string;
  const quantity = parseInt(quantityStr);
  const type = (data.get('type') as string) || 'forward';
  const notes = data.get('notes') as string;

  if (!batchId || !toId || !quantity || quantity <= 0) return { error: 'All fields are required.' };

  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId);
  if (!batch) return { error: 'Batch not found.' };

  if (batch.isFrozen) {
    return { error: `CRITICAL REGULATORY HOLD: Batch ${batch.batchNumber} (${batch.medicineName}) is FROZEN by the Regulatory Authority (${batch.freezeReason || 'Regulatory Hold'}). Shipments cannot be created.` };
  }

  const senderInv = db.inventory.find(i => i.batchId === batchId && i.ownerId === session.sub);
  if (!senderInv || senderInv.quantity < quantity) {
    return { error: `Insufficient inventory. You have ${senderInv?.quantity || 0} units available.` };
  }

  const toUser = db.users.find(u => u.id === toId);
  if (!toUser) return { error: 'Recipient user not found.' };

  if (type === 'disposal') {
    if (toUser.role !== 'disposer') {
      return { error: 'Disposal shipments must be sent to an authorized Disposer.' };
    }
    const nowMs = Date.now();
    const expMs = new Date(batch.expDate).getTime();
    const isExpired = expMs <= nowMs;
    const isNearExpiry = batch.status === 'near_expiry' || isExpired || (expMs - nowMs) <= 60 * 24 * 60 * 60 * 1000;
    if (!isNearExpiry && !['near_expiry', 'return_in_transit'].includes(batch.status)) {
      return { error: 'Disposal shipments are strictly for expired or near-expiry batches. Valid unexpired stock must be shipped to Distributors.' };
    }
  } else {
    if (toUser.role === 'disposer') {
      return { error: 'Disposers only handle expired or near-expiry stock. Please choose Disposal shipment type or select a Distributor.' };
    }
  }

  const shipmentId = crypto.randomUUID();
  const prefix = type === 'return' ? 'RET-' : type === 'disposal' ? 'DSP-' : 'SHP-';
  const shipmentNumber = `${prefix}${Math.floor(1000000 + Math.random() * 9000000)}`;
  const qrData = `PHARMATRACK:SHIPMENT:${shipmentId}`;
  const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
  const now = new Date().toISOString();

  // Generate deterministic anti-tamper OCG Security Alignment Code
  const ocgVerificationCode = generateOcgSecurityCode(
    shipmentNumber,
    batch.batchNumber || batch.id,
    quantity,
    session.sub,
    toUser.id,
    now
  );

  const newShipment: Shipment = {
    id: shipmentId,
    shipmentNumber,
    type: type as any,
    fromId: session.sub,
    fromRole: session.role,
    fromName: session.name,
    toId,
    toRole: toUser.role,
    toName: toUser.name,
    batchId,
    quantity,
    qrCode,
    qrData,
    status: 'awaiting_proof',
    ocgVerificationCode,
    notes,
    createdAt: now,
    updatedAt: now
  };

  db.shipments.push(newShipment);

  // Deduct from sender inventory (reserve it)
  senderInv.quantity -= quantity;
  if (senderInv.quantity === 0) {
    db.inventory = db.inventory.filter(i => !(i.batchId === batchId && i.ownerId === session.sub));
  }

  if (type === 'disposal') {
    batch.status = 'disposal_in_transit';
  } else if (type === 'return') {
    batch.status = 'return_in_transit';
  }

  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: session.role,
    event: type === 'return' ? `Return Shipment Created → ${toUser.name} (${toUser.role})` : `Shipment Created → ${toUser.name} (${toUser.role})`,
    details: `${type === 'return' ? 'Return ' : ''}Shipment #${shipmentNumber}, Qty: ${quantity}. OCG Security Key: ${ocgVerificationCode}`
  });

  createAlert(db, toId, `${type === 'return' ? 'Return shipment' : 'New shipment'} incoming from ${session.name}. Shipment #${shipmentNumber} — ${quantity} units of ${batch.medicineName}.`, 'info', batchId, shipmentId);
  createAlert(db, session.sub, `Shipment #${shipmentNumber} created. Upload courier proof & OCG security sheet to confirm dispatch.`, 'info', batchId, shipmentId);

  await writeDb(db);
  revalidateAllDashboards();
  return { success: true, shipmentId, shipmentNumber };
}

// ─── UPLOAD SENDER PROOF (confirms dispatch with Courier POD + OCG Sheet Verification) ───
export async function uploadSenderProof(shipmentId: string, proofUrl: string, ocgProofUrl?: string) {
  const session = await getCurrentSession();
  if (!session) return { error: 'Unauthorized' };

  if (!proofUrl) {
    return { error: 'Courier signed proof (POD) is required.' };
  }
  if (!ocgProofUrl) {
    return { error: 'OCG Sheet photo verification is required to confirm physical order alignment and prevent QR forgery.' };
  }

  const db = await readDb();
  const shipment = db.shipments.find(s => s.id === shipmentId && s.fromId === session.sub);
  if (!shipment) return { error: 'Shipment not found.' };
  if (shipment.senderProofUrl && shipment.senderOcgProofUrl) return { error: 'Proof already uploaded.' };

  shipment.senderProofUrl = proofUrl;
  shipment.senderOcgProofUrl = ocgProofUrl;
  shipment.status = 'in_transit';
  shipment.updatedAt = new Date().toISOString();

  // If shipment had no OCG code previously, generate it now
  if (!shipment.ocgVerificationCode) {
    shipment.ocgVerificationCode = generateOcgSecurityCode(
      shipment.shipmentNumber,
      shipment.batchId,
      shipment.quantity,
      shipment.fromId,
      shipment.toId,
      shipment.createdAt
    );
  }

  const batch = db.batches.find(b => b.id === shipment.batchId);
  if (batch) {
    batch.history.push({
      timestamp: new Date().toISOString(),
      actorId: session.sub,
      actorName: session.name,
      actorRole: session.role,
      event: 'Dispatch Confirmed — In Transit',
      details: `Courier POD & OCG Sheet uploaded (OCG: ${shipment.ocgVerificationCode}). Order alignment verified. Shipment #${shipment.shipmentNumber} now in transit to ${shipment.toName}.`
    });
  }

  createAlert(db, shipment.toId, `Shipment #${shipment.shipmentNumber} from ${session.name} is now in transit with verified OCG Gatepass.`, 'warning', shipment.batchId, shipmentId);

  await writeDb(db);
  revalidateAllDashboards();
  return { success: true };
}

// ─── CONFIRM RECEIPT (Distributor/Retailer/Disposer scans and receives) ───
export async function confirmReceipt(data: FormData) {
  const session = await getCurrentSession();
  if (!session) return { error: 'Unauthorized' };

  const shipmentQrData = data.get('shipmentQr') as string;
  const medicineQrData = data.get('medicineQr') as string;
  const receivedQtyStr = data.get('quantity') as string;
  const receivedQty = parseInt(receivedQtyStr);
  const proofUrl = data.get('proofUrl') as string;
  const ocgProofUrl = data.get('ocgProofUrl') as string;

  if (!shipmentQrData || !medicineQrData || !receivedQty || !proofUrl || !ocgProofUrl) {
    return { error: 'All verification items required: Shipment QR, Medicine QR, quantity, Courier proof, and OCG Security Sheet photo.' };
  }

  const db = await readDb();

  // Find shipment by QR
  const shipment = db.shipments.find(s => s.qrData === shipmentQrData && s.toId === session.sub);
  if (!shipment) return { error: 'Shipment QR not found or not addressed to you.' };
  if (shipment.status === 'received') return { error: 'Shipment already received.' };
  if (shipment.status !== 'in_transit') return { error: 'Shipment is not yet in transit. Sender must upload courier proof first.' };

  // Find batch by Medicine QR (supports extracted Batch ID, full QR content, or legacy QR)
  const extractedBatchId = extractBatchId(medicineQrData);
  const batch = db.batches.find(b =>
    b.id === extractedBatchId ||
    b.id === medicineQrData ||
    b.qrData === medicineQrData ||
    b.batchNumber === extractedBatchId ||
    b.batchNumber === medicineQrData
  );
  if (!batch) return { error: 'Medicine QR not recognized.' };
  if (batch.id !== shipment.batchId) return { error: 'Medicine QR does not match this shipment.' };

  if (batch.isFrozen) {
    return { error: `CRITICAL REGULATORY HOLD: Batch ${batch.batchNumber} (${batch.medicineName}) is FROZEN by the Regulatory Authority (${batch.freezeReason || 'Regulatory Hold'}). Intake receipt cannot be finalized while frozen.` };
  }

  // Quantity check
  if (receivedQty !== shipment.quantity) {
    createAlert(db, session.sub, `QUANTITY MISMATCH: Shipment #${shipment.shipmentNumber} expected ${shipment.quantity} units but you entered ${receivedQty}.`, 'danger', batch.id, shipment.id);
    createAlert(db, shipment.fromId, `QUANTITY MISMATCH alert on Shipment #${shipment.shipmentNumber} — ${session.name} received ${receivedQty} but expected ${shipment.quantity}.`, 'danger', batch.id, shipment.id);
    await writeDb(db);
    return { error: `Quantity mismatch! Expected ${shipment.quantity} units, you entered ${receivedQty}. Alert raised.` };
  }

  // Mark received with dual verification proofs
  shipment.status = 'received';
  shipment.receiverProofUrl = proofUrl;
  shipment.receiverOcgProofUrl = ocgProofUrl;
  shipment.updatedAt = new Date().toISOString();

  // Add to receiver inventory
  const existingInv = db.inventory.find(i => i.batchId === batch.id && i.ownerId === session.sub);
  if (existingInv) {
    existingInv.quantity += receivedQty;
  } else {
    db.inventory.push({
      id: crypto.randomUUID(),
      batchId: batch.id,
      ownerId: session.sub,
      ownerRole: session.role,
      quantity: receivedQty,
      status: 'in_stock'
    });
  }

  const now = new Date().toISOString();
  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: session.role,
    event: `Received by ${session.role} — ${session.name}`,
    details: `${receivedQty} units received. Proof uploaded. Inventory updated.`
  });

  createAlert(db, shipment.fromId, `Shipment #${shipment.shipmentNumber} received by ${session.name}. ${receivedQty} units confirmed.`, 'success', batch.id, shipment.id);
  createAlert(db, session.sub, `You received ${receivedQty} units of ${batch.medicineName} (${batch.batchNumber}). Stock added to inventory.`, 'success', batch.id, shipment.id);

  // If disposer receiving, create a disposal record with quantity
  if (session.role === 'disposer') {
    const existingRecord = db.disposalRecords.find(d => d.shipmentId === shipment.id);
    if (!existingRecord) {
      db.disposalRecords.push({
        id: crypto.randomUUID(),
        batchId: batch.id,
        shipmentId: shipment.id,
        disposerId: session.sub,
        disposerName: session.name,
        quantity: receivedQty,
        status: 'pending',
        createdAt: now
      });
    }
  }

  // If manufacturer receives a return shipment, mark batch as near_expiry
  if (session.role === 'manufacturer' && shipment.type === 'return') {
    batch.status = 'near_expiry';
    const returnedInv = db.inventory.find(i => i.batchId === batch.id && i.ownerId === session.sub);
    if (returnedInv) returnedInv.status = 'near_expiry';
  }

  await writeDb(db);
  revalidateAllDashboards();
  return { success: true, batchId: batch.id, medicineName: batch.medicineName, quantity: receivedQty };
}

// ─── GET INCOMING SHIPMENTS for current user ───
export async function getIncomingShipments() {
  const session = await getCurrentSession();
  if (!session) return [];
  const db = await readDb();
  return db.shipments
    .filter(s => s.toId === session.sub && s.status !== 'received')
    .map(s => ({ ...s, batch: db.batches.find(b => b.id === s.batchId) }));
}

// ─── GET ALL SHIPMENTS (sent + received) for current user ───
export async function getAllShipments() {
  const session = await getCurrentSession();
  if (!session) return [];
  const db = await readDb();
  return db.shipments
    .filter(s => s.fromId === session.sub || s.toId === session.sub)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(s => ({ ...s, batch: db.batches.find(b => b.id === s.batchId) }));
}

// ─── RECORD SALE (Retailer) ───
export async function recordSale(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'retailer') return { error: 'Unauthorized' };

  const medicineQrData = data.get('medicineQr') as string;
  const quantityStr = data.get('quantity') as string;
  const quantity = parseInt(quantityStr);

  if (!medicineQrData || !quantity || quantity <= 0) return { error: 'QR code and quantity required.' };

  const db = await readDb();
  const extractedBatchId = extractBatchId(medicineQrData);
  const batch = db.batches.find(b =>
    b.id === extractedBatchId ||
    b.id === medicineQrData ||
    b.qrData === medicineQrData ||
    b.batchNumber === extractedBatchId ||
    b.batchNumber === medicineQrData
  );
  if (!batch) return { error: 'Medicine QR not recognized.' };

  if (batch.isFrozen) {
    return { error: `CRITICAL SAFETY HOLD: Batch ${batch.batchNumber} (${batch.medicineName}) has been FROZEN by the Regulatory Authority (${batch.freezeReason || 'Regulatory Hold'}). Dispensing this medicine to patients is strictly prohibited.` };
  }

  const inv = db.inventory.find(i => i.batchId === batch.id && i.ownerId === session.sub);
  if (!inv || inv.quantity < quantity) return { error: `Insufficient stock. Available: ${inv?.quantity || 0}` };

  inv.quantity -= quantity;

  db.sales.push({
    id: crypto.randomUUID(),
    retailerId: session.sub,
    retailerName: session.name,
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    medicineName: batch.medicineName,
    quantity,
    soldAt: new Date().toISOString()
  });

  batch.history.push({
    timestamp: new Date().toISOString(),
    actorId: session.sub,
    actorName: session.name,
    actorRole: 'retailer',
    event: `Sale Recorded`,
    details: `${quantity} units sold by ${session.name}.`
  });

  // Low stock alert (< 10% of typical pack)
  if (inv.quantity < 20) {
    createAlert(db, session.sub, `LOW STOCK: Only ${inv.quantity} units of ${batch.medicineName} remaining. Consider reordering.`, 'warning', batch.id);
  }

  await writeDb(db);
  revalidateAllDashboards();
  return { success: true, medicineName: batch.medicineName, remaining: inv.quantity };
}

// ─── INITIATE RETURN (Retailer or Distributor returning near-expiry stock) ───
export async function initiateReturn(data: FormData) {
  const session = await getCurrentSession();
  if (!session || (session.role !== 'retailer' && session.role !== 'distributor')) return { error: 'Unauthorized' };

  const batchId = data.get('batchId') as string;
  const toId = data.get('toId') as string;
  const quantityStr = data.get('quantity') as string;
  const quantity = parseInt(quantityStr);

  if (!batchId || !toId || !quantity || quantity <= 0) return { error: 'All fields required.' };

  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId);
  if (!batch) return { error: 'Batch not found.' };

  const inv = db.inventory.find(i => i.batchId === batchId && i.ownerId === session.sub);
  if (!inv || inv.quantity < quantity) return { error: `Insufficient stock. Available: ${inv?.quantity || 0}` };

  const toUser = db.users.find(u => u.id === toId);
  if (!toUser) return { error: 'Recipient not found.' };

  inv.quantity -= quantity;
  if (inv.quantity === 0) {
    db.inventory = db.inventory.filter(i => !(i.id === inv.id));
  } else {
    inv.status = 'reserved_for_return';
  }

  const shipmentId = crypto.randomUUID();
  const shipmentNumber = `RET-${Math.floor(Math.random() * 10000000)}`;
  const qrData = `PHARMATRACK:SHIPMENT:${shipmentId}`;
  const qrCode = await QRCode.toDataURL(qrData, { width: 300, margin: 2 });
  const now = new Date().toISOString();

  // Generate deterministic anti-tamper OCG Security Alignment Code
  const ocgVerificationCode = generateOcgSecurityCode(
    shipmentNumber,
    batchId,
    quantity,
    session.sub,
    toId,
    now
  );

  db.shipments.push({
    id: shipmentId,
    shipmentNumber,
    type: 'return',
    fromId: session.sub,
    fromRole: 'retailer',
    fromName: session.name,
    toId,
    toRole: toUser.role,
    toName: toUser.name,
    batchId,
    quantity,
    qrCode,
    qrData,
    status: 'awaiting_proof',
    ocgVerificationCode,
    notes: 'Near-expiry return',
    createdAt: now,
    updatedAt: now
  });

  batch.status = 'return_in_transit';
  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: 'retailer',
    event: 'Near-Expiry Return Initiated',
    details: `${quantity} units being returned to ${toUser.name}. Return Shipment #${shipmentNumber} created.`
  });

  createAlert(db, toId, `Return shipment incoming from ${session.name} — ${quantity} units of ${batch.medicineName} (Near Expiry). Shipment #${shipmentNumber}.`, 'warning', batchId, shipmentId);
  createAlert(db, session.sub, `Return shipment #${shipmentNumber} created. Upload courier proof to confirm dispatch.`, 'info', batchId, shipmentId);

  await writeDb(db);
  revalidateAllDashboards();
  return { success: true, shipmentId, shipmentNumber };
}

// ─── CANCEL / UNDO RETURN SHIPMENT ───
export async function cancelReturnShipment(shipmentId: string) {
  const session = await getCurrentSession();
  if (!session) return { error: 'Unauthorized' };

  const db = await readDb();
  const shipmentIndex = db.shipments.findIndex(s => s.id === shipmentId && s.fromId === session.sub && s.type === 'return');
  if (shipmentIndex === -1) return { error: 'Return shipment not found or cannot be cancelled.' };

  const shipment = db.shipments[shipmentIndex];
  if (shipment.status === 'received') {
    return { error: 'Cannot cancel a return that has already been received by the recipient.' };
  }

  // Restore inventory to sender
  const inv = db.inventory.find(i => i.batchId === shipment.batchId && i.ownerId === session.sub);
  if (inv) {
    inv.quantity += shipment.quantity;
    inv.status = 'near_expiry';
  } else {
    db.inventory.push({
      id: crypto.randomUUID(),
      batchId: shipment.batchId,
      ownerId: session.sub,
      ownerRole: session.role,
      quantity: shipment.quantity,
      status: 'near_expiry'
    });
  }

  // Restore batch status
  const batch = db.batches.find(b => b.id === shipment.batchId);
  if (batch) {
    batch.status = 'near_expiry';
    batch.history = batch.history.filter(h => !(h.actorId === session.sub && h.event === 'Near-Expiry Return Initiated' && h.details?.includes(shipment.shipmentNumber)));
  }

  // Remove alerts associated with this shipment
  db.alerts = db.alerts.filter(a => a.shipmentId !== shipment.id);

  // Remove the return shipment
  db.shipments.splice(shipmentIndex, 1);

  await writeDb(db);
  revalidateAllDashboards();
  return { success: true };
}

// ─── FINALIZE DISPOSAL (Disposer) ───
export async function finalizeDisposal(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'disposer') return { error: 'Unauthorized' };

  const disposalId = data.get('disposalId') as string;
  const photoBeforeUrl = data.get('photoBeforeUrl') as string;
  const photoAfterUrl = data.get('photoAfterUrl') as string;
  const videoUrl = data.get('videoUrl') as string;
  const certificateUrl = data.get('certificateUrl') as string;

  if (!disposalId || !photoBeforeUrl || !photoAfterUrl || !videoUrl || !certificateUrl) {
    return { error: 'All files required: photo before, photo after, video, and certificate.' };
  }

  const db = await readDb();
  const record = db.disposalRecords.find(d => d.id === disposalId && d.disposerId === session.sub);
  if (!record) return { error: 'Disposal record not found.' };
  if (record.status === 'completed') return { error: 'Disposal already completed.' };

  const now = new Date().toISOString();
  record.photoBeforeUrl = photoBeforeUrl;
  record.photoAfterUrl = photoAfterUrl;
  record.videoUrl = videoUrl;
  record.certificateUrl = certificateUrl;
  record.status = 'completed';
  record.completedAt = now;

  const batch = db.batches.find(b => b.id === record.batchId);
  if (batch) {
    batch.status = 'fully_disposed';
    batch.history.push({
      timestamp: now,
      actorId: session.sub,
      actorName: session.name,
      actorRole: 'disposer',
      event: 'FULLY DISPOSED ✓',
      details: `Safe disposal completed by ${session.name}. Certificate and photo/video proofs uploaded.`
    });

    // Remove from disposer inventory
    db.inventory = db.inventory.filter(i => !(i.batchId === batch.id && i.ownerId === session.sub));

    // Notify manufacturer
    createAlert(db, batch.manufacturerId, `Batch ${batch.batchNumber} (${batch.medicineName}) has been safely disposed by ${session.name}. Disposal certificate is available.`, 'success', batch.id);
  }

  await writeDb(db);
  revalidateAllDashboards();
  return { success: true };
}

// ─── GET USERS BY ROLE ───
export async function getUsersByRole(role: string) {
  const session = await getCurrentSession();
  if (!session) return [];
  const db = await readDb();
  return db.users.filter(u => u.role === role).map(u => ({ id: u.id, name: u.name, email: u.email }));
}

// ─── CHECK EXPIRY ALERTS ───
export async function checkExpiryAlerts() {
  const session = await getCurrentSession();
  if (!session) return;

  const db = await readDb();
  const now = Date.now();
  const THRESHOLD_DAYS = 60;
  let hasChanges = false;

  const userInventory = db.inventory.filter(i => i.ownerId === session.sub && i.status === 'in_stock');

  for (const inv of userInventory) {
    const batch = db.batches.find(b => b.id === inv.batchId);
    if (!batch) continue;

    const daysToExpiry = Math.floor((new Date(batch.expDate).getTime() - now) / (1000 * 60 * 60 * 24));
    if (daysToExpiry <= THRESHOLD_DAYS && daysToExpiry >= 0) {
      if (inv.status !== 'near_expiry') {
        inv.status = 'near_expiry';
        hasChanges = true;
      }
      if (batch.status === 'in_stock') {
        batch.status = 'near_expiry';
        hasChanges = true;
      }

      // Only alert if not already alerted recently (check last 24h)
      const recentAlert = db.alerts.find(a =>
        a.userId === session.sub && a.batchId === batch.id && a.type === 'danger' &&
        (now - new Date(a.createdAt).getTime()) < 24 * 60 * 60 * 1000
      );
      if (!recentAlert) {
        createAlert(db, session.sub, `⚠️ NEAR EXPIRY: ${batch.medicineName} (${batch.batchNumber}) expires in ${daysToExpiry} days! Initiate return immediately.`, 'danger', batch.id);
        createAlert(db, batch.manufacturerId, `Near-expiry alert: ${batch.medicineName} (${batch.batchNumber}) is near expiry at ${session.name}'s location — ${daysToExpiry} days remaining.`, 'warning', batch.id);
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    await writeDb(db);
  }
}

// ─── GET RETAILER INVENTORY with expiry info & supplier provenance ───
export async function getRetailerInventory() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'retailer') return [];
  const db = await readDb();
  const inventory = db.inventory.filter(i => i.ownerId === session.sub);
  const now = Date.now();

  return inventory.map(inv => {
    const batch = db.batches.find(b => b.id === inv.batchId);
    const daysToExpiry = batch ? Math.floor((new Date(batch.expDate).getTime() - now) / (1000 * 60 * 60 * 24)) : null;

    // Find latest received delivery shipment for this batch to this retailer
    const incomingShipments = db.shipments
      .filter(s => s.toId === session.sub && s.batchId === inv.batchId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    const deliveryShipment = incomingShipments.find(s => s.status === 'received') || incomingShipments[0];

    // Identify who supplied it to this retailer
    const supplierUser = deliveryShipment ? db.users.find(u => u.id === deliveryShipment.fromId) : null;
    const mfrUser = batch ? db.users.find(u => u.id === batch.manufacturerId) : null;

    const supplier = {
      id: deliveryShipment?.fromId || batch?.manufacturerId || '',
      name: deliveryShipment?.fromName || supplierUser?.name || batch?.manufacturerName || 'Distributor',
      role: deliveryShipment?.fromRole || supplierUser?.role || 'distributor',
      email: supplierUser?.email || '',
      shipmentNumber: deliveryShipment?.shipmentNumber || '',
      boughtQuantity: deliveryShipment?.quantity ?? inv.quantity
    };

    const manufacturer = {
      id: batch?.manufacturerId || '',
      name: batch?.manufacturerName || mfrUser?.name || 'Manufacturer',
      role: 'manufacturer' as const,
      email: mfrUser?.email || ''
    };

    const boughtQuantity = deliveryShipment?.quantity ?? inv.quantity;

    return {
      ...inv,
      batch,
      daysToExpiry,
      supplier,
      manufacturer,
      boughtQuantity,
      returnableQuantity: inv.quantity
    };
  });
}

// ─── GET DISTRIBUTOR DATA ───
export async function getDistributorDashboard() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'distributor') return null;
  const db = await readDb();

  const inventory = db.inventory.filter(i => i.ownerId === session.sub);
  const incomingShipments = db.shipments.filter(s => s.toId === session.sub && s.status !== 'received');
  const outgoingShipments = db.shipments.filter(s => s.fromId === session.sub);
  const alerts = db.alerts.filter(a => a.userId === session.sub && !a.isRead)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  const retailers = db.users.filter(u => u.role === 'retailer').map(u => ({ id: u.id, name: u.name, email: u.email }));
  const manufacturers = db.users.filter(u => u.role === 'manufacturer').map(u => ({ id: u.id, name: u.name, email: u.email }));

  const enrichedInventory = inventory.map(inv => ({ ...inv, batch: db.batches.find(b => b.id === inv.batchId) }));

  return { inventory: enrichedInventory, incomingShipments: incomingShipments.map(s => ({ ...s, batch: db.batches.find(b => b.id === s.batchId) })), outgoingShipments: outgoingShipments.map(s => ({ ...s, batch: db.batches.find(b => b.id === s.batchId) })), alerts, retailers, manufacturers };
}

// ─── GET DISPOSER DATA ───
export async function getDisposerDashboard() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'disposer') return null;
  const db = await readDb();

  const incomingShipments = db.shipments.filter(s => s.toId === session.sub);
  const disposalRecords = db.disposalRecords.filter(d => d.disposerId === session.sub);
  const alerts = db.alerts.filter(a => a.userId === session.sub && !a.isRead)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return {
    incomingShipments: incomingShipments.map(s => ({ ...s, batch: db.batches.find(b => b.id === s.batchId) })),
    disposalRecords: disposalRecords.map(d => {
      const shp = db.shipments.find(s => s.id === d.shipmentId);
      return {
        ...d,
        quantity: d.quantity ?? shp?.quantity ?? 0,
        batch: db.batches.find(b => b.id === d.batchId),
        shipment: shp
      };
    }),
    alerts
  };
}

// ─── MARK ALERTS AS READ ───
export async function markAlertsRead() {
  const session = await getCurrentSession();
  if (!session) return;
  const db = await readDb();
  db.alerts.filter(a => a.userId === session.sub).forEach(a => { a.isRead = true; });
  await writeDb(db);
}

// ─── GET SHIPMENT DETAILS FOR SHIPPING MANDATE / LABEL ───
export async function getShipmentForMandate(shipmentId: string) {
  const session = await getCurrentSession();
  if (!session) return null;

  const db = await readDb();
  const shipment = db.shipments.find(s => s.id === shipmentId || s.shipmentNumber === shipmentId);
  if (!shipment) return null;

  const batch = db.batches.find(b => b.id === shipment.batchId);
  const fromUser = db.users.find(u => u.id === shipment.fromId);
  const toUser = db.users.find(u => u.id === shipment.toId);

  // Ensure batch QR is present
  let batchQrCode = batch?.qrCode;
  if (batch && !batchQrCode) {
    const res = await generateBatchQrCode({
      manufacturerName: batch.manufacturerName,
      medicineName: batch.medicineName,
      batchNumber: batch.batchNumber,
      mfgDate: batch.mfgDate,
      expDate: batch.expDate,
      unitDetails: batch.unitDetails,
      totalQuantity: batch.totalQuantity,
      batchId: batch.id
    });
    batchQrCode = res.qrCode;
  }

  // Ensure high-resolution large shipment QR code is present
  let shipmentQrCode = shipment.qrCode;
  if (!shipmentQrCode || shipmentQrCode.length < 50) {
    shipmentQrCode = await QRCode.toDataURL(shipment.qrData || `PHARMATRACK:SHIPMENT:${shipment.id}`, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' }
    });
  }

  return {
    shipment: {
      ...shipment,
      qrCode: shipmentQrCode
    },
    batch: batch ? {
      ...batch,
      qrCode: batchQrCode
    } : null,
    fromUser: fromUser ? { name: fromUser.name, email: fromUser.email, role: fromUser.role } : null,
    toUser: toUser ? { name: toUser.name, email: toUser.email, role: toUser.role } : null
  };
}
