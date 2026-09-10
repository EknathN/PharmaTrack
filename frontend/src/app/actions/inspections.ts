"use server";

import { readDb, writeDb, createAlert } from '@/lib/db';
import { getCurrentSession } from './auth';
import { revalidatePath } from 'next/cache';

export interface InspectionProofItem {
  id: string;
  type: 'courier_pod' | 'ocg_sheet' | 'disposal_before' | 'disposal_after' | 'disposal_video' | 'disposal_certificate';
  title: string;
  url: string;
  isVideo?: boolean;
  isCertificate?: boolean;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: 'manufacturer' | 'distributor' | 'retailer' | 'disposer' | 'host';
  uploaderAddress?: string;
  uploaderCity?: string;
  uploaderState?: string;
  uploaderPincode?: string;
  uploaderPhone?: string;
  uploaderLicense?: string;
  entityType: 'shipment' | 'disposal';
  entityId: string;
  shipmentNumber?: string;
  shipmentType?: string;
  batchId?: string;
  batchNumber?: string;
  medicineName?: string;
  quantity?: number;
  recipientName?: string;
  recipientRole?: string;
  ocgCode?: string;
  createdAt: string;
  isDuplicateReuse?: boolean;
  duplicateOccurrences?: number;
  fraudAlertMessage?: string;
  isFrozen?: boolean;
  isFlagged?: boolean;
  verificationStatus: 'verified' | 'suspect' | 'pending';
}

