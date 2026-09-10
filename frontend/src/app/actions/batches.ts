"use server";

import { readDb, writeDb, clearDbCache, Batch, InventoryItem, createAlert, HistoryEvent } from '@/lib/db';
import { getCurrentSession } from './auth';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { generateBatchQrCode } from '@/lib/qrHelper';

export async function createBatch(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'manufacturer') return { error: 'Unauthorized' };

  const medicineName = data.get('medicineName') as string;
  const medicineType = data.get('medicineType') as string;
  let batchNumber = (data.get('batchNumber') as string)?.trim();
  const mfgDate = data.get('mfgDate') as string;
  const expDate = data.get('expDate') as string;
  const totalQuantity = parseInt(data.get('totalQuantity') as string);
  const unitDetails = data.get('unitDetails') as string;

  if (!batchNumber) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    batchNumber = `BN-${year}${month}-${randomSuffix}`;
  }

  if (!medicineName || !medicineType || !batchNumber || !mfgDate || !expDate || !totalQuantity || !unitDetails) {
    return { error: 'All fields are required.' };
  }

  const db = await readDb();
  if (db.batches.find(b => b.batchNumber === batchNumber)) {
    // If it was auto-generated or collision occurs, generate a unique one
    let attempts = 0;
    while (db.batches.find(b => b.batchNumber === batchNumber) && attempts < 10) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      batchNumber = `BN-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;
      attempts++;
    }
    if (db.batches.find(b => b.batchNumber === batchNumber)) {
      return { error: 'Batch number already exists. Please regenerate a unique batch number.' };
    }
  }

  // Generate unique Batch ID format e.g. BAT-9f3k2x7m
  let batchId = `BAT-${crypto.randomBytes(4).toString('hex')}`;
  while (db.batches.some(b => b.id === batchId)) {
    batchId = `BAT-${crypto.randomBytes(4).toString('hex')}`;
  }

  // Generate human-readable multi-line QR with all batch details and Batch ID
  const { qrData, qrCode } = await generateBatchQrCode({
    manufacturerName: session.name,
    medicineName,
    batchNumber,
    mfgDate,
    expDate,
    unitDetails,
    totalQuantity,
    batchId
  });

  const now = Date.now();
  const expTime = new Date(expDate).getTime();
  const isExpired = expTime <= now;
  const isNear = isExpired || (expTime - now) <= 60 * 24 * 60 * 60 * 1000;
  const initialStatus = isNear ? 'near_expiry' : 'in_stock';

  const newBatch: Batch = {
    id: batchId,
    batchNumber,
    medicineName,
    medicineType,
    mfgDate,
    expDate,
    totalQuantity,
    unitDetails,
    qrCode,
    qrData,
    manufacturerId: session.sub,
    manufacturerName: session.name,
    status: initialStatus,
    history: [{
      timestamp: new Date().toISOString(),
      actorId: session.sub,
      actorName: session.name,
      actorRole: 'manufacturer',
      event: 'Batch Created',
      details: `${totalQuantity} units created. Batch locked permanently.`
    }],
    createdAt: new Date().toISOString()
  };

  db.batches.push(newBatch);
  db.inventory.push({
    id: crypto.randomUUID(),
    batchId,
    ownerId: session.sub,
    ownerRole: 'manufacturer',
    quantity: totalQuantity,
    status: initialStatus === 'near_expiry' ? 'near_expiry' : 'in_stock'
  });

  createAlert(db, session.sub, `Batch ${batchNumber} (${medicineName}) created with ${totalQuantity} units. QR code generated.`, 'success', batchId);
  await writeDb(db);
  try {
    revalidatePath('/manufacturer');
    revalidatePath('/', 'layout');
  } catch (e) {}

  return { success: true, batchId };
}

export async function getManufacturerDashboard() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'manufacturer') return null;
  const db = await readDb();

  const inventory = db.inventory.filter(i => i.ownerId === session.sub);
  const now = Date.now();

  const batches = db.batches.filter(b => b.manufacturerId === session.sub).map(b => {
    const inv = inventory.find(i => i.batchId === b.id);
    const availableQuantity = inv?.quantity || 0;
    const expTime = new Date(b.expDate).getTime();
    const isExpired = expTime <= now;
    const daysToExpiry = Math.floor((expTime - now) / (1000 * 60 * 60 * 24));
    const isNearExpiry = isExpired || daysToExpiry <= 60 || b.status === 'near_expiry';
    return {
      ...b,
      availableQuantity,
      isExpired,
      daysToExpiry,
      isNearExpiry
    };
  });

  const shipments = db.shipments.filter(s => s.fromId === session.sub || s.toId === session.sub);
  const alerts = db.alerts.filter(a => a.userId === session.sub && !a.isRead)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
  const disposalRecords = db.disposalRecords.filter(d =>
    batches.some(b => b.id === d.batchId)
  );

  const totalStock = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const inTransit = shipments.filter(s => s.status === 'in_transit' && s.fromId === session.sub).length;
  const nearExpiry = batches.filter(b => b.isNearExpiry).length;
  const disposed = batches.filter(b => b.status === 'fully_disposed').length;

  return { batches, inventory, shipments, alerts, disposalRecords, stats: { totalStock, inTransit, nearExpiry, disposed } };
}

export async function getBatchDetail(batchId: string) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'manufacturer') return null;
  const db = await readDb();
  const rawBatch = db.batches.find(b => b.id === batchId && b.manufacturerId === session.sub);
  if (!rawBatch) return null;
  const inv = db.inventory.find(i => i.batchId === batchId && i.ownerId === session.sub);
  const availableQuantity = inv?.quantity || 0;
  const now = Date.now();
  const expTime = new Date(rawBatch.expDate).getTime();
  const isExpired = expTime <= now;
  const daysToExpiry = Math.floor((expTime - now) / (1000 * 60 * 60 * 24));
  const batch = {
    ...rawBatch,
    availableQuantity,
    isExpired,
    daysToExpiry,
    isNearExpiry: isExpired || daysToExpiry <= 60 || rawBatch.status === 'near_expiry'
  };
  const shipments = db.shipments.filter(s => s.batchId === batchId);
  const disposalRecord = db.disposalRecords.find(d => d.batchId === batchId);
  return { batch, shipments, disposalRecord };
}

export async function markBatchReadyToShip(batchId: string) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'manufacturer') return { error: 'Unauthorized' };
  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId && b.manufacturerId === session.sub);
  if (!batch) return { error: 'Batch not found' };
  batch.history.push({ timestamp: new Date().toISOString(), actorId: session.sub, actorName: session.name, actorRole: 'manufacturer', event: 'Marked Ready to Ship' });
  await writeDb(db);
  try { revalidatePath('/manufacturer'); revalidatePath('/', 'layout'); } catch (e) {}
  return { success: true };
}

export async function clearBatchData() {
  const session = await getCurrentSession();
  if (!session) return { error: 'Unauthorized' };
  clearDbCache();
  const db = await readDb();
  db.batches = [];
  db.inventory = [];
  db.shipments = [];
  db.sales = [];
  db.disposalRecords = [];
  db.alerts = [];
  await writeDb(db);
  try {
    revalidatePath('/manufacturer');
    revalidatePath('/retailer');
    revalidatePath('/distributor');
    revalidatePath('/disposer');
    revalidatePath('/', 'layout');
  } catch (e) {}
  return { success: true };
}
