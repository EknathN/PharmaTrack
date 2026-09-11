"use server";

import { readDb, writeDb, createAlert, RetailerPriceSetting, InvoiceItem, Sale, UnitRecord } from '@/lib/db';
import { getCurrentSession } from './auth';
import { getOrGenerateBatchUnits } from '@/lib/barcodeHelper';
import { revalidatePath } from 'next/cache';

/**
 * Returns the private pricing catalog set by the currently logged-in retailer.
 * Strictly scoped to the retailer's user ID — completely hidden from all other users and host.
 */
export async function getRetailerPrices(): Promise<Record<string, RetailerPriceSetting>> {
  const session = await getCurrentSession();
  if (!session || session.role !== 'retailer') return {};

  const db = await readDb();
  if (!db.retailerPrices) db.retailerPrices = {};

  return db.retailerPrices[session.sub] || {};
}

/**
 * Saves private pricing configuration for a medicine under the retailer's private store.
 * Kept confidential from Host, Manufacturers, Distributors, and public APIs.
 */
export async function saveRetailerPrice(
  medicineName: string,
  unitPrice: number,
  mrp?: number,
  taxRatePercent?: number
) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'retailer') {
    return { error: 'Unauthorized: Only retail pharmacists can manage retail pricing.' };
  }

  const cleanName = (medicineName || '').trim();
  if (!cleanName) return { error: 'Medicine name is required.' };
  if (isNaN(unitPrice) || unitPrice < 0) return { error: 'Valid selling price is required.' };

  const db = await readDb();
  if (!db.retailerPrices) db.retailerPrices = {};
  if (!db.retailerPrices[session.sub]) db.retailerPrices[session.sub] = {};

  const now = new Date().toISOString();
  db.retailerPrices[session.sub][cleanName] = {
    medicineName: cleanName,
    unitPrice: Number(unitPrice),
    mrp: mrp !== undefined && !isNaN(mrp) ? Number(mrp) : undefined,
    taxRatePercent: taxRatePercent !== undefined && !isNaN(taxRatePercent) ? Number(taxRatePercent) : 5,
    updatedAt: now
  };

  await writeDb(db);
  revalidatePath('/retailer');
  revalidatePath('/retailer/sell');
  return { success: true, message: `Private price for ${cleanName} updated to ₹${unitPrice.toFixed(2)}.` };
}

/**
 * Retrieves retailer inventory joined with their private pricing and available unit barcodes.
 */
export async function getRetailerPosInventory() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'retailer') return [];

  const db = await readDb();
  const privatePrices = (db.retailerPrices && db.retailerPrices[session.sub]) || {};
  const retailerInventory = db.inventory.filter(i => i.ownerId === session.sub && i.quantity > 0);

  return retailerInventory.map(inv => {
    const batch = db.batches.find(b => b.id === inv.batchId);
    if (!batch) return null;

    // Ensure unit records exist for this batch
    const allUnits = getOrGenerateBatchUnits(db, batch);
    const availableUnits = allUnits.filter(u => u.status === 'in_stock').slice(0, inv.quantity);

    const priceConfig = privatePrices[batch.medicineName] || {
      medicineName: batch.medicineName,
      unitPrice: 50.0, // sensible default if retailer hasn't set custom price yet
      mrp: 65.0,
      taxRatePercent: 5,
      updatedAt: new Date().toISOString()
    };

    return {
      inventoryId: inv.id,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      medicineName: batch.medicineName,
      medicineType: batch.medicineType,
      unitDetails: batch.unitDetails,
      packagingType: batch.packagingType || 'Medicine Strip',
      availableQuantity: inv.quantity,
      mfgDate: batch.mfgDate,
      expDate: batch.expDate,
      isFrozen: Boolean(batch.isFrozen),
      freezeReason: batch.freezeReason,
      priceConfig,
      sampleUnitBarcodes: availableUnits.map(u => u.unitBarcode)
    };
  }).filter(Boolean);
}