export async function getProofInspections() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') return null;

  const db = await readDb();
  const proofs: InspectionProofItem[] = [];

  // Track image URLs across distinct entities to detect duplicate forgery/reuse
  const urlUsageMap = new Map<string, Set<string>>();

  // 1. Collect from Shipments
  for (const s of db.shipments || []) {
    const batch = db.batches?.find(b => b.id === s.batchId);

    // Sender Courier POD
    if (s.senderProofUrl) {
      const set = urlUsageMap.get(s.senderProofUrl) || new Set();
      set.add(s.id);
      urlUsageMap.set(s.senderProofUrl, set);

      proofs.push({
        id: `${s.id}-sender-pod`,
        type: 'courier_pod',
        title: s.type === 'return' ? 'Return Courier Consignment Note (POD)' : 'Outbound Courier Consignment Proof (POD)',
        url: s.senderProofUrl,
        uploaderId: s.fromId,
        uploaderName: s.fromName,
        uploaderRole: s.fromRole,
        entityType: 'shipment',
        entityId: s.id,
        shipmentNumber: s.shipmentNumber,
        shipmentType: s.type,
        batchId: s.batchId,
        batchNumber: batch?.batchNumber,
        medicineName: batch?.medicineName,
        quantity: s.quantity,
        recipientName: s.toName,
        recipientRole: s.toRole,
        ocgCode: s.ocgVerificationCode,
        createdAt: s.createdAt,
        isFrozen: batch?.isFrozen,
        isFlagged: batch?.isFlagged,
        verificationStatus: batch?.isFrozen ? 'suspect' : 'pending'
      });
    }

    // Sender Physical OCG Security Sheet
    if (s.senderOcgProofUrl) {
      const set = urlUsageMap.get(s.senderOcgProofUrl) || new Set();
      set.add(s.id);
      urlUsageMap.set(s.senderOcgProofUrl, set);

      proofs.push({
        id: `${s.id}-sender-ocg`,
        type: 'ocg_sheet',
        title: 'Physical OCG Security Sheet Photo (Gatepass)',
        url: s.senderOcgProofUrl,
        uploaderId: s.fromId,
        uploaderName: s.fromName,
        uploaderRole: s.fromRole,
        entityType: 'shipment',
        entityId: s.id,
        shipmentNumber: s.shipmentNumber,
        shipmentType: s.type,
        batchId: s.batchId,
        batchNumber: batch?.batchNumber,
        medicineName: batch?.medicineName,
        quantity: s.quantity,
        recipientName: s.toName,
        recipientRole: s.toRole,
        ocgCode: s.ocgVerificationCode,
        createdAt: s.createdAt,
        isFrozen: batch?.isFrozen,
        isFlagged: batch?.isFlagged,
        verificationStatus: batch?.isFrozen ? 'suspect' : 'pending'
      });
    }

    // Receiver Courier POD
    if (s.receiverProofUrl) {
      const set = urlUsageMap.get(s.receiverProofUrl) || new Set();
      set.add(s.id);
      urlUsageMap.set(s.receiverProofUrl, set);

      proofs.push({
        id: `${s.id}-receiver-pod`,
        type: 'courier_pod',
        title: 'Intake Delivery Acknowledgment (POD)',
        url: s.receiverProofUrl,
        uploaderId: s.toId,
        uploaderName: s.toName,
        uploaderRole: s.toRole,
        entityType: 'shipment',
        entityId: s.id,
        shipmentNumber: s.shipmentNumber,
        shipmentType: s.type,
        batchId: s.batchId,
        batchNumber: batch?.batchNumber,
        medicineName: batch?.medicineName,
        quantity: s.quantity,
        recipientName: s.fromName,
        recipientRole: s.fromRole,
        ocgCode: s.ocgVerificationCode,
        createdAt: s.updatedAt || s.createdAt,
        isFrozen: batch?.isFrozen,
        isFlagged: batch?.isFlagged,
        verificationStatus: batch?.isFrozen ? 'suspect' : 'pending'
      });
    }

    // Receiver Physical OCG Security Sheet Verification
    if (s.receiverOcgProofUrl) {
      const set = urlUsageMap.get(s.receiverOcgProofUrl) || new Set();
      set.add(s.id);
      urlUsageMap.set(s.receiverOcgProofUrl, set);

      proofs.push({
        id: `${s.id}-receiver-ocg`,
        type: 'ocg_sheet',
        title: 'Receiver Verified Physical OCG Sheet',
        url: s.receiverOcgProofUrl,
        uploaderId: s.toId,
        uploaderName: s.toName,
        uploaderRole: s.toRole,
        entityType: 'shipment',
        entityId: s.id,
        shipmentNumber: s.shipmentNumber,
        shipmentType: s.type,
        batchId: s.batchId,
        batchNumber: batch?.batchNumber,
        medicineName: batch?.medicineName,
        quantity: s.quantity,
        recipientName: s.fromName,
        recipientRole: s.fromRole,
        ocgCode: s.ocgVerificationCode,
        createdAt: s.updatedAt || s.createdAt,
        isFrozen: batch?.isFrozen,
        isFlagged: batch?.isFlagged,
        verificationStatus: batch?.isFrozen ? 'suspect' : 'pending'
      });
    }
  }

  // 2. Collect from Disposal Records
  for (const d of db.disposalRecords || []) {
    const batch = db.batches?.find(b => b.id === d.batchId);
    const shipment = db.shipments?.find(s => s.id === d.shipmentId);

    // Pre-Disposal Photo
    if (d.photoBeforeUrl) {
      const set = urlUsageMap.get(d.photoBeforeUrl) || new Set();
      set.add(d.id);
      urlUsageMap.set(d.photoBeforeUrl, set);

      proofs.push({
        id: `${d.id}-photo-before`,
        type: 'disposal_before',
        title: 'Photo BEFORE Bio-Medical Destruction',
        url: d.photoBeforeUrl,
        uploaderId: d.disposerId,
        uploaderName: d.disposerName,
        uploaderRole: 'disposer',
        entityType: 'disposal',
        entityId: d.id,
        batchId: d.batchId,
        batchNumber: batch?.batchNumber,
        medicineName: batch?.medicineName,
        quantity: d.quantity || shipment?.quantity || 0,
        createdAt: d.createdAt,
        isFrozen: batch?.isFrozen,
        isFlagged: batch?.isFlagged,
        verificationStatus: batch?.isFrozen ? 'suspect' : 'pending'
      });
    }

    // Post-Disposal Photo
    if (d.photoAfterUrl) {
      const set = urlUsageMap.get(d.photoAfterUrl) || new Set();
      set.add(d.id);
      urlUsageMap.set(d.photoAfterUrl, set);

      proofs.push({
        id: `${d.id}-photo-after`,
        type: 'disposal_after',
        title: 'Photo AFTER Incineration / Bio-Neutralization',
        url: d.photoAfterUrl,
        uploaderId: d.disposerId,
        uploaderName: d.disposerName,
        uploaderRole: 'disposer',
        entityType: 'disposal',
        entityId: d.id,
        batchId: d.batchId,
        batchNumber: batch?.batchNumber,
        medicineName: batch?.medicineName,
        quantity: d.quantity || shipment?.quantity || 0,
        createdAt: d.completedAt || d.createdAt,
        isFrozen: batch?.isFrozen,
        isFlagged: batch?.isFlagged,
        verificationStatus: batch?.isFrozen ? 'suspect' : 'pending'
      });
    }

    // Disposal Process Video
    if (d.videoUrl) {
      proofs.push({
        id: `${d.id}-video`,
        type: 'disposal_video',
        title: '30-Second Bio-Destruction Process Video Audit',
        url: d.videoUrl,
        isVideo: true,
        uploaderId: d.disposerId,
        uploaderName: d.disposerName,
        uploaderRole: 'disposer',
        entityType: 'disposal',
        entityId: d.id,
        batchId: d.batchId,
        batchNumber: batch?.batchNumber,
        medicineName: batch?.medicineName,
        quantity: d.quantity || shipment?.quantity || 0,
        createdAt: d.completedAt || d.createdAt,
        isFrozen: batch?.isFrozen,
        isFlagged: batch?.isFlagged,
        verificationStatus: batch?.isFrozen ? 'suspect' : 'pending'
      });
    }

    // Official Certificate
    if (d.certificateUrl) {
      proofs.push({
        id: `${d.id}-certificate`,
        type: 'disposal_certificate',
        title: 'Official Destruction & Bio-Hazard Disposal Certificate',
        url: d.certificateUrl,
        isCertificate: true,
        uploaderId: d.disposerId,
        uploaderName: d.disposerName,
        uploaderRole: 'disposer',
        entityType: 'disposal',
        entityId: d.id,
        batchId: d.batchId,
        batchNumber: batch?.batchNumber,
        medicineName: batch?.medicineName,
        quantity: d.quantity || shipment?.quantity || 0,
        createdAt: d.completedAt || d.createdAt,
        isFrozen: batch?.isFrozen,
        isFlagged: batch?.isFlagged,
        verificationStatus: batch?.isFrozen ? 'suspect' : 'pending'
      });
    }
  }

  // Anti-Fraud Analytics: Detect image reuse across shipments or batches
  let duplicateSuspectCount = 0;
  for (const p of proofs) {
    if (p.url && !p.isVideo && !p.isCertificate) {
      const occurrences = urlUsageMap.get(p.url)?.size || 1;
      if (occurrences > 1) {
        p.isDuplicateReuse = true;
        p.duplicateOccurrences = occurrences;
        p.fraudAlertMessage = `🚨 SUSPICIOUS REUSE: This identical proof image has been submitted across ${occurrences} different consignments! High risk of image tampering or simulated paperwork.`;
        p.verificationStatus = 'suspect';
        duplicateSuspectCount++;
      }
    }
  }

  // Enrich all proofs with registered uploader facility address & contact info
  const userMap = new Map((db.users || []).map((u: any) => [u.id, u]));
  for (const p of proofs) {
    const u: any = userMap.get(p.uploaderId);
    if (u) {
      p.uploaderAddress = u.address || '';
      p.uploaderCity = u.city || '';
      p.uploaderState = u.state || '';
      p.uploaderPincode = u.pincode || '';
      p.uploaderPhone = u.phone || '';
      p.uploaderLicense = u.licenseNumber || '';
    }
  }

  // Sort by newest first
  proofs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const uniqueUploaders = new Set(proofs.map(p => p.uploaderId)).size;
  const roleBreakdown = {
    manufacturer: proofs.filter(p => p.uploaderRole === 'manufacturer').length,
    distributor: proofs.filter(p => p.uploaderRole === 'distributor').length,
    retailer: proofs.filter(p => p.uploaderRole === 'retailer').length,
    disposer: proofs.filter(p => p.uploaderRole === 'disposer').length,
  };

  return {
    proofs,
    stats: {
      totalProofs: proofs.length,
      uniqueUploaders,
      duplicateSuspectCount,
      roleBreakdown
    }
  };
}

