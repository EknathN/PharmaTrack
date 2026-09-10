"use server";

import { readDb, writeDb, RestockOrder, createAlert, Role } from '@/lib/db';
import { getCurrentSession } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';

export interface SmartStockAlertItem {
  id: string;
  medicineName: string;
  currentStock: number;
  dailySalesVelocity: number;
  unitsSoldInWindow: number;
  windowDays: number;
  estimatedDaysLeft: number;
  alertType: 'fast_moving_low_stock' | 'frequent_stock_out';
  alertMessage: string;
  suggestedReorderQty: number;
  preferredSupplierId: string;
  preferredSupplierName: string;
  isRestockPending: boolean;
  lastSoldAt?: string;
}

export async function getSmartRestockRecommendations(daysWindow: number = 14): Promise<SmartStockAlertItem[]> {
  const session = await getCurrentSession();
  if (!session) return [];

  const db = await readDb();
  const now = new Date('2026-09-10T23:59:59.999Z'); // Reference simulated system time
  const windowMs = daysWindow * 24 * 60 * 60 * 1000;
  const cutoffTime = new Date(now.getTime() - windowMs);

  const recommendations: SmartStockAlertItem[] = [];

  // 1. RETAILER LOGIC (POS Customer Sales)
  if (session.role === 'retailer') {
    // Collect all medicines relevant to this retailer (from inventory or sales)
    const retailerInventory = db.inventory.filter(i => i.ownerId === session.sub);
    const retailerSales = db.sales.filter(s => s.retailerId === session.sub);

    // Map of medicineName -> { currentStock, unitsSold, lastSoldAt, preferredSupplierId, preferredSupplierName }
    const medMap = new Map<string, {
      currentStock: number;
      unitsSold: number;
      lastSoldAt?: string;
      preferredSupplierId: string;
      preferredSupplierName: string;
    }>();

    // Default distributor supplier
    const defaultDistributor = db.users.find(u => u.role === 'distributor') || {
      id: 'seed-distributor-01',
      name: 'Global Pharma Logistics'
    };

    // Calculate current stock from inventory
    for (const item of retailerInventory) {
      const batch = db.batches.find(b => b.id === item.batchId);
      const medName = batch?.medicineName || 'Unknown Medicine';
      const existing = medMap.get(medName) || {
        currentStock: 0,
        unitsSold: 0,
        preferredSupplierId: defaultDistributor.id,
        preferredSupplierName: defaultDistributor.name
      };
      existing.currentStock += item.quantity;
      medMap.set(medName, existing);
    }

    // Calculate sales velocity from sales
    for (const sale of retailerSales) {
      const medName = sale.medicineName;
      const existing = medMap.get(medName) || {
        currentStock: 0,
        unitsSold: 0,
        preferredSupplierId: defaultDistributor.id,
        preferredSupplierName: defaultDistributor.name
      };

      const soldDate = new Date(sale.soldAt);
      if (soldDate >= cutoffTime) {
        existing.unitsSold += sale.quantity;
      }
      if (!existing.lastSoldAt || new Date(sale.soldAt) > new Date(existing.lastSoldAt)) {
        existing.lastSoldAt = sale.soldAt;
      }
      medMap.set(medName, existing);
    }

    // Check alert conditions for each medicine
    medMap.forEach((data, medName) => {
      const velocity = Number((data.unitsSold / daysWindow).toFixed(2));
      const daysLeft = velocity > 0 ? Number((data.currentStock / velocity).toFixed(1)) : 999;

      // Check if there is already an active pending restock order
      const isRestockPending = (db.restockOrders || []).some(
        o => o.buyerId === session.sub && 
             o.medicineName.toLowerCase() === medName.toLowerCase() && 
             o.status === 'pending'
      );

      // Trigger 1: Fast-Moving Low Stock (< 10 days left and positive stock)
      if (velocity > 0 && data.currentStock > 0 && daysLeft < 10) {
        const suggestedQty = Math.max(50, Math.ceil(velocity * 10));
        recommendations.push({
          id: `alert-retailer-${medName.replace(/\s+/g, '-').toLowerCase()}`,
          medicineName: medName,
          currentStock: data.currentStock,
          dailySalesVelocity: velocity,
          unitsSoldInWindow: data.unitsSold,
          windowDays: daysWindow,
          estimatedDaysLeft: daysLeft,
          alertType: 'fast_moving_low_stock',
          alertMessage: `🔥 ${medName} is selling fast! Only ${daysLeft} days of stock left (${data.currentStock} units remaining). Recommend ordering ${suggestedQty} more units.`,
          suggestedReorderQty: suggestedQty,
          preferredSupplierId: data.preferredSupplierId,
          preferredSupplierName: data.preferredSupplierName,
          isRestockPending,
          lastSoldAt: data.lastSoldAt
        });
      }
      // Trigger 2: Frequent Stock-Out (0 stock with positive sales history)
      else if (velocity > 0 && data.currentStock === 0) {
        const suggestedQty = Math.max(50, Math.ceil(velocity * 14));
        recommendations.push({
          id: `alert-retailer-stockout-${medName.replace(/\s+/g, '-').toLowerCase()}`,
          medicineName: medName,
          currentStock: 0,
          dailySalesVelocity: velocity,
          unitsSoldInWindow: data.unitsSold,
          windowDays: daysWindow,
          estimatedDaysLeft: 0,
          alertType: 'frequent_stock_out',
          alertMessage: `🚨 Urgent Stock-Out: ${medName} has reached 0 units in stock! High consumer demand detected (${velocity} units/day). Recommend immediate restocking of ${suggestedQty} units.`,
          suggestedReorderQty: suggestedQty,
          preferredSupplierId: data.preferredSupplierId,
          preferredSupplierName: data.preferredSupplierName,
          isRestockPending,
          lastSoldAt: data.lastSoldAt
        });
      }
    });
  }

  // 2. DISTRIBUTOR LOGIC (Shipments dispatched to Retailers)
  if (session.role === 'distributor') {
    const distributorInventory = db.inventory.filter(i => i.ownerId === session.sub);
    const outboundShipments = db.shipments.filter(
      s => s.fromId === session.sub && 
           s.type === 'forward' && 
           (s.status === 'received' || s.status === 'in_transit')
    );

    const defaultManufacturer = db.users.find(u => u.role === 'manufacturer') || {
      id: 'seed-manufacturer-01',
      name: 'Apex Pharmaceuticals Ltd'
    };

    const medMap = new Map<string, {
      currentStock: number;
      unitsDispatched: number;
      preferredSupplierId: string;
      preferredSupplierName: string;
    }>();

    // Sum distributor inventory
    for (const item of distributorInventory) {
      const batch = db.batches.find(b => b.id === item.batchId);
      const medName = batch?.medicineName || 'Unknown Medicine';
      const existing = medMap.get(medName) || {
        currentStock: 0,
        unitsDispatched: 0,
        preferredSupplierId: batch?.manufacturerId || defaultManufacturer.id,
        preferredSupplierName: batch?.manufacturerName || defaultManufacturer.name
      };
      existing.currentStock += item.quantity;
      medMap.set(medName, existing);
    }

    // Sum outbound shipments dispatched in window
    for (const shp of outboundShipments) {
      const batch = db.batches.find(b => b.id === shp.batchId);
      const medName = batch?.medicineName || 'Unknown Medicine';
      const existing = medMap.get(medName) || {
        currentStock: 0,
        unitsDispatched: 0,
        preferredSupplierId: batch?.manufacturerId || defaultManufacturer.id,
        preferredSupplierName: batch?.manufacturerName || defaultManufacturer.name
      };

      const shpDate = new Date(shp.createdAt);
      if (shpDate >= cutoffTime) {
        existing.unitsDispatched += shp.quantity;
      }
      medMap.set(medName, existing);
    }

    // Evaluate triggers
    medMap.forEach((data, medName) => {
      const velocity = Number((data.unitsDispatched / daysWindow).toFixed(2));
      const daysLeft = velocity > 0 ? Number((data.currentStock / velocity).toFixed(1)) : 999;

      const isRestockPending = (db.restockOrders || []).some(
        o => o.buyerId === session.sub && 
             o.medicineName.toLowerCase() === medName.toLowerCase() && 
             o.status === 'pending'
      );

      if (velocity > 0 && data.currentStock > 0 && daysLeft < 10) {
        const suggestedQty = Math.max(100, Math.ceil(velocity * 14));
        recommendations.push({
          id: `alert-distributor-${medName.replace(/\s+/g, '-').toLowerCase()}`,
          medicineName: medName,
          currentStock: data.currentStock,
          dailySalesVelocity: velocity,
          unitsSoldInWindow: data.unitsDispatched,
          windowDays: daysWindow,
          estimatedDaysLeft: daysLeft,
          alertType: 'fast_moving_low_stock',
          alertMessage: `🔥 ${medName} is moving fast to retailers! Only ${daysLeft} days of warehouse stock left (${data.currentStock} units). Recommend ordering ${suggestedQty} more units from Manufacturer.`,
          suggestedReorderQty: suggestedQty,
          preferredSupplierId: data.preferredSupplierId,
          preferredSupplierName: data.preferredSupplierName,
          isRestockPending
        });
      } else if (velocity > 0 && data.currentStock === 0) {
        const suggestedQty = Math.max(200, Math.ceil(velocity * 20));
        recommendations.push({
          id: `alert-distributor-stockout-${medName.replace(/\s+/g, '-').toLowerCase()}`,
          medicineName: medName,
          currentStock: 0,
          dailySalesVelocity: velocity,
          unitsSoldInWindow: data.unitsDispatched,
          windowDays: daysWindow,
          estimatedDaysLeft: 0,
          alertType: 'frequent_stock_out',
          alertMessage: `🚨 Warehouse Stock-Out: ${medName} is completely out of stock! Retail demand is active (${velocity} units/day). Recommend immediate procurement of ${suggestedQty} units from Manufacturer.`,
          suggestedReorderQty: suggestedQty,
          preferredSupplierId: data.preferredSupplierId,
          preferredSupplierName: data.preferredSupplierName,
          isRestockPending
        });
      }
    });
  }

  return recommendations;
}

