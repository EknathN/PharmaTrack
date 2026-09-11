"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { saveRetailerPrice, generateCustomerInvoice } from "@/app/actions/retailerPricing";
import Barcode from "@/components/Barcode";
import CustomerBillView from "@/components/CustomerBillView";
import QrScanner, { DualScanAllocation } from "@/components/QrScanner";
import { Sale } from "@/lib/db";
import { extractUnitBarcode, parseUnitBarcode, compareQrAndBarcodeDates } from "@/lib/barcodeHelper";

interface InventoryItemWithPricing {
  inventoryId: string;
  batchId: string;
  batchNumber: string;
  medicineName: string;
  medicineType: string;
  unitDetails: string;
  packagingType: string;
  availableQuantity: number;
  mfgDate: string;
  expDate: string;
  isFrozen: boolean;
  freezeReason?: string;
  priceConfig: {
    unitPrice: number;
    mrp?: number;
    taxRatePercent?: number;
  };
  sampleUnitBarcodes: string[];
}

interface RetailerSellClientProps {
  initialInventory: InventoryItemWithPricing[];
  initialPrices: Record<string, any>;
  initialInvoices: Sale[];
  retailerName: string;
}

interface CartItem {
  batchId: string;
  batchNumber: string;
  medicineName: string;
  packagingType: string;
  availableQuantity: number;
  quantity: number;
  unitPrice: number;
  mrp?: number;
  taxRatePercent: number;
  scannedUnitBarcodes: string[];
}

