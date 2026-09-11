"use server";

import { readDb, writeDb, clearDbCache, createAlert, RectificationRequest } from '@/lib/db';
import { getCurrentSession } from './auth';
import { revalidatePath } from 'next/cache';

function revalidateAllPortals() {
  try {
    revalidatePath('/host');
    revalidatePath('/host/batches');
    revalidatePath('/host/proofs');
    revalidatePath('/host/security');
    revalidatePath('/manufacturer');
    revalidatePath('/distributor');
    revalidatePath('/retailer');
    revalidatePath('/disposer');
    revalidatePath('/verify');
    revalidatePath('/', 'layout');
  } catch (e) {}
}

/**
 * Submitted by the person/facility whose batch or shipment proof was frozen.
 * Allows re-uploading fresh, authentic proofs (courier POD, OCG sheet, destruction media, or compliance certificates)
 * and submitting an appeal for regulatory re-verification.
 */
export async function submitProofRectification(data: FormData) {
  const session = await getCurrentSession();
  if (!session) return { error: 'Authentication required.' };

  const batchId = (data.get('batchId') as string)?.trim();
  const appealNotes = (data.get('appealNotes') as string)?.trim();
  const rectifiedProofUrl = (data.get('rectifiedProofUrl') as string)?.trim();
  const rectifiedOcgUrl = (data.get('rectifiedOcgUrl') as string)?.trim() || undefined;

  if (!batchId) return { error: 'Associated batch ID is required.' };
  if (!rectifiedProofUrl) {
    return { error: 'Please upload a new, clear, authenticated proof image or document.' };
  }
  if (!appealNotes) {
    return { error: 'Please provide an explanation / rectification statement for the regulatory inspector.' };
  }

  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId);
  if (!batch) return { error: 'Batch not found.' };

  if (!batch.isFrozen && !batch.isFlagged) {
    return { error: 'This batch is currently in good standing and not frozen.' };
  }

  if (!Array.isArray(db.rectificationRequests)) {
    db.rectificationRequests = [];
  }

  const now = new Date().toISOString();
  const requestId = `REC-${Date.now().toString(36).toUpperCase()}`;

  const newRequest: RectificationRequest = {
    id: requestId,
    batchId: batch.id,
    batchNumber: batch.batchNumber,
    medicineName: batch.medicineName,
    requesterId: session.sub,
    requesterName: session.name,
    requesterRole: session.role,
    reasonForHold: batch.freezeReason || 'Regulatory Hold',
    appealNotes,
    rectifiedProofUrl,
    rectifiedOcgUrl,
    status: 'pending_review',
    submittedAt: now
  };

  db.rectificationRequests.push(newRequest);

  // Update batch state
  batch.hasPendingRectification = true;
  batch.latestRectificationId = requestId;

  // Log in batch history
  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: session.role,
    event: 'RECTIFICATION PROOF SUBMITTED FOR RE-VERIFICATION',
    details: `Rectification appeal submitted by ${session.name} (${session.role}). Remarks: "${appealNotes}". Proof media attached for Central Regulatory Host audit.`
  });

  // Notify Host Control accounts
  const hostUsers = db.users.filter(u => u.role === 'host');
  for (const host of hostUsers) {
    createAlert(
      db,
      host.id,
      `📋 RE-VERIFICATION APPEAL: ${session.name} (${session.role}) has submitted rectified proof media for frozen Batch ${batch.batchNumber}. Please inspect and re-verify.`,
      'warning',
      batch.id
    );
  }

  await writeDb(db);
  revalidateAllPortals();
  return { success: true, requestId, message: 'Rectified proof and appeal submitted to Regulatory Host for re-verification.' };
}

/**
 * Host Action: Inspects the re-uploaded proof media, verifies its authenticity,
 * lifts the freeze, and restores the product to normal circulation.
 */