export async function getSuppliersForRole(targetRole: 'distributor' | 'manufacturer') {
  const db = await readDb();
  return db.users
    .filter(u => u.role === targetRole)
    .map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role }));
}

export async function createRestockOrder(data: {
  medicineName: string;
  quantity: number;
  supplierId: string;
  priority?: 'standard' | 'urgent';
  notes?: string;
}) {
  const session = await getCurrentSession();
  if (!session) {
    return { error: 'Unauthorized. Please log in.' };
  }

  const { medicineName, quantity, supplierId, priority = 'standard', notes = '' } = data;
  if (!medicineName || !quantity || quantity <= 0 || !supplierId) {
    return { error: 'Medicine name, valid quantity, and supplier are required.' };
  }

  const db = await readDb();
  const supplier = db.users.find(u => u.id === supplierId);
  if (!supplier) {
    return { error: 'Selected supplier was not found.' };
  }

  const orderNumber = `RO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const newOrder: RestockOrder = {
    id: crypto.randomUUID(),
    orderNumber,
    buyerId: session.sub,
    buyerRole: session.role,
    buyerName: session.name,
    supplierId: supplier.id,
    supplierRole: supplier.role,
    supplierName: supplier.name,
    medicineName,
    quantity,
    priority,
    notes,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!Array.isArray(db.restockOrders)) {
    db.restockOrders = [];
  }
  db.restockOrders.unshift(newOrder);

  // Send system alert to Supplier
  createAlert(
    db,
    supplier.id,
    `📦 New Purchase Order ${orderNumber}: ${quantity} units of ${medicineName} requested by ${session.name} (${session.role}).`,
    'info'
  );

  // Send confirmation alert to Buyer
  createAlert(
    db,
    session.sub,
    `✅ Purchase Order ${orderNumber} placed for ${quantity} units of ${medicineName} to ${supplier.name}. Status: restock_pending.`,
    'success'
  );

  await writeDb(db);

  revalidatePath('/retailer');
  revalidatePath('/distributor');
  revalidatePath('/retailer/order');
  revalidatePath('/distributor/order');

  return { success: true, order: newOrder };
}

export async function getRestockOrdersForUser() {
  const session = await getCurrentSession();
  if (!session) return [];

  const db = await readDb();
  const orders = (db.restockOrders || []).filter(
    o => o.buyerId === session.sub || o.supplierId === session.sub
  );
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getPendingOrdersForSupplier() {
  const session = await getCurrentSession();
  if (!session) return [];

  const db = await readDb();
  const orders = (db.restockOrders || []).filter(
    o => o.supplierId === session.sub && o.status === 'pending'
  );
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function fulfillOrderWithShipment(orderId: string, shipmentNumber: string) {
  const session = await getCurrentSession();
  if (!session) return { error: 'Unauthorized' };

  const db = await readDb();
  const order = (db.restockOrders || []).find(o => o.id === orderId && o.supplierId === session.sub);
  if (!order) return { error: 'Order not found.' };

  order.status = 'shipped';
  order.updatedAt = new Date().toISOString();
  order.notes = `${order.notes ? order.notes + ' · ' : ''}Fulfilled via Shipment #${shipmentNumber}`;

  createAlert(
    db,
    order.buyerId,
    `📦 Purchase Order ${order.orderNumber} for ${order.quantity} units of ${order.medicineName} has been DISPATCHED by ${session.name} via Shipment #${shipmentNumber}.`,
    'info'
  );

  await writeDb(db);
  revalidatePath('/retailer');
  revalidatePath('/distributor');
  revalidatePath('/manufacturer');
  return { success: true };
}