export default function RetailerSellClient({
  initialInventory,
  initialPrices,
  initialInvoices,
  retailerName,
}: RetailerSellClientProps) {
  const [activeTab, setActiveTab] = useState<'pos' | 'pricing' | 'history'>('pos');
  const [inventory, setInventory] = useState(initialInventory);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [prices, setPrices] = useState(initialPrices);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [showScanner, setShowScanner] = useState(false);
  const [posError, setPosError] = useState('');
  const [posSuccess, setPosSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<Sale | null>(null);

  // Pricing Editor State
  const [priceFormState, setPriceFormState] = useState<Record<string, { unitPrice: number; mrp?: number; taxRatePercent?: number }>>({});
  const [pricingNotice, setPricingNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPrice, setSavingPrice] = useState<string | null>(null);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }, [cart]);

  const totalTax = useMemo(() => {
    return cart.reduce((acc, item) => {
      const lineSub = item.unitPrice * item.quantity;
      return acc + (lineSub * item.taxRatePercent) / 100;
    }, 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + totalTax - discountAmount);
  }, [subtotal, totalTax, discountAmount]);

  // Handle scanned or entered barcode/QR
  const handleProcessBarcode = (code: string) => {
    setPosError('');
    setPosSuccess('');
    const raw = code.trim();
    if (!raw) return;

    const unitBc = extractUnitBarcode(raw);
    let matchedItem: InventoryItemWithPricing | undefined;

    if (unitBc) {
      // Find batch that owns this unit barcode or matches batch prefix
      matchedItem = inventory.find(inv => {
        if (inv.sampleUnitBarcodes && inv.sampleUnitBarcodes.includes(unitBc)) return true;
        const cleanBatch = inv.batchNumber.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
        return unitBc.toUpperCase().includes(cleanBatch);
      });
    }

    if (!matchedItem) {
      // Try matching by batch number or batch ID in QR text
      matchedItem = inventory.find(inv => {
        return (
          raw.includes(inv.batchId) ||
          raw.includes(inv.batchNumber) ||
          inv.medicineName.toLowerCase() === raw.toLowerCase()
        );
      });
    }

    if (!matchedItem) {
      setPosError(`Code "${raw}" did not match any in-stock medicine in your pharmacy inventory.`);
      return;
    }

    if (matchedItem.isFrozen) {
      setPosError(`🚨 REGULATORY SAFETY HOLD: Batch ${matchedItem.batchNumber} (${matchedItem.medicineName}) is FROZEN by Regulatory Authority. Sales blocked.`);
      return;
    }

    // Anti-Fraud check: if unit barcode contains embedded dates, verify against inventory record
    const parsedBc = unitBc ? parseUnitBarcode(unitBc) : parseUnitBarcode(raw);
    if (parsedBc.isValid && (parsedBc.mfgDate || parsedBc.expDate)) {
      const dateCheck = compareQrAndBarcodeDates(matchedItem.mfgDate, matchedItem.expDate, parsedBc.mfgDate, parsedBc.expDate);
      if (!dateCheck.isMatch) {
        setPosError(`🚨 FRAUD / TAMPER ALERT: Unit barcode dates (MFG: ${parsedBc.mfgDate}, EXP: ${parsedBc.expDate}) do NOT match verified batch records (MFG: ${matchedItem.mfgDate}, EXP: ${matchedItem.expDate})! Sale rejected.`);
        return;
      }
    }

    // Add to cart
    addItemToCart(matchedItem, unitBc || undefined);
    setBarcodeInput('');
    setPosSuccess(`Added 1 unit of ${matchedItem.medicineName} (${matchedItem.packagingType}).`);
    setTimeout(() => setPosSuccess(''), 3500);
  };

  // Simultaneous Dual Scan Handler (Batch QR + Unit Barcode)
  const handleDualScanned = (allocation: DualScanAllocation) => {
    setPosError('');
    setPosSuccess('');

    if (allocation.isDateTampered) {
      setPosError(`🚨 FRAUD REJECTION: Barcode date tampering detected! ${allocation.tamperNotice}`);
      return;
    }

    let matchedItem: InventoryItemWithPricing | undefined;

    if (allocation.batchId) {
      matchedItem = inventory.find(inv => inv.batchId === allocation.batchId);
    }
    if (!matchedItem && allocation.unitBarcode) {
      matchedItem = inventory.find(inv => {
        if (inv.sampleUnitBarcodes && inv.sampleUnitBarcodes.includes(allocation.unitBarcode!)) return true;
        const cleanBatch = inv.batchNumber.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
        return allocation.unitBarcode!.toUpperCase().includes(cleanBatch);
      });
    }
    if (!matchedItem && allocation.batchNumber) {
      matchedItem = inventory.find(inv => inv.batchNumber.toLowerCase() === allocation.batchNumber!.toLowerCase());
    }

    if (!matchedItem) {
      if (allocation.rawCode) {
        handleProcessBarcode(allocation.rawCode);
      } else {
        setPosError('Scanned medicine details could not be matched with local inventory.');
      }
      return;
    }

    if (matchedItem.isFrozen) {
      setPosError(`🚨 REGULATORY SAFETY HOLD: Batch ${matchedItem.batchNumber} (${matchedItem.medicineName}) is FROZEN by Regulatory Authority. Sales blocked.`);
      return;
    }

    // Cross-verify dates
    if (allocation.mfgDate && allocation.expDate) {
      const dateCheck = compareQrAndBarcodeDates(matchedItem.mfgDate, matchedItem.expDate, allocation.mfgDate, allocation.expDate);
      if (!dateCheck.isMatch) {
        setPosError(`🚨 FRAUD ALERT: Scanned unit dates (MFG: ${allocation.mfgDate}, EXP: ${allocation.expDate}) do not match inventory record (MFG: ${matchedItem.mfgDate}, EXP: ${matchedItem.expDate})!`);
        return;
      }
    }

    addItemToCart(matchedItem, allocation.unitBarcode || undefined);
    setBarcodeInput('');
    setPosSuccess(`✓ Dual Verified & Allocated: ${matchedItem.medicineName} (${allocation.unitSerial ? `Unit #${allocation.unitSerial}` : matchedItem.packagingType}).`);
    setTimeout(() => setPosSuccess(''), 4000);
  };

  const addItemToCart = (item: InventoryItemWithPricing, unitBarcode?: string) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(c => c.batchId === item.batchId);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        if (existing.quantity >= item.availableQuantity) {
          setPosError(`Cannot exceed available stock (${item.availableQuantity} units).`);
          return prev;
        }

        const updated = [...prev];
        const newBarcodes = unitBarcode && !existing.scannedUnitBarcodes.includes(unitBarcode)
          ? [...existing.scannedUnitBarcodes, unitBarcode]
          : existing.scannedUnitBarcodes;

        updated[existingIdx] = {
          ...existing,
          quantity: existing.quantity + 1,
          scannedUnitBarcodes: newBarcodes,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            batchId: item.batchId,
            batchNumber: item.batchNumber,
            medicineName: item.medicineName,
            packagingType: item.packagingType,
            availableQuantity: item.availableQuantity,
            quantity: 1,
            unitPrice: item.priceConfig.unitPrice,
            mrp: item.priceConfig.mrp,
            taxRatePercent: item.priceConfig.taxRatePercent ?? 5,
            scannedUnitBarcodes: unitBarcode ? [unitBarcode] : [],
          },
        ];
      }
    });
  };

  const updateCartQty = (batchId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(batchId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.batchId === batchId) {
          const clamped = Math.min(newQty, item.availableQuantity);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const updateCartUnitPrice = (batchId: string, newPrice: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.batchId === batchId) {
          return { ...item, unitPrice: Math.max(0, newPrice) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (batchId: string) => {
    setCart(prev => prev.filter(item => item.batchId !== batchId));
  };

  // Submit sale and generate customer invoice
  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setPosError('Please add at least one medicine item to the cart.');
      return;
    }

    setIsSubmitting(true);
    setPosError('');

    const fd = new FormData();
    fd.set('customerName', customerName || 'Walk-in Customer');
    fd.set('customerPhone', customerPhone);
    fd.set('doctorName', doctorName);
    fd.set('paymentMode', paymentMode);
    fd.set('discountAmount', String(discountAmount));
    fd.set('cartJson', JSON.stringify(cart));

    const res = await generateCustomerInvoice(fd);
    setIsSubmitting(false);

    if (res.success && res.invoice) {
      setCompletedInvoice(res.invoice);
      setInvoices(prev => [res.invoice!, ...prev]);
      // Decrement local inventory
      setInventory(prev =>
        prev.map(inv => {
          const soldItem = cart.find(c => c.batchId === inv.batchId);
          if (soldItem) {
            return { ...inv, availableQuantity: Math.max(0, inv.availableQuantity - soldItem.quantity) };
          }
          return inv;
        })
      );
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDoctorName('');
      setDiscountAmount(0);
    } else {
      setPosError(res.error || 'Failed to complete transaction.');
    }
  };

  // Pricing Form Handler
  const handleSavePrice = async (medicineName: string) => {
    const edit = priceFormState[medicineName];
    if (!edit || isNaN(edit.unitPrice) || edit.unitPrice < 0) {
      setPricingNotice({ type: 'error', text: 'Please enter a valid retail selling price.' });
      return;
    }

    setSavingPrice(medicineName);
    setPricingNotice(null);

    const res = await saveRetailerPrice(medicineName, edit.unitPrice, edit.mrp, edit.taxRatePercent);
    setSavingPrice(null);

    if (res.success) {
      setPricingNotice({ type: 'success', text: res.message || 'Price updated successfully.' });
      setPrices(prev => ({
        ...prev,
        [medicineName]: {
          medicineName,
          unitPrice: edit.unitPrice,
          mrp: edit.mrp,
          taxRatePercent: edit.taxRatePercent,
          updatedAt: new Date().toISOString()
        }
      }));
      // Update inventory prices
      setInventory(prev =>
        prev.map(i => {
          if (i.medicineName === medicineName) {
            return {
              ...i,
              priceConfig: {
                unitPrice: edit.unitPrice,
                mrp: edit.mrp,
                taxRatePercent: edit.taxRatePercent ?? 5
              }
            };
          }
          return i;
        })
      );
      setTimeout(() => setPricingNotice(null), 4000);
    } else {
      setPricingNotice({ type: 'error', text: res.error || 'Failed to save price.' });
    }
  };

  // If sale just completed, show customer bill with option to print or record another sale
  if (completedInvoice) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <CustomerBillView
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ─── HEADER & TABS ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Pharmacy POS & Billing Terminal</h1>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full font-mono">
              {retailerName}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            Scan engraved unit barcodes on bottles/strips, calculate automated totals, manage private pricing, and print customer bills.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🛒 POS Billing & Scan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pricing' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔒 My Private Pricing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧾 Invoices ({invoices.length})
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 1: POS BILLING & BARCODE SCANNER
          ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Barcode Scanner & Quick Inventory Selector */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Alerts */}
            {posError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center justify-between">
                <span>{posError}</span>
                <button onClick={() => setPosError('')} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>
            )}
            {posSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
                ✓ {posSuccess}
              </div>
            )}

            {/* Barcode / QR Scanner Input Box */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>🏷️ Scan Engraved Unit Barcode or Batch QR</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowScanner(!showScanner)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                >
                  <span>📷</span>
                  <span>{showScanner ? 'Hide Camera' : 'Use Camera Scanner'}</span>
                </button>
              </div>

              {/* Camera Scanner Drawer */}
              {showScanner && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <QrScanner
                    label="Align Unit Barcode and/or Batch QR inside camera viewfinder"
                    onScanned={handleProcessBarcode}
                    onDualScanned={handleDualScanned}
                    placeholder="Scanning live QR + Barcode..."
                  />
                </div>
              )}

              {/* Laser Barcode Reader Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProcessBarcode(barcodeInput);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Scan bottle / strip barcode (e.g. BC-BN-202609-1803-0001)..."
                    className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  {barcodeInput && (
                    <button
                      type="button"
                      onClick={() => setBarcodeInput('')}
                      className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors whitespace-nowrap"
                >
                  Enter / Scan ↵
                </button>
              </form>

              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Supports USB/Bluetooth barcode guns, camera scans, or manual serial typing.</span>
              </div>
            </div>

            {/* Quick Add from Current Inventory */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Available Pharmacy Stock ({inventory.length} Medicines)
                </h3>
                <span className="text-[11px] text-slate-400">Click medicine to add to bill</span>
              </div>

              {inventory.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No medicines currently in stock. Please receive incoming stock from distributors first.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {inventory.map((item) => (
                    <div
                      key={item.batchId}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        item.isFrozen
                          ? 'bg-rose-50/70 border-rose-200 opacity-60 cursor-not-allowed'
                          : 'bg-slate-50/70 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 cursor-pointer shadow-2xs'
                      }`}
                      onClick={() => !item.isFrozen && addItemToCart(item)}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="font-bold text-slate-900 text-xs leading-snug line-clamp-1">
                          {item.medicineName}
                        </div>
                        <span className="font-mono font-bold text-emerald-700 text-xs shrink-0">
                          ₹{item.priceConfig.unitPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                        <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-medium">
                          {item.packagingType}
                        </span>
                        <span className="font-mono text-slate-600 font-semibold">{item.batchNumber}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1 border-t border-slate-100">
                        <span>Stock: <strong className="text-slate-800 font-bold">{item.availableQuantity}</strong> units</span>
                        {item.isFrozen ? (
                          <span className="text-rose-600 font-bold">❄️ Frozen Hold</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">+ Add Item</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Interactive Bill Builder & Totals */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 sticky top-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Customer Cart & Bill</h2>
                  <p className="text-xs text-slate-400">{cart.length} item(s) selected for billing</p>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  🛒 Cart is empty.<br />Scan a unit barcode or pick from inventory to start billing.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-100">
                  {cart.map((item) => (
                    <div key={item.batchId} className="pt-2.5 first:pt-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 text-xs block">{item.medicineName}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {item.packagingType} · Batch: {item.batchNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.batchId)}
                          className="text-slate-300 hover:text-rose-500 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Scanned Barcodes Badges */}
                      {item.scannedUnitBarcodes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.scannedUnitBarcodes.map((bc, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                            >
                              🏷️ {bc}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Quantity & Unit Price Controls */}
                      <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.batchId, item.quantity - 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                          >
                            -
                          </button>
                          <span className="font-bold text-slate-900 w-6 text-center font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.batchId, item.quantity + 1)}
                            className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 text-[10px]">Rate: ₹</span>
                          <input
                            type="number"
                            step="0.5"
                            value={item.unitPrice}
                            onChange={(e) => updateCartUnitPrice(item.batchId, parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-mono text-xs font-semibold text-slate-900"
                            title="Private selling price"
                          />
                        </div>

                        <div className="font-bold font-mono text-slate-900 text-right">
                          ₹{((item.unitPrice * item.quantity) + ((item.unitPrice * item.quantity * item.taxRatePercent) / 100)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer & Prescription Details Input */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Customer Information</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="Customer Mobile (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Doctor / Prescriber (opt)"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-semibold focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="upi">UPI / QR Payment</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="credit">Store Credit</option>
                  </select>
                </div>
              </div>

              {/* Live Automated Total Calculation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>GST / Tax:</span>
                  <span className="font-mono">₹{totalTax.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={discountAmount || ''}
                    placeholder="0"
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-16 px-1.5 py-0.5 border border-slate-200 rounded text-right font-mono text-xs text-emerald-700 font-bold bg-white"
                  />
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline text-slate-900 font-bold text-sm">
                  <span>Grand Total:</span>
                  <span className="text-xl font-mono text-emerald-700">
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Submit & Bill Print Button */}
              <button
                type="button"
                disabled={isSubmitting || cart.length === 0}
                onClick={handleCompleteSale}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <span>🖨️</span>
                <span>{isSubmitting ? 'Recording & Generating Invoice...' : 'Generate Bill & Complete Sale'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 2: MY PRIVATE MEDICINE PRICING (HIDDEN FROM HOST & OTHERS)
          ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pricing' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>🔒 Confidential Retail Pricing Catalog</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900 text-white font-bold">Private</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure your retail pharmacy selling rates and MRPs. These prices are strictly confidential to your store and <strong>hidden from everyone, including Host regulators, manufacturers, and distributors</strong>.
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span>🛡️</span>
              <span>100% Encrypted & Private to {retailerName}</span>
            </div>
          </div>

          {pricingNotice && (
            <div
              className={`p-3 rounded-xl text-xs font-medium border ${
                pricingNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              {pricingNotice.text}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 font-bold">Medicine Description</th>
                  <th className="py-3 font-bold">Packaging</th>
                  <th className="py-3 font-bold">In-Stock Units</th>
                  <th className="py-3 font-bold">My Selling Price (₹)</th>
                  <th className="py-3 font-bold">MRP (₹)</th>
                  <th className="py-3 font-bold">Tax / GST %</th>
                  <th className="py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((item) => {
                  const currentSaved = prices[item.medicineName] || item.priceConfig;
                  const currentForm = priceFormState[item.medicineName] || {
                    unitPrice: currentSaved.unitPrice,
                    mrp: currentSaved.mrp || 0,
                    taxRatePercent: currentSaved.taxRatePercent ?? 5
                  };

                  return (
                    <tr key={item.batchId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 pr-2 font-medium text-slate-900">
                        <div className="font-bold">{item.medicineName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Batch: {item.batchNumber}</div>
                      </td>
                      <td className="py-3.5 text-slate-600">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-semibold">
                          {item.packagingType}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 font-mono">
                        {item.availableQuantity}
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-mono">₹</span>
                          <input
                            type="number"
                            step="0.5"
                            value={currentForm.unitPrice}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setPriceFormState(prev => ({
                                ...prev,
                                [item.medicineName]: {
                                  ...currentForm,
                                  unitPrice: val
                                }
                              }));
                            }}
                            className="w-24 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-mono">₹</span>
                          <input
                            type="number"
                            step="0.5"
                            value={currentForm.mrp || ''}
                            placeholder="MRP"
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setPriceFormState(prev => ({
                                ...prev,
                                [item.medicineName]: {
                                  ...currentForm,
                                  mrp: val
                                }
                              }));
                            }}
                            className="w-20 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </td>
                      <td className="py-3.5">
                        <input
                          type="number"
                          value={currentForm.taxRatePercent ?? 5}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPriceFormState(prev => ({
                              ...prev,
                              [item.medicineName]: {
                                ...currentForm,
                                taxRatePercent: val
                              }
                            }));
                          }}
                          className="w-14 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 bg-white text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-slate-400 ml-1">%</span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          disabled={savingPrice === item.medicineName}
                          onClick={() => handleSavePrice(item.medicineName)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
                        >
                          {savingPrice === item.medicineName ? 'Saving...' : 'Save Price ✓'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB 3: PAST INVOICES & CUSTOMER BILLS
          ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Customer Tax Invoices History</h2>
              <p className="text-xs text-slate-500">View or reprint customer receipts with your pharmacy shop header and barcodes</p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {invoices.length} Bills Filed
            </span>
          </div>

          {invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No sales or invoices recorded yet. Start billing items in the POS tab.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 font-bold">Invoice #</th>
                    <th className="py-3 font-bold">Date & Time</th>
                    <th className="py-3 font-bold">Customer Name</th>
                    <th className="py-3 font-bold">Medicines Dispensed</th>
                    <th className="py-3 font-bold text-center">Total Qty</th>
                    <th className="py-3 font-bold text-right">Grand Total</th>
                    <th className="py-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber || inv.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(inv.soldAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 font-semibold text-slate-800">
                        {inv.customerName || 'Walk-in Customer'}
                        {inv.customerPhone && <span className="block text-[10px] text-slate-400 font-mono">{inv.customerPhone}</span>}
                      </td>
                      <td className="py-3 text-slate-700 max-w-xs truncate" title={inv.medicineName}>
                        {inv.medicineName}
                      </td>
                      <td className="py-3 font-bold text-center text-slate-800">
                        {inv.quantity}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-700">
                        ₹{(inv.totalAmount || inv.unitPrice || 0).toFixed(2)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/retailer/invoice/${inv.id}`}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <span>🖨️</span>
                          <span>Print Bill</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
