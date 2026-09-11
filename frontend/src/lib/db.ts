import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export type Role = 'manufacturer' | 'distributor' | 'retailer' | 'disposer' | 'host';
export type BatchStatus = 'in_stock' | 'partially_in_transit' | 'near_expiry' | 'return_in_transit' | 'disposal_in_transit' | 'fully_disposed';
export type ShipmentStatus = 'awaiting_proof' | 'in_transit' | 'received';
export type ShipmentType = 'forward' | 'return' | 'disposal';
export type InventoryStatus = 'in_stock' | 'near_expiry' | 'reserved_for_return';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  licenseNumber?: string;
}

export interface Batch {
  id: string;
  batchNumber: string;
  medicineName: string;
  medicineType: string;
  mfgDate: string;
  expDate: string;
  totalQuantity: number;
  unitDetails: string;
  packagingType?: string; // e.g. "Strips", "Tonic Bottles", "Cream Tubes", "Vials"
  unitBarcodes?: string[]; // Array of unique engraved unit barcodes
  qrCode: string;      // base64 QR image data URL
  qrData: string;      // raw text encoded in QR
  manufacturerId: string;
  manufacturerName: string;
  status: BatchStatus;
  isFrozen?: boolean;
  freezeReason?: string;
  frozenAt?: string;
  frozenBy?: string;
  isFlagged?: boolean;
  flagReason?: string;
  flaggedAt?: string;
  flaggedBy?: string;
  hasPendingRectification?: boolean;
  latestRectificationId?: string;
  history: HistoryEvent[];
  createdAt: string;
}

export interface HistoryEvent {
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  event: string;
  details?: string;
}

