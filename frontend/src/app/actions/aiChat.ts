"use server";

import { readDb, Role } from "@/lib/db";
import { getCurrentSession } from "@/app/actions/auth";

export interface AiDashboardContext {
  role: Role;
  userName: string;
  userId: string;
  timestamp: string;
  summary: string;
  metrics: Record<string, any>;
  inventoryOrBatches: any[];
  shipments: any[];
  salesOrMovement: any[];
  stockoutPredictions: Array<{
    medicineName: string;
    batchNumber: string;
    currentQuantity: number;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE';
    daysUntilStockout: string;
    recommendation: string;
  }>;
  reorderRecommendations: Array<{
    medicineName: string;
    batchNumber?: string;
    currentQuantity: number;
    suggestedOrderQuantity: number;
    urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
    reason: string;
    supplierRole: string;
  }>;
  nearExpiryRisks: Array<{
    medicineName: string;
    batchNumber: string;
    quantity: number;
    daysToExpiry: number;
    expiryDate: string;
    suggestedAction: string;
  }>;
  alerts: string[];
}

export async function getAiDashboardContext(): Promise<AiDashboardContext | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  const db = await readDb();
  const now = Date.now();
  const role = session.role;
  const userId = session.sub;

  const alerts = (db.alerts || [])
    .filter(a => a.userId === userId && !a.isRead)
    .map(a => a.message);

  if (role === 'retailer') {
    // Retailer context
    const inventory = (db.inventory || []).filter(i => i.ownerId === userId);
    const retailerSales = (db.sales || []).filter(s => s.retailerId === userId);
    const shipments = (db.shipments || []).filter(s => s.toId === userId || s.fromId === userId);

    const inventoryDetailed = inventory.map(inv => {
      const batch = db.batches.find(b => b.id === inv.batchId);
      const daysToExpiry = batch
        ? Math.floor((new Date(batch.expDate).getTime() - now) / (1000 * 60 * 60 * 24))
        : 999;
      return {
        id: inv.id,
        batchId: inv.batchId,
        medicineName: batch?.medicineName || 'Medicine',
        batchNumber: batch?.batchNumber || 'N/A',
        quantity: inv.quantity,
        mfgDate: batch?.mfgDate,
        expDate: batch?.expDate,
        daysToExpiry,
        status: inv.status,
        isFrozen: batch?.isFrozen || false,
        freezeReason: batch?.freezeReason
      };
    });

    // Sales velocity per medicine
    const salesByMedicine: Record<string, number> = {};
    retailerSales.forEach(s => {
      salesByMedicine[s.medicineName] = (salesByMedicine[s.medicineName] || 0) + s.quantity;
    });

    // Stockout predictions
    const stockoutPredictions = inventoryDetailed.map(item => {
      const sold = salesByMedicine[item.medicineName] || 0;
      let riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE' = 'SAFE';
      let daysUntilStockout = '> 30 days';

      if (item.quantity === 0) {
        riskLevel = 'CRITICAL';
        daysUntilStockout = 'ALREADY DEPLETED (0 units)';
      } else if (item.quantity <= 10) {
        riskLevel = 'CRITICAL';
        daysUntilStockout = '1 - 2 days at current demand';
      } else if (item.quantity <= 25) {
        riskLevel = 'HIGH';
        daysUntilStockout = '3 - 7 days';
      } else if (item.quantity <= 50 && sold > 20) {
        riskLevel = 'MODERATE';
        daysUntilStockout = '7 - 14 days';
      }

      return {
        medicineName: item.medicineName,
        batchNumber: item.batchNumber,
        currentQuantity: item.quantity,
        riskLevel,
        daysUntilStockout,
        recommendation: item.quantity <= 25
          ? `Immediate reorder suggested: order at least 50-100 units from distributor.`
          : `Healthy stock level. Maintain regular monitoring.`
      };
    });

    // Reorder recommendations
    const reorderRecommendations = inventoryDetailed
      .filter(item => item.quantity <= 30)
      .map(item => ({
        medicineName: item.medicineName,
        batchNumber: item.batchNumber,
        currentQuantity: item.quantity,
        suggestedOrderQuantity: item.quantity <= 10 ? 100 : 50,
        urgency: (item.quantity <= 10 ? 'IMMEDIATE' : 'HIGH') as 'IMMEDIATE' | 'HIGH',
        reason: item.quantity <= 10
          ? `Severely low stock (${item.quantity} units left). Prevent patient stockouts.`
          : `Approaching reorder threshold (${item.quantity} units left).`,
        supplierRole: 'Distributor'
      }));

    // Near expiry
    const nearExpiryRisks = inventoryDetailed
      .filter(i => i.daysToExpiry <= 60 && i.daysToExpiry >= 0)
      .map(i => ({
        medicineName: i.medicineName,
        batchNumber: i.batchNumber,
        quantity: i.quantity,
        daysToExpiry: i.daysToExpiry,
        expiryDate: i.expDate || 'N/A',
        suggestedAction: i.daysToExpiry <= 30
          ? `INITIATE RETURN IMMEDIATELY to distributor for credit/replacement.`
          : `Prioritize selling first (FEFO) or prepare return shipment.`
      }));

    const totalUnits = inventoryDetailed.reduce((sum, i) => sum + i.quantity, 0);
    const totalSoldUnits = retailerSales.reduce((sum, s) => sum + s.quantity, 0);

    return {
      role: 'retailer',
      userName: session.name,
      userId,
      timestamp: new Date().toISOString(),
      summary: `Retail pharmacy inventory: ${inventoryDetailed.length} active medicine batches (${totalUnits} total units in stock), ${retailerSales.length} recorded sales transactions (${totalSoldUnits} units dispensed).`,
      metrics: {
        totalInventoryItems: inventoryDetailed.length,
        totalUnitsInStock: totalUnits,
        totalUnitsSold: totalSoldUnits,
        nearExpiryCount: nearExpiryRisks.length,
        lowStockItemsCount: reorderRecommendations.length,
        incomingShipmentsCount: shipments.filter(s => s.toId === userId && s.status === 'in_transit').length
      },
      inventoryOrBatches: inventoryDetailed,
      shipments: shipments.slice(-10),
      salesOrMovement: retailerSales.slice(-15),
      stockoutPredictions,
      reorderRecommendations,
      nearExpiryRisks,
      alerts
    };
  }

  if (role === 'manufacturer') {
    // Manufacturer context
    const batches = (db.batches || []).filter(b => b.manufacturerId === userId);
    const shipments = (db.shipments || []).filter(s => s.fromId === userId || (s.toId === userId && s.type === 'return'));

    const batchesDetailed = batches.map(b => {
      const shippedUnits = (db.shipments || [])
        .filter(s => s.batchId === b.id && s.fromId === userId && s.status !== 'received' /* or all forward */)
        .reduce((sum, s) => sum + (s.quantity || 0), 0);
      
      const availableUnits = Math.max(0, b.totalQuantity - shippedUnits);
      const daysToExpiry = Math.floor((new Date(b.expDate).getTime() - now) / (1000 * 60 * 60 * 24));

      return {
        id: b.id,
        batchNumber: b.batchNumber,
        medicineName: b.medicineName,
        totalQuantity: b.totalQuantity,
        availableQuantity: availableUnits,
        mfgDate: b.mfgDate,
        expDate: b.expDate,
        daysToExpiry,
        status: b.status,
        isFrozen: b.isFrozen || false,
        freezeReason: b.freezeReason
      };
    });

    const stockoutPredictions = batchesDetailed.map(b => {
      let riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE' = 'SAFE';
      let daysUntilStockout = 'Normal production buffer';

      if (b.availableQuantity === 0) {
        riskLevel = 'CRITICAL';
        daysUntilStockout = 'FULLY DISPATCHED (0 units left at factory)';
      } else if (b.availableQuantity < b.totalQuantity * 0.15) {
        riskLevel = 'HIGH';
        daysUntilStockout = 'Depleting rapidly (< 15% factory stock remaining)';
      }

      return {
        medicineName: b.medicineName,
        batchNumber: b.batchNumber,
        currentQuantity: b.availableQuantity,
        riskLevel,
        daysUntilStockout,
        recommendation: b.availableQuantity === 0
          ? `Plan a new production run for ${b.medicineName}.`
          : `Schedule packaging for next batch run soon.`
      };
    });

    const reorderRecommendations = batchesDetailed
      .filter(b => b.availableQuantity < 500)
      .map(b => ({
        medicineName: b.medicineName,
        batchNumber: b.batchNumber,
        currentQuantity: b.availableQuantity,
        suggestedOrderQuantity: 5000,
        urgency: (b.availableQuantity === 0 ? 'IMMEDIATE' : 'HIGH') as 'IMMEDIATE' | 'HIGH',
        reason: `Factory inventory for ${b.medicineName} is at ${b.availableQuantity} units. New batch manufacturing recommended.`,
        supplierRole: 'Internal Manufacturing Plant'
      }));

    const nearExpiryRisks = batchesDetailed
      .filter(b => b.daysToExpiry <= 60 && b.daysToExpiry >= 0)
      .map(b => ({
        medicineName: b.medicineName,
        batchNumber: b.batchNumber,
        quantity: b.availableQuantity,
        daysToExpiry: b.daysToExpiry,
        expiryDate: b.expDate,
        suggestedAction: `Near expiry in ${b.daysToExpiry} days. Route remaining unallocated units to Disposer for controlled destruction.`
      }));

    const totalManufacturedUnits = batchesDetailed.reduce((sum, b) => sum + b.totalQuantity, 0);
    const totalAvailableFactoryUnits = batchesDetailed.reduce((sum, b) => sum + b.availableQuantity, 0);

    return {
      role: 'manufacturer',
      userName: session.name,
      userId,
      timestamp: new Date().toISOString(),
      summary: `Manufacturing plant operations: ${batchesDetailed.length} total batches produced (${totalManufacturedUnits.toLocaleString()} total units manufactured, ${totalAvailableFactoryUnits.toLocaleString()} units currently available in warehouse buffer).`,
      metrics: {
        totalBatches: batchesDetailed.length,
        totalManufacturedUnits,
        availableFactoryUnits: totalAvailableFactoryUnits,
        dispatchedShipmentsCount: shipments.filter(s => s.fromId === userId).length,
        returnsReceivedCount: shipments.filter(s => s.toId === userId && s.type === 'return').length,
        nearExpiryBatchesCount: nearExpiryRisks.length
      },
      inventoryOrBatches: batchesDetailed,
      shipments: shipments.slice(-10),
      salesOrMovement: shipments.filter(s => s.fromId === userId).slice(-10),
      stockoutPredictions,
      reorderRecommendations,
      nearExpiryRisks,
      alerts
    };
  }

  if (role === 'distributor') {
    // Distributor context
    const inventory = (db.inventory || []).filter(i => i.ownerId === userId);
    const shipments = (db.shipments || []).filter(s => s.toId === userId || s.fromId === userId);

    const inventoryDetailed = inventory.map(inv => {
      const batch = db.batches.find(b => b.id === inv.batchId);
      const daysToExpiry = batch ? Math.floor((new Date(batch.expDate).getTime() - now) / (1000 * 60 * 60 * 24)) : 999;
      return {
        id: inv.id,
        batchId: inv.batchId,
        medicineName: batch?.medicineName || 'Medicine',
        batchNumber: batch?.batchNumber || 'N/A',
        quantity: inv.quantity,
        expDate: batch?.expDate,
        daysToExpiry,
        status: inv.status,
        isFrozen: batch?.isFrozen || false
      };
    });

    // Outbound shipments to retailers (distributor sales velocity)
    const outboundToRetailers = shipments.filter(s => s.fromId === userId && s.type === 'forward');
    const velocityByMedicine: Record<string, number> = {};
    outboundToRetailers.forEach(s => {
      const batch = db.batches.find(b => b.id === s.batchId);
      const medName = batch?.medicineName || 'Unknown';
      velocityByMedicine[medName] = (velocityByMedicine[medName] || 0) + s.quantity;
    });

    const stockoutPredictions = inventoryDetailed.map(item => {
      let riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE' = 'SAFE';
      let daysUntilStockout = '> 30 days';

      if (item.quantity === 0) {
        riskLevel = 'CRITICAL';
        daysUntilStockout = 'STOCKOUT (0 units in distribution hub)';
      } else if (item.quantity <= 100) {
        riskLevel = 'HIGH';
        daysUntilStockout = 'Estimated 3 - 5 days based on pharmacy orders';
      } else if (item.quantity <= 250) {
        riskLevel = 'MODERATE';
        daysUntilStockout = 'Estimated 10 - 14 days';
      }

      return {
        medicineName: item.medicineName,
        batchNumber: item.batchNumber,
        currentQuantity: item.quantity,
        riskLevel,
        daysUntilStockout,
        recommendation: item.quantity <= 100
          ? `Request replenishment shipment from Manufacturer immediately.`
          : `Adequate supply buffer maintained.`
      };
    });

    const reorderRecommendations = inventoryDetailed
      .filter(item => item.quantity <= 200)
      .map(item => ({
        medicineName: item.medicineName,
        batchNumber: item.batchNumber,
        currentQuantity: item.quantity,
        suggestedOrderQuantity: 500,
        urgency: (item.quantity <= 50 ? 'IMMEDIATE' : 'HIGH') as 'IMMEDIATE' | 'HIGH',
        reason: `Hub stock for ${item.medicineName} is at ${item.quantity} units. Order new shipment from manufacturer to avoid retail supply disruptions.`,
        supplierRole: 'Manufacturer'
      }));

    const nearExpiryRisks = inventoryDetailed
      .filter(i => i.daysToExpiry <= 60 && i.daysToExpiry >= 0)
      .map(i => ({
        medicineName: i.medicineName,
        batchNumber: i.batchNumber,
        quantity: i.quantity,
        daysToExpiry: i.daysToExpiry,
        expiryDate: i.expDate || 'N/A',
        suggestedAction: `Near expiry in ${i.daysToExpiry} days. Expedite to high-velocity pharmacies or return to manufacturer.`
      }));

    const totalHubUnits = inventoryDetailed.reduce((sum, i) => sum + i.quantity, 0);

    return {
      role: 'distributor',
      userName: session.name,
      userId,
      timestamp: new Date().toISOString(),
      summary: `Regional Distribution Hub: ${inventoryDetailed.length} inventory lines (${totalHubUnits.toLocaleString()} units available in warehouse). Total outbound dispatches: ${outboundToRetailers.length}.`,
      metrics: {
        totalHubInventoryItems: inventoryDetailed.length,
        totalHubUnits,
        outboundShipmentsCount: outboundToRetailers.length,
        pendingIncomingDeliveries: shipments.filter(s => s.toId === userId && s.status === 'in_transit').length,
        pendingRetailerReturns: shipments.filter(s => s.toId === userId && s.type === 'return' && s.status !== 'received').length,
        nearExpiryLinesCount: nearExpiryRisks.length
      },
      inventoryOrBatches: inventoryDetailed,
      shipments: shipments.slice(-10),
      salesOrMovement: outboundToRetailers.slice(-10),
      stockoutPredictions,
      reorderRecommendations,
      nearExpiryRisks,
      alerts
    };
  }

  if (role === 'disposer') {
    // Disposer context
    const records = (db.disposalRecords || []).filter(d => d.disposerId === userId);
    const incoming = (db.shipments || []).filter(s => s.toId === userId && s.type === 'disposal');

    const pendingRecords = records.filter(r => r.status === 'pending');
    const completedRecords = records.filter(r => r.status === 'completed');

    const pendingDetails = pendingRecords.map(p => {
      const batch = db.batches.find(b => b.id === p.batchId);
      return {
        recordId: p.id,
        medicineName: batch?.medicineName || 'Medicine',
        batchNumber: batch?.batchNumber || 'N/A',
        quantity: p.quantity || 0,
        createdAt: p.createdAt,
        status: 'PENDING BIO-DESTRUCTION'
      };
    });

    const completedDetails = completedRecords.map(c => {
      const batch = db.batches.find(b => b.id === c.batchId);
      return {
        recordId: c.id,
        medicineName: batch?.medicineName || 'Medicine',
        batchNumber: batch?.batchNumber || 'N/A',
        quantity: c.quantity || 0,
        completedAt: c.completedAt,
        hasCertificate: !!c.certificateUrl,
        hasVideoProof: !!c.videoUrl
      };
    });

    const totalPendingUnits = pendingDetails.reduce((sum, p) => sum + p.quantity, 0);
    const totalDestroyedUnits = completedDetails.reduce((sum, c) => sum + c.quantity, 0);

    return {
      role: 'disposer',
      userName: session.name,
      userId,
      timestamp: new Date().toISOString(),
      summary: `Certified Pharmaceutical Destruction Facility: ${completedRecords.length} completed disposals (${totalDestroyedUnits.toLocaleString()} units safely destroyed), ${pendingRecords.length} pending destruction batches (${totalPendingUnits.toLocaleString()} units awaiting bio-incineration).`,
      metrics: {
        pendingDisposalCount: pendingRecords.length,
        completedDisposalCount: completedRecords.length,
        totalDestroyedUnits,
        totalPendingUnits,
        incomingDisposalShipments: incoming.filter(s => s.status === 'in_transit').length
      },
      inventoryOrBatches: pendingDetails,
      shipments: incoming,
      salesOrMovement: completedDetails.slice(-10),
      stockoutPredictions: [],
      reorderRecommendations: [],
      nearExpiryRisks: [],
      alerts
    };
  }

  // Role === 'host' (Regulatory Observer / Controller)
  const batches = db.batches || [];
  const inventory = db.inventory || [];
  const shipments = db.shipments || [];
  const disposals = db.disposalRecords || [];

  const frozenBatches = batches.filter(b => b.isFrozen);
  const flaggedBatches = batches.filter(b => b.isFlagged && !b.isFrozen);
  const returnsInTransit = shipments.filter(s => s.type === 'return' && s.status !== 'received');
  const nearExpiryBatches = batches.filter(b => {
    const expTime = new Date(b.expDate).getTime();
    return (expTime - now) <= 60 * 24 * 60 * 60 * 1000 || b.status === 'near_expiry';
  });

  const totalCirculationUnits = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const totalDestroyedUnits = disposals.filter(d => d.status === 'completed').reduce((sum, d) => sum + (d.quantity || 0), 0);

  return {
    role: 'host',
    userName: session.name,
    userId,
    timestamp: new Date().toISOString(),
    summary: `Nationwide Central Regulatory Intelligence: ${batches.length} total drug batches tracked, ${totalCirculationUnits.toLocaleString()} active units in circulation across supply chain nodes, ${frozenBatches.length} batches under regulatory freeze, ${nearExpiryBatches.length} batches on near-expiry radar.`,
    metrics: {
      totalRegisteredBatches: batches.length,
      activeCirculationUnits: totalCirculationUnits,
      frozenBatchesCount: frozenBatches.length,
      flaggedBatchesCount: flaggedBatches.length,
      nearExpiryBatchesCount: nearExpiryBatches.length,
      returnsInTransitCount: returnsInTransit.length,
      totalDestroyedUnits
    },
    inventoryOrBatches: batches.slice(0, 20).map(b => ({
      batchNumber: b.batchNumber,
      medicineName: b.medicineName,
      totalQuantity: b.totalQuantity,
      mfgDate: b.mfgDate,
      expDate: b.expDate,
      status: b.status,
      isFrozen: b.isFrozen,
      isFlagged: b.isFlagged,
      manufacturerName: b.manufacturerName
    })),
    shipments: shipments.slice(-15),
    salesOrMovement: (db.sales || []).slice(-15),
    stockoutPredictions: [],
    reorderRecommendations: [],
    nearExpiryRisks: nearExpiryBatches.slice(0, 10).map(b => ({
      medicineName: b.medicineName,
      batchNumber: b.batchNumber,
      quantity: b.totalQuantity,
      daysToExpiry: Math.floor((new Date(b.expDate).getTime() - now) / (1000 * 60 * 60 * 24)),
      expiryDate: b.expDate,
      suggestedAction: 'Regulatory audit for return or disposal.'
    })),
    alerts
  };
}