/**
 * Processes a POS sale:
 * - Scans/validates individual unit barcodes (bottle/strip/cream tube).
 * - Verifies batch is not on regulatory freeze.
 * - Computes automated totals (Subtotal, GST Tax, Discounts, Grand Total).
 * - Decrements retailer inventory and marks units as 'sold'.
 * - Records full customer invoice with retailer pharmacy shop branding.
 */
export async function generateCustomerInvoice(data: FormData) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'retailer') {
    return { error: 'Unauthorized: Retailer authentication required.' };
  }

  const customerName = (data.get('customerName') as string)?.trim() || 'Walk-in Customer';
  const customerPhone = (data.get('customerPhone') as string)?.trim() || '';
  const doctorName = (data.get('doctorName') as string)?.trim() || '';
  const paymentMode = ((data.get('paymentMode') as string) || 'cash') as 'cash' | 'upi' | 'card' | 'credit';
  const discountAmount = parseFloat((data.get('discountAmount') as string) || '0') || 0;
  const cartJson = data.get('cartJson') as string;

  if (!cartJson) {
    return { error: 'No items in cart for billing.' };
  }

  let rawItems: any[] = [];
  try {
    rawItems = JSON.parse(cartJson);
  } catch (e) {
    return { error: 'Invalid cart data format.' };
  }

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: 'Cart is empty. Please scan or add at least one medicine unit.' };
  }

  const db = await readDb();
  const retailerUser = db.users.find(u => u.id === session.sub);
  const now = new Date().toISOString();
  const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

  const invoiceItems: InvoiceItem[] = [];
  let subtotal = 0;
  let totalTaxAmount = 0;
  const allScannedBarcodes: string[] = [];

  for (const item of rawItems) {
    const batch = db.batches.find(b => b.id === item.batchId || b.batchNumber === item.batchNumber);
    if (!batch) {
      return { error: `Batch ${item.batchNumber || item.batchId} not found in national registry.` };
    }

    if (batch.isFrozen) {
      return {
        error: `🚨 REGULATORY SAFETY HOLD: Batch ${batch.batchNumber} (${batch.medicineName}) is FROZEN by Regulatory Authority (${batch.freezeReason || 'Safety Directive'}). Dispensing prohibited.`
      };
    }

    const inv = db.inventory.find(i => i.batchId === batch.id && i.ownerId === session.sub);
    const qty = parseInt(item.quantity, 10);
    if (!inv || inv.quantity < qty) {
      return {
        error: `Insufficient stock for ${batch.medicineName}. Available: ${inv?.quantity || 0}, requested: ${qty}.`
      };
    }

    // Decrement inventory
    inv.quantity -= qty;

    // Resolve or generate unit records
    const units = getOrGenerateBatchUnits(db, batch);
    const availableUnits = units.filter(u => u.status === 'in_stock');
    
    // Scanned or auto-assigned unit barcodes
    let assignedBarcodes: string[] = [];
    if (Array.isArray(item.scannedUnitBarcodes) && item.scannedUnitBarcodes.length > 0) {
      assignedBarcodes = item.scannedUnitBarcodes.slice(0, qty);
    } else {
      assignedBarcodes = availableUnits.slice(0, qty).map(u => u.unitBarcode);
    }

    // Mark unit records as sold
    for (const barcode of assignedBarcodes) {
      const uRecord = db.unitRecords?.find(u => u.unitBarcode === barcode);
      if (uRecord) {
        uRecord.status = 'sold';
        uRecord.soldAt = now;
        uRecord.soldBy = session.name;
        uRecord.soldToCustomer = customerName;
        uRecord.invoiceNumber = invoiceNumber;
      }
      allScannedBarcodes.push(barcode);
    }

    const unitPrice = parseFloat(item.unitPrice) || 0;
    const taxRate = parseFloat(item.taxRatePercent) || 5;
    const lineSubtotal = unitPrice * qty;
    const lineTax = (lineSubtotal * taxRate) / 100;
    const lineTotal = lineSubtotal + lineTax;

    subtotal += lineSubtotal;
    totalTaxAmount += lineTax;

    invoiceItems.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      medicineName: batch.medicineName,
      packagingType: batch.packagingType || 'Medicine Strip',
      scannedUnitBarcodes: assignedBarcodes,
      quantity: qty,
      unitPrice,
      mrp: item.mrp ? parseFloat(item.mrp) : undefined,
      taxRatePercent: taxRate,
      taxAmount: lineTax,
      lineTotal
    });

    // Record milestone in batch lifecycle
    batch.history.push({
      timestamp: now,
      actorId: session.sub,
      actorName: session.name,
      actorRole: 'retailer',
      event: 'DISPENSED TO CUSTOMER (RETAIL BILLING)',
      details: `${qty} units (${batch.packagingType || 'units'}) sold to ${customerName} by ${retailerUser?.name || session.name}. Invoice #${invoiceNumber}. Barcodes: ${assignedBarcodes.join(', ')}.`
    });

    // Low stock alert check
    if (inv.quantity < 20) {
      createAlert(
        db,
        session.sub,
        `⚠️ LOW STOCK: Only ${inv.quantity} units of ${batch.medicineName} left in stock. Consider placing a restock order.`,
        'warning',
        batch.id
      );
    }
  }

  const grandTotal = Math.max(0, subtotal + totalTaxAmount - discountAmount);

  // Store complete Sale / CustomerInvoice
  const invoiceRecord: Sale = {
    id: crypto.randomUUID(),
    invoiceNumber,
    retailerId: session.sub,
    retailerName: session.name,
    retailerShopName: retailerUser?.name || 'Pharmacy Care Center',
    retailerAddress: retailerUser?.address,
    retailerCity: retailerUser?.city,
    retailerState: retailerUser?.state,
    retailerPincode: retailerUser?.pincode,
    retailerPhone: retailerUser?.phone,
    retailerLicense: retailerUser?.licenseNumber,
    customerName,
    customerPhone,
    doctorName,
    paymentMode,
    batchId: invoiceItems[0]?.batchId || '',
    batchNumber: invoiceItems[0]?.batchNumber || '',
    medicineName: invoiceItems.map(i => i.medicineName).join(', '),
    quantity: invoiceItems.reduce((sum, i) => sum + i.quantity, 0),
    unitPrice: invoiceItems[0]?.unitPrice || 0,
    subtotal,
    taxAmount: totalTaxAmount,
    discountAmount,
    totalAmount: grandTotal,
    items: invoiceItems,
    scannedUnitBarcodes: allScannedBarcodes,
    soldAt: now
  };

  db.sales.unshift(invoiceRecord);
  await writeDb(db);

  revalidatePath('/retailer');
  revalidatePath('/retailer/sell');
  revalidatePath('/retailer/inventory');

  return {
    success: true,
    invoiceNumber,
    invoice: invoiceRecord,
    message: `Invoice #${invoiceNumber} successfully created and stock updated.`
  };
}

/**
 * Returns all past customer invoices generated by the logged-in retailer.
 */
export async function getRetailerInvoices(): Promise<Sale[]> {
  const session = await getCurrentSession();
  if (!session || session.role !== 'retailer') return [];

  const db = await readDb();
  return (db.sales || []).filter(s => s.retailerId === session.sub);
}

/**
 * Returns a specific customer invoice by ID or Invoice Number.
 */
export async function getInvoiceById(invoiceIdOrNumber: string): Promise<Sale | null> {
  const db = await readDb();
  const found = (db.sales || []).find(
    s => s.id === invoiceIdOrNumber || s.invoiceNumber === invoiceIdOrNumber
  );
  return found || null;
}