export async function approveRectificationAndUnfreeze(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') {
    return { error: 'Unauthorized: Only Regulatory Control Host accounts can re-verify and lift freezes.' };
  }

  const batchId = (data.get('batchId') as string)?.trim();
  const rectificationId = (data.get('rectificationId') as string)?.trim();
  const reviewRemarks = (data.get('reviewRemarks') as string)?.trim() || 'Proof re-verified as genuine. Compliance restored.';

  if (!batchId && !rectificationId) {
    return { error: 'Batch ID or Rectification Request ID required.' };
  }

  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId || b.latestRectificationId === rectificationId);
  if (!batch) return { error: 'Batch record not found.' };

  const req = (db.rectificationRequests || []).find(
    r => r.id === rectificationId || (r.batchId === batch.id && r.status === 'pending_review')
  );

  const now = new Date().toISOString();

  // Mark rectification request as approved
  if (req) {
    req.status = 'approved_reverified';
    req.reviewedAt = now;
    req.reviewedBy = session.name;
    req.reviewRemarks = reviewRemarks;
  }

  // Lift regulatory freeze
  batch.isFrozen = false;
  batch.hasPendingRectification = false;
  const previousReason = batch.freezeReason;
  batch.freezeReason = undefined;

  // Append immutable audit milestone
  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: 'host',
    event: 'REGULATORY FREEZE LIFTED (PROOF RE-VERIFIED & APPROVED)',
    details: `Proof inspected and re-verified genuine by ${session.name}. ${reviewRemarks}. Previous hold reason: "${previousReason}". Batch reinstated for distribution and dispense.`
  });

  // Notify the person who submitted the appeal
  if (req?.requesterId) {
    createAlert(
      db,
      req.requesterId,
      `✅ RE-VERIFIED & RESTORED: Regulatory freeze on Batch ${batch.batchNumber} (${batch.medicineName}) has been LIFTED! Your rectified proof was approved by ${session.name}.`,
      'success',
      batch.id
    );
  }

  // Notify manufacturer if different
  if (batch.manufacturerId && batch.manufacturerId !== req?.requesterId) {
    createAlert(
      db,
      batch.manufacturerId,
      `✅ STATUS RESTORED: Freeze on Batch ${batch.batchNumber} has been lifted by Regulatory Host after proof re-verification.`,
      'success',
      batch.id
    );
  }

  // Notify all current holders in inventory
  const currentHolders = db.inventory.filter(i => i.batchId === batch.id && i.quantity > 0);
  for (const holder of currentHolders) {
    createAlert(
      db,
      holder.ownerId,
      `FREEZE LIFTED: Batch ${batch.batchNumber} has been re-verified by Regulatory Host and is cleared for distribution and dispense.`,
      'success',
      batch.id
    );
  }

  await writeDb(db);
  revalidateAllPortals();
  return { success: true, batchNumber: batch.batchNumber, message: `Batch ${batch.batchNumber} successfully re-verified and freeze lifted.` };
}

/**
 * Host Action: Rejects the re-uploaded proof with specific feedback.
 * The batch remains frozen until proper compliance proof is submitted.
 */
export async function rejectRectification(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') {
    return { error: 'Unauthorized: Only Regulatory Control Host accounts can audit rectifications.' };
  }

  const batchId = (data.get('batchId') as string)?.trim();
  const rectificationId = (data.get('rectificationId') as string)?.trim();
  const rejectionReason = (data.get('rejectionReason') as string)?.trim();

  if (!rejectionReason) {
    return { error: 'Please specify the rejection reason or required compliance remediation.' };
  }

  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId || b.latestRectificationId === rectificationId);
  if (!batch) return { error: 'Batch record not found.' };

  const req = (db.rectificationRequests || []).find(
    r => r.id === rectificationId || (r.batchId === batch.id && r.status === 'pending_review')
  );

  const now = new Date().toISOString();

  if (req) {
    req.status = 'rejected';
    req.reviewedAt = now;
    req.reviewedBy = session.name;
    req.reviewRemarks = rejectionReason;
  }

  batch.hasPendingRectification = false;

  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: 'host',
    event: 'RECTIFICATION PROOF AUDIT REJECTED',
    details: `Rectified proof rejected by ${session.name}. Inspector remarks: "${rejectionReason}". Batch remains under Regulatory Freeze.`
  });

  if (req?.requesterId) {
    createAlert(
      db,
      req.requesterId,
      `❌ RECTIFICATION REJECTED: Your re-uploaded proof for Batch ${batch.batchNumber} was rejected by Host Inspector: "${rejectionReason}". Batch remains frozen. You may submit corrected documentation.`,
      'danger',
      batch.id
    );
  }

  await writeDb(db);
  revalidateAllPortals();
  return { success: true, message: 'Rectification rejected. Batch remains frozen.' };
}

/**
 * Get all pending rectification appeals for Host inspection
 */
export async function getPendingRectifications() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') return [];

  const db = await readDb();
  const list = (db.rectificationRequests || []).filter(r => r.status === 'pending_review');

  return list.map(r => {
    const batch = db.batches.find(b => b.id === r.batchId);
    return {
      ...r,
      batchDetails: batch ? {
        medicineName: batch.medicineName,
        batchNumber: batch.batchNumber,
        mfgDate: batch.mfgDate,
        expDate: batch.expDate,
        totalQuantity: batch.totalQuantity,
        isFrozen: batch.isFrozen,
        freezeReason: batch.freezeReason,
        frozenAt: batch.frozenAt
      } : null
    };
  });
}

/**
 * Get rectification history for a single batch
 */
export async function getBatchRectifications(batchId: string) {
  const db = await readDb();
  return (db.rectificationRequests || [])
    .filter(r => r.batchId === batchId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}
