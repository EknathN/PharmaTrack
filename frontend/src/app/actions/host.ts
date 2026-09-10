"use server";

import { readDb, writeDb, clearDbCache, createAlert, Batch } from '@/lib/db';
import { getCurrentSession } from './auth';
import { revalidatePath } from 'next/cache';

function revalidateAllPortals() {
  try {
    revalidatePath('/host');
    revalidatePath('/host/batches');
    revalidatePath('/host/expiry');
    revalidatePath('/host/returns');
    revalidatePath('/host/disposals');
    revalidatePath('/host/security');
    revalidatePath('/host/reports');
    revalidatePath('/manufacturer');
    revalidatePath('/distributor');
    revalidatePath('/retailer');
    revalidatePath('/disposer');
    revalidatePath('/', 'layout');
  } catch (e) {}
}

export async function freezeBatch(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') {
    return { error: 'Unauthorized: Only Regulatory Control Host accounts can freeze batches.' };
  }

  const batchId = data.get('batchId') as string;
  const reason = (data.get('reason') as string)?.trim() || 'Precautionary Regulatory Hold';

  if (!batchId) return { error: 'Batch ID is required.' };

  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId);
  if (!batch) return { error: 'Batch not found.' };

  const now = new Date().toISOString();
  batch.isFrozen = true;
  batch.freezeReason = reason;
  batch.frozenAt = now;
  batch.frozenBy = session.name;

  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: 'host',
    event: 'REGULATORY FREEZE APPLIED',
    details: `Batch frozen by ${session.name}. Reason: "${reason}". All movements, dispatches, intakes, and sales are blocked.`
  });

  // Notify manufacturer
  if (batch.manufacturerId) {
    createAlert(
      db,
      batch.manufacturerId,
      `EMERGENCY: Batch ${batch.batchNumber} (${batch.medicineName}) has been FROZEN by Regulatory Authority. Reason: ${reason}`,
      'danger',
      batch.id
    );
  }

  // Notify all current holders in inventory
  const currentHolders = db.inventory.filter(i => i.batchId === batch.id && i.quantity > 0);
  for (const holder of currentHolders) {
    createAlert(
      db,
      holder.ownerId,
      `REGULATORY HOLD: Batch ${batch.batchNumber} (${batch.medicineName}) in your possession is FROZEN. Do NOT ship or dispense.`,
      'danger',
      batch.id
    );
  }

  await writeDb(db);
  revalidateAllPortals();
  return { success: true, batchNumber: batch.batchNumber };
}

export async function unfreezeBatch(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') {
    return { error: 'Unauthorized: Only Regulatory Control Host accounts can lift batch freezes.' };
  }

  const batchId = data.get('batchId') as string;
  const reason = (data.get('reason') as string)?.trim() || 'Compliance verification complete; freeze lifted.';

  if (!batchId) return { error: 'Batch ID is required.' };

  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId);
  if (!batch) return { error: 'Batch not found.' };

  const now = new Date().toISOString();
  batch.isFrozen = false;
  const oldReason = batch.freezeReason;
  batch.freezeReason = undefined;

  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: 'host',
    event: 'REGULATORY FREEZE LIFTED',
    details: `Regulatory freeze removed by ${session.name}. Remarks: "${reason}". (Previous hold reason: "${oldReason}")`
  });

  // Notify manufacturer
  if (batch.manufacturerId) {
    createAlert(
      db,
      batch.manufacturerId,
      `STATUS RESTORED: Freeze on batch ${batch.batchNumber} (${batch.medicineName}) has been lifted by Regulatory Authority. Normal operations may resume.`,
      'success',
      batch.id
    );
  }

  // Notify holders
  const currentHolders = db.inventory.filter(i => i.batchId === batch.id && i.quantity > 0);
  for (const holder of currentHolders) {
    createAlert(
      db,
      holder.ownerId,
      `FREEZE LIFTED: Batch ${batch.batchNumber} is now cleared for distribution and dispense.`,
      'success',
      batch.id
    );
  }

  await writeDb(db);
  revalidateAllPortals();
  return { success: true, batchNumber: batch.batchNumber };
}

export async function flagBatch(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') {
    return { error: 'Unauthorized: Only Regulatory Control Host accounts can flag batches.' };
  }

  const batchId = data.get('batchId') as string;
  const reason = (data.get('reason') as string)?.trim() || 'Active Regulatory Surveillance';

  if (!batchId) return { error: 'Batch ID is required.' };

  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId);
  if (!batch) return { error: 'Batch not found.' };

  const now = new Date().toISOString();
  batch.isFlagged = true;
  batch.flagReason = reason;
  batch.flaggedAt = now;
  batch.flaggedBy = session.name;

  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: 'host',
    event: 'REGULATORY SURVEILLANCE FLAG',
    details: `Flagged for heightened inspection by ${session.name}. Reason: "${reason}".`
  });

  await writeDb(db);
  revalidateAllPortals();
  return { success: true, batchNumber: batch.batchNumber };
}

export async function unflagBatch(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') {
    return { error: 'Unauthorized: Only Regulatory Control Host accounts can remove flags.' };
  }

  const batchId = data.get('batchId') as string;
  if (!batchId) return { error: 'Batch ID is required.' };

  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId);
  if (!batch) return { error: 'Batch not found.' };

  const now = new Date().toISOString();
  batch.isFlagged = false;
  batch.flagReason = undefined;

  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: 'host',
    event: 'REGULATORY FLAG REMOVED',
    details: `Surveillance flag removed by ${session.name}. Batch returned to standard status.`
  });

  await writeDb(db);
  revalidateAllPortals();
  return { success: true, batchNumber: batch.batchNumber };
}