export async function markProofVerified(proofId: string) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') return { error: 'Unauthorized' };

  // Proof is visually inspected and validated by regulatory host
  revalidatePath('/host/proofs');
  return { success: true, message: 'Proof verified as genuine.' };
}

export async function flagProofFraud(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') return { error: 'Unauthorized' };

  const batchId = data.get('batchId') as string;
  const reason = (data.get('reason') as string) || 'Suspected fraudulent/forged courier proof or OCG sheet tampering detected by Regulatory Host.';

  if (!batchId) return { error: 'Associated batch ID not found.' };

  const db = await readDb();
  const batch = db.batches.find(b => b.id === batchId);
  if (!batch) return { error: 'Batch not found.' };

  const now = new Date().toISOString();
  batch.isFrozen = true;
  batch.freezeReason = `FRAUD INVESTIGATION: ${reason}`;
  batch.frozenAt = now;
  batch.frozenBy = session.name;

  batch.history.push({
    timestamp: now,
    actorId: session.sub,
    actorName: session.name,
    actorRole: 'host',
    event: 'REGULATORY FREEZE (PROOF FRAUD INVESTIGATION)',
    details: reason
  });

  // Notify manufacturer and inventory holders
  if (batch.manufacturerId) {
    createAlert(
      db,
      batch.manufacturerId,
      `🚨 EMERGENCY FREEZE: Batch ${batch.batchNumber} has been FROZEN due to suspected proof tampering/fraud: ${reason}`,
      'danger',
      batch.id
    );
  }

  const currentHolders = db.inventory.filter(i => i.batchId === batch.id && i.quantity > 0);
  for (const holder of currentHolders) {
    createAlert(
      db,
      holder.ownerId,
      `REGULATORY HOLD: Batch ${batch.batchNumber} in your possession is FROZEN due to proof fraud audit. Movements blocked.`,
      'danger',
      batch.id
    );
  }

  await writeDb(db);
  revalidatePath('/host');
  revalidatePath('/host/proofs');
  revalidatePath('/host/security');
  return { success: true, batchNumber: batch.batchNumber };
}