export interface InventoryItem {
  id: string;
  batchId: string;
  ownerId: string;
  ownerRole: Role;
  quantity: number;
  status: InventoryStatus;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  type: ShipmentType;
  fromId: string;
  fromRole: Role;
  fromName: string;
  toId: string;
  toRole: Role;
  toName: string;
  fromAddress?: string;
  toAddress?: string;
  batchId: string;
  quantity: number;
  qrCode: string;
  qrData: string;
  status: ShipmentStatus;
  senderProofUrl?: string;
  senderOcgProofUrl?: string;
  receiverProofUrl?: string;
  receiverOcgProofUrl?: string;
  ocgVerificationCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UnitRecord {
  unitBarcode: string;
  batchId: string;
  batchNumber: string;
  medicineName: string;
  unitIndex: number;
  packagingType: string;
  status: 'in_stock' | 'sold' | 'disposed';
  isEncrypted?: boolean;
  decryptedData?: {
    batchNumber: string;
    mfgDate: string;
    expDate: string;
    unitSerial: string;
  };
  revealedByRole?: 'retailer' | 'disposer' | 'manufacturer';
  revealedByUserId?: string;
  revealedByUserName?: string;
  revealedAt?: string;
  soldAt?: string;
  soldBy?: string;
  soldToCustomer?: string;
  invoiceNumber?: string;
  disposedAt?: string;
  disposedBy?: string;
  disposalId?: string;
}

export interface RetailerPriceSetting {
  medicineName: string;
  batchId?: string;
  unitPrice: number;
  mrp?: number;
  taxRatePercent?: number; // e.g. 5, 12, 18
  updatedAt: string;
}

export interface InvoiceItem {
  batchId: string;
  batchNumber: string;
  medicineName: string;
  packagingType?: string;
  scannedUnitBarcodes: string[];
  quantity: number;
  unitPrice: number;
  mrp?: number;
  taxRatePercent?: number;
  taxAmount: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  invoiceNumber?: string;
  retailerId: string;
  retailerName: string;
  retailerShopName?: string;
  retailerAddress?: string;
  retailerCity?: string;
  retailerState?: string;
  retailerPincode?: string;
  retailerPhone?: string;
  retailerLicense?: string;
  customerName?: string;
  customerPhone?: string;
  doctorName?: string;
  paymentMode?: 'cash' | 'upi' | 'card' | 'credit';
  batchId: string;
  batchNumber: string;
  medicineName: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  items?: InvoiceItem[];
  scannedUnitBarcodes?: string[];
  soldAt: string;
}

export interface DisposalRecord {
  id: string;
  batchId: string;
  shipmentId: string;
  disposerId: string;
  disposerName: string;
  quantity?: number;
  photoBeforeUrl?: string;
  photoAfterUrl?: string;
  videoUrl?: string;
  certificateUrl?: string;
  certificateNumber?: string;
  disposalMethod?: string;
  officerName?: string;
  certificateNotes?: string;
  scannedUnitBarcodes?: string[];
  status: 'pending' | 'completed';
  completedAt?: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  userId: string;
  batchId?: string;
  shipmentId?: string;
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  isRead: boolean;
  createdAt: string;
}

export interface RestockOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerRole: Role;
  buyerName: string;
  supplierId: string;
  supplierRole: Role;
  supplierName: string;
  medicineName: string;
  quantity: number;
  priority: 'standard' | 'urgent';
  notes?: string;
  status: 'pending' | 'accepted' | 'shipped' | 'fulfilled' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface RectificationRequest {
  id: string;
  batchId: string;
  batchNumber: string;
  medicineName: string;
  requesterId: string;
  requesterName: string;
  requesterRole: Role;
  reasonForHold: string;
  appealNotes: string;
  rectifiedProofUrl: string;
  rectifiedOcgUrl?: string;
  status: 'pending_review' | 'approved_reverified' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewRemarks?: string;
}

export interface DatabaseSchema {
  users: User[];
  batches: Batch[];
  inventory: InventoryItem[];
  shipments: Shipment[];
  sales: Sale[];
  disposalRecords: DisposalRecord[];
  alerts: Alert[];
  restockOrders: RestockOrder[];
  rectificationRequests?: RectificationRequest[];
  retailerPrices?: Record<string, Record<string, RetailerPriceSetting>>; // [retailerId][medicineName or batchId]
  unitRecords?: UnitRecord[];
}

// Find real path of data.json regardless of where node was launched
function getDbPath(): string {
  const cwd = process.cwd();
  const directPath = path.join(cwd, 'data.json');
  const frontendPath = path.join(cwd, 'frontend', 'data.json');
  
  if (fsSync.existsSync(directPath)) return directPath;
  if (fsSync.existsSync(frontendPath)) return frontendPath;
  
  if (path.basename(cwd) === 'frontend') {
    return directPath;
  }
  return frontendPath;
}

// Seed accounts with known bcrypt hashes for 'password123'
const SEED_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

const SEED_USERS: User[] = [
  {
    id: 'seed-manufacturer-01',
    name: 'Apex Pharmaceuticals Ltd',
    email: 'manufacturer@pharmatrack.com',
    passwordHash: SEED_PASSWORD_HASH,
    role: 'manufacturer'
  },
  {
    id: 'seed-distributor-01',
    name: 'Global Pharma Logistics',
    email: 'distributor@pharmatrack.com',
    passwordHash: SEED_PASSWORD_HASH,
    role: 'distributor'
  },
  {
    id: 'seed-retailer-01',
    name: 'City Care Pharmacy',
    email: 'retailer@pharmatrack.com',
    passwordHash: SEED_PASSWORD_HASH,
    role: 'retailer'
  },
  {
    id: 'seed-disposer-01',
    name: 'EcoSafe Bio-Disposal Inc',
    email: 'disposer@pharmatrack.com',
    passwordHash: SEED_PASSWORD_HASH,
    role: 'disposer'
  },
  {
    id: 'user-distributor-aldrin',
    name: 'Aldrin Pharma Distributors',
    email: 'aldrinprajo08@gmail.com',
    passwordHash: SEED_PASSWORD_HASH,
    role: 'distributor'
  },
  {
    id: 'user-disposer-eknath',
    name: 'Aakash Disposers Inc',
    email: 'eknath1303@gmail.com',
    passwordHash: SEED_PASSWORD_HASH,
    role: 'disposer'
  },
  {
    id: 'seed-host-01',
    name: 'Central Drug Regulatory Authority (Host Control)',
    email: 'host@pharmatrack.com',
    passwordHash: SEED_PASSWORD_HASH,
    role: 'host'
  }
];

// Cache management with mtime tracking to ensure instant freshness
// whenever data.json is updated by any process or action.
let memoryCache: DatabaseSchema | null = null;
let lastMtimeMs = 0;

function getEmptyDb(): DatabaseSchema {
  return {
    users: [...SEED_USERS],
    batches: [],
    inventory: [],
    shipments: [],
    sales: [],
    disposalRecords: [],
    alerts: [],
    restockOrders: [],
    rectificationRequests: [],
    retailerPrices: {},
    unitRecords: []
  };
}

export function clearDbCache() {
  memoryCache = null;
  lastMtimeMs = 0;
}

export async function readDb(): Promise<DatabaseSchema> {
  const dbPath = getDbPath();

  if (fsSync.existsSync(dbPath)) {
    try {
      const stat = fsSync.statSync(dbPath);
      // Fast path: if cache exists and file on disk hasn't been modified, use cache
      if (memoryCache && stat.mtimeMs === lastMtimeMs) {
        return JSON.parse(JSON.stringify(memoryCache));
      }

      // File was modified or not cached yet: read fresh from disk
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const data = await fs.readFile(dbPath, 'utf-8');
          if (!data || data.trim().length === 0) {
            throw new Error('Empty file content');
          }
          const parsed: DatabaseSchema = JSON.parse(data);

          if (!Array.isArray(parsed.users)) parsed.users = [];
          if (!Array.isArray(parsed.batches)) parsed.batches = [];
          if (!Array.isArray(parsed.inventory)) parsed.inventory = [];
          if (!Array.isArray(parsed.shipments)) parsed.shipments = [];
          if (!Array.isArray(parsed.sales)) parsed.sales = [];
          if (!Array.isArray(parsed.disposalRecords)) parsed.disposalRecords = [];
          if (!Array.isArray(parsed.alerts)) parsed.alerts = [];
          if (!Array.isArray(parsed.restockOrders)) parsed.restockOrders = [];
          if (!Array.isArray(parsed.rectificationRequests)) parsed.rectificationRequests = [];
          if (typeof parsed.retailerPrices !== 'object' || parsed.retailerPrices === null) parsed.retailerPrices = {};
          if (!Array.isArray(parsed.unitRecords)) parsed.unitRecords = [];

          for (const seedUser of SEED_USERS) {
            if (!parsed.users.some(u => u.email.toLowerCase() === seedUser.email.toLowerCase())) {
              parsed.users.push(seedUser);
            }
          }

          memoryCache = parsed;
          lastMtimeMs = stat.mtimeMs;
          return JSON.parse(JSON.stringify(parsed));
        } catch (err) {
          if (attempt === 4) {
            console.error('Error reading data.json after 5 attempts:', err);
            if (memoryCache) return JSON.parse(JSON.stringify(memoryCache));
            break;
          }
          await new Promise(res => setTimeout(res, 25 * (attempt + 1)));
        }
      }
    } catch (e) {
      console.warn('File stat check error:', e);
    }
  }

  // File doesn't exist yet: initialize
  if (!memoryCache) {
    const initial = getEmptyDb();
    memoryCache = initial;
    try {
      await fs.writeFile(dbPath, JSON.stringify(initial, null, 2), 'utf-8');
      if (fsSync.existsSync(dbPath)) {
        lastMtimeMs = fsSync.statSync(dbPath).mtimeMs;
      }
    } catch (e) {
      console.warn('Initial db write warning:', e);
    }
  }

  return JSON.parse(JSON.stringify(memoryCache));
}

export async function writeDb(data: DatabaseSchema): Promise<void> {
  const dbPath = getDbPath();
  const jsonStr = JSON.stringify(data, null, 2);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await fs.writeFile(dbPath, jsonStr, 'utf-8');
      try {
        if (fsSync.existsSync(dbPath)) {
          lastMtimeMs = fsSync.statSync(dbPath).mtimeMs;
        }
      } catch (e) {}
      memoryCache = JSON.parse(JSON.stringify(data));
      return;
    } catch (err) {
      if (attempt === 4) {
        console.error('Failed to write data.json after 5 attempts:', err);
        memoryCache = JSON.parse(JSON.stringify(data));
      } else {
        await new Promise(res => setTimeout(res, 30 * (attempt + 1)));
      }
    }
  }
}

export function createAlert(
  db: DatabaseSchema,
  userId: string,
  message: string,
  type: Alert['type'],
  batchId?: string,
  shipmentId?: string
) {
  if (!Array.isArray(db.alerts)) db.alerts = [];
  db.alerts.push({
    id: crypto.randomUUID(),
    userId,
    batchId,
    shipmentId,
    message,
    type,
    isRead: false,
    createdAt: new Date().toISOString()
  });
}
