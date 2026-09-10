"use client";

import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"manufacturer" | "distributor" | "retailer" | "disposer">("manufacturer");
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const copyCreds = (email: string, roleName: string) => {
    navigator.clipboard.writeText(email);
    setCopiedRole(roleName);
    setTimeout(() => setCopiedRole(null), 2500);
  };

  const interactiveMockups = {
    manufacturer: {
      title: "Manufacturing Plant & Production Minting",
      subtitle: "Apex Pharmaceuticals Ltd · Plant 04 (GMP Certified)",
      badge: "Stage 01 · Origin",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      accentBg: "bg-blue-600",
      accentLight: "bg-blue-50 text-blue-700",
      description: "Generates standardized pharmaceutical batches with irreversible cryptographic QR minting, production yield locking, and dispatch courier verification.",
      metrics: [
        { label: "Active Production", value: "14 Batches", change: "+3 today" },
        { label: "Units Minted", value: "250,000", change: "100% verified" },
        { label: "Transit Routes", value: "12 Hubs", change: "Active" },
        { label: "Compliance Score", value: "99.98%", change: "FDA 21 CFR" },
      ],
      mockTable: {
        batchNo: "BN-202609-6978",
        product: "Paracetamol IP 650mg (Dolo)",
        mfg: "Sep 2026",
        exp: "Aug 2028 (700d)",
        qty: "1,000 units",
        status: "Dispatch Confirmed (In Transit)",
        statusColor: "bg-amber-50 text-amber-700 border-amber-200",
        actionText: "Track Cargo →",
      },
      auditEvent: "Minted by Dr. K. Sharma (Head QC) • Cryptographic Hash: 8f9c...4a12",
      featureHighlights: [
        "Unique collision-proof batch serial numbering (BN-YYYYMM-XXXX)",
        "Permanent quantity locking upon QR minting — zero counterfeit tampering",
        "Mandatory courier pickup photo (POD) upload to unlock transit state",
      ],
    },
    distributor: {
      title: "Logistics Hub & Dual-QR Custody Transfer",
      subtitle: "Global Pharma Logistics · Western Distribution Center",
      badge: "Stage 02 · Midstream",
      badgeColor: "bg-violet-50 text-violet-700 border-violet-200",
      accentBg: "bg-violet-600",
      accentLight: "bg-violet-50 text-violet-700",
      description: "Automated warehouse intake that validates pallet shipment QRs against internal medicine box QRs. Detects and blocks cargo substitutions in real-time.",
      metrics: [
        { label: "Intake Verified", value: "1,840 Crates", change: "Zero mismatch" },
        { label: "Hub Turnaround", value: "3.4 Hours", change: "-18% avg" },
        { label: "Retail Routes", value: "48 Pharmacies", change: "Active daily" },
        { label: "Chain of Custody", value: "100%", change: "Signed PODs" },
      ],
      mockTable: {
        batchNo: "SHP-7795626",
        product: "Amoxicillin Trihydrate 500mg",
        mfg: "Intake Verified",
        exp: "Dual-QR Matched",
        qty: "5,000 units",
        status: "In Warehouse (Ready for Retail)",
        statusColor: "bg-violet-50 text-violet-700 border-violet-200",
        actionText: "Dispatch to Retail →",
      },
      auditEvent: "Custody Handover Confirmed • Driver POD #POD-4401 signed by Rajesh V.",
      featureHighlights: [
        "Dual-QR matching engine cross-references shipment crate and unit medicine box",
        "Real-time quantity divergence alert engine preventing supply shrinkage",
        "Reverse-logistics hub to route returned near-expiry stock back to manufacturers",
      ],
    },
    retailer: {
      title: "Pharmacy Dispense & Automated Expiry Radar",
      subtitle: "City Care Pharmacy · License #PH-88219-DL",
      badge: "Stage 03 · Retail & POS",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accentBg: "bg-emerald-600",
      accentLight: "bg-emerald-50 text-emerald-700",
      description: "Pharmacy inventory management with continuous real-time expiration monitoring, consumer Point-of-Sale QR dispense, and 1-click reverse returns.",
      metrics: [
        { label: "Active Stock", value: "1,100 Units", change: "Verified safe" },
        { label: "Near-Expiry Watch", value: "1 Batch", change: "≤60 Days Alert" },
        { label: "Consumer Dispensed", value: "4,920 Rx", change: "Zero recall" },
        { label: "Return Protocol", value: "Auto-Filled", change: "Locked Qty" },
      ],
      mockTable: {
        batchNo: "BN-202609-6384",
        product: "Paracetamol IP 650mg",
        mfg: "Global Logistics",
        exp: "Expires in 1 Day ⚠️",
        qty: "1,000 units",
        status: "Near Expiry (Return Alert)",
        statusColor: "bg-red-50 text-red-700 border-red-200",
        actionText: "Initiate Return →",
      },
      auditEvent: "Automated Expiry Radar Triggered • Reverse return to Global Pharma Logistics auto-filled",
      featureHighlights: [
        "Automatic 60-day & 30-day proactive expiry alerts for pharmacists",
        "Point-of-Sale QR scanner verifies genuine batch provenance to patients",
        "1-Click return initiation with auto-filled distributor provenance and locked return quantities",
      ],
    },
    disposer: {
      title: "Bio-Disposal & Destruction Compliance Audit",
      subtitle: "EcoSafe Bio-Disposal Inc · Hazardous Waste License #HW-0091",
      badge: "Stage 04 · Terminal Burn",
      badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
      accentBg: "bg-orange-600",
      accentLight: "bg-orange-50 text-orange-700",
      description: "Terminal destruction facility providing indisputable 4-tier photo, video, and state certification audit trails before permanently closing the batch ledger.",
      metrics: [
        { label: "Incinerated", value: "82,000 Units", change: "Zero landfill" },
        { label: "Certificates Issued", value: "419 Certs", change: "Gov Approved" },
        { label: "Audit Video Logs", value: "100%", change: "HD Timestamped" },
        { label: "Ledger Terminal", value: "Burn Sealed", change: "Permanent" },
      ],
      mockTable: {
        batchNo: "DSP-3194021",
        product: "Metformin HCl 500mg (Expired)",
        mfg: "Intake Verified",
        exp: "Batch Expired",
        qty: "2,000 units",
        status: "Fully Disposed ✓",
        statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        actionText: "View Certificate →",
      },
      auditEvent: "Safe Destruction Complete • Incineration Chamber 2 @ 1100°C • Certificate #CERT-9901",
      featureHighlights: [
        "4-tier verification requirement: Before photo, after photo, video log, state certificate",
        "Permanent ledger closure marking batches as 'FULLY DISPOSED ✓'",
        "Direct automated notification sent to the originating manufacturer upon destruction",
      ],
    },
  };

  const activeData = interactiveMockups[activeTab];

  const demoAccounts = [
    {
      role: "Manufacturer",
      name: "Apex Pharmaceuticals Ltd",
      email: "manufacturer@pharmatrack.com",
      icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
      color: "blue",
      duty: "Mints batch QR codes, manages manufacturing runs, ships forward to distributors, and reviews destruction proofs.",
    },
    {
      role: "Distributor",
      name: "Global Pharma Logistics",
      email: "distributor@pharmatrack.com",
      icon: "M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4",
      color: "violet",
      duty: "Inspects incoming shipments with dual QR scans, manages distribution hubs, forwards to pharmacies, and handles reverse returns.",
    },
    {
      role: "Retailer",
      name: "City Care Pharmacy",
      email: "retailer@pharmatrack.com",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      color: "emerald",
      duty: "Receives pharmaceutical stock, dispenses to patients with POS QR scanner, and triggers 1-click near-expiry returns.",
    },
    {
      role: "Bio-Disposer",
      name: "EcoSafe Bio-Disposal Inc",
      email: "disposer@pharmatrack.com",
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
      color: "orange",
      duty: "Executes authorized destruction of expired pharmaceuticals, uploading mandatory 4-tier photo, video, and certificate evidence.",
    },
    {
      role: "Regulatory Host",
      name: "Central Drug Authority (FDA / CDSCO)",
      email: "host@pharmatrack.com",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      color: "rose",
      duty: "Observes the entire national supply chain, inspects real-time journeys, freezes suspicious batches, and exports compliance dossiers.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Utility Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-white">PharmaTrack Network Status:</span>
            <span className="text-slate-400 hidden sm:inline">All 4 nodes online · DSCSA & FDA 21 CFR Part 11 compliant protocol</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 hidden md:inline">Demo Master Password: <code className="font-mono text-emerald-400 font-semibold">password123</code></span>
            <a href="#demo" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Quick Login Accounts →
            </a>
          </div>
        </div>
      </div>

      {/* Enterprise Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xl text-slate-900 tracking-tight">PharmaTrack</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Supply Chain Provenance Platform</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#pipeline" className="hover:text-blue-600 transition-colors">Supply Pipeline</a>
            <a href="#mockup" className="hover:text-blue-600 transition-colors">Software Console</a>
            <a href="#architecture" className="hover:text-blue-600 transition-colors">Integrity Protocol</a>
            <a href="#compliance" className="hover:text-blue-600 transition-colors">Regulatory Standards</a>
            <a href="#demo" className="hover:text-blue-600 transition-colors">Test Credentials</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all border border-slate-200"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Public Box Scanner</span>
            </Link>
            <Link
              href="/login"
              className="px-4.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm hover:shadow transition-all active:scale-95"
            >
              Sign In to Portal →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-white border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified Pharmaceutical Supply Integrity System
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                Zero-Counterfeit <br />
                <span className="text-blue-600">Pharmaceutical Traceability</span> & Expiry Automation
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
                Connect manufacturers, distributors, retail pharmacies, and biological disposers on a unified cryptographic ledger.
                Eliminate counterfeit substitution with <strong>Dual-QR Verification</strong>, mandatory <strong>Signed Proof of Delivery (POD)</strong>, and automated <strong>60-day reverse-logistics returns</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/login"
                  className="px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 text-sm flex items-center gap-2"
                >
                  <span>Launch Portal</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <a
                  href="#mockup"
                  className="px-6 py-3.5 rounded-xl bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 transition-all text-sm border border-slate-200"
                >
                  Interactive Console Preview ↓
                </a>
              </div>

              {/* Compliance Badges */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Adhering to:</span>
                <span className="flex items-center gap-1.5 font-mono font-medium text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  FDA 21 CFR Part 11
                </span>
                <span className="flex items-center gap-1.5 font-mono font-medium text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  DSCSA Serialized
                </span>
                <span className="flex items-center gap-1.5 font-mono font-medium text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  WHO-GMP Guidelines
                </span>
              </div>
            </div>

            {/* Hero Right: Live Architecture Graphic */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-2xl border border-slate-800 relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-mono text-slate-400 ml-2">live-ledger-feed.json</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    REALTIME SYNCED
                  </span>
                </div>

                <div className="space-y-3.5 my-5 text-xs font-mono">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-start gap-3">
                    <span className="text-blue-400 text-base">🏭</span>
                    <div>
                      <div className="text-slate-300 font-semibold">STAGE 1 · BATCH MINTED</div>
                      <div className="text-slate-400 text-[11px]">Apex Pharma: BN-202609-6978 (1,000 units)</div>
                      <div className="text-emerald-400 text-[10px] mt-0.5">✓ Cryptographic QR Minted & Quantities Locked</div>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-start gap-3">
                    <span className="text-violet-400 text-base">🚚</span>
                    <div>
                      <div className="text-slate-300 font-semibold">STAGE 2 · DUAL-QR VERIFICATION</div>
                      <div className="text-slate-400 text-[11px]">Global Pharma Logistics: Dual-QR Matched</div>
                      <div className="text-emerald-400 text-[10px] mt-0.5">✓ Signed Driver POD Uploaded (0 mismatch)</div>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-start gap-3">
                    <span className="text-emerald-400 text-base">🏥</span>
                    <div>
                      <div className="text-slate-300 font-semibold">STAGE 3 · PHARMACY INVENTORY & RADAR</div>
                      <div className="text-slate-400 text-[11px]">City Care Pharmacy: 1,100 units monitored</div>
                      <div className="text-amber-400 text-[10px] mt-0.5">⚠️ Automated 60-Day Expiry Radar Active</div>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-start gap-3">
                    <span className="text-orange-400 text-base">☣️</span>
                    <div>
                      <div className="text-slate-300 font-semibold">STAGE 4 · SAFE TERMINAL DISPOSAL</div>
                      <div className="text-slate-400 text-[11px]">EcoSafe Bio-Disposal: Certificate #CERT-9901</div>
                      <div className="text-emerald-400 text-[10px] mt-0.5">✓ 4-Tier Video & Photo Proof Burn Sealed</div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Zero-Trust Protocol</span>
                  <span className="text-blue-400 font-semibold">100% Traceable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: The Interactive Supply Chain Visualizer Pipeline */}
      <section id="pipeline" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold font-mono tracking-widest text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              PHYSICAL TO DIGITAL PROTOCOL
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              How Medicines Flow Through PharmaTrack
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Every package is bound by cryptographic QR codes and photographic chain-of-custody proofs at each transfer boundary.
            </p>
          </div>

          {/* Connected Pipeline Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative text-left">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
                01
              </div>
              <span className="text-[11px] font-mono font-semibold text-blue-600 uppercase">Manufacturer</span>
              <h3 className="font-bold text-slate-900 text-base mt-1">Batch Minting & Dispatch</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Unique serial number generated. Physical boxes stamped with Box QR. Signed courier pickup receipt uploaded before dispatch.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Proof:</span>
                <span className="text-slate-800 font-semibold">Courier POD</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative text-left">
              <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
                02
              </div>
              <span className="text-[11px] font-mono font-semibold text-violet-600 uppercase">Distributor Hub</span>
              <h3 className="font-bold text-slate-900 text-base mt-1">Dual-QR Intake Scan</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Warehouse checks Crate QR against Medicine QR. Verifies exact quantity count. Re-dispatches to pharmacies with delivery receipt.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Proof:</span>
                <span className="text-slate-800 font-semibold">Dual-QR + POD</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
                03
              </div>
              <span className="text-[11px] font-mono font-semibold text-emerald-600 uppercase">Retail Pharmacy</span>
              <h3 className="font-bold text-slate-900 text-base mt-1">Dispense & Expiry Radar</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Stock monitored 24/7. Sold to patients via POS QR scan. Batches within 60 days auto-route to reverse-logistics returns.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Proof:</span>
                <span className="text-slate-800 font-semibold">POS Rx Scan</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative text-left">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
                04
              </div>
              <span className="text-[11px] font-mono font-semibold text-orange-600 uppercase">Bio-Disposer</span>
              <h3 className="font-bold text-slate-900 text-base mt-1">Audited Destruction</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Expired pharmaceuticals incinerated. Before photo, after photo, video audit, and state certificate burn-seal the ledger entry.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Proof:</span>
                <span className="text-slate-800 font-semibold">4-Tier Audit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Interactive Role-Based Software Console Preview */}
      <section id="mockup" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs font-bold font-mono tracking-widest text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              LIVE CONSOLE PREVIEW
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Explore the Specialized Role Dashboards
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Click each persona below to see how the PharmaTrack Pro software adapts to each organization in the supply chain.
            </p>
          </div>

          {/* Interactive Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {(["manufacturer", "distributor", "retailer", "disposer"] as const).map((roleKey) => {
              const isSelected = activeTab === roleKey;
              const labels = {
                manufacturer: "1. Manufacturer (Apex Pharma)",
                distributor: "2. Distributor (Global Logistics)",
                retailer: "3. Retailer (City Care Pharmacy)",
                disposer: "4. Bio-Disposer (EcoSafe)",
              };
              return (
                <button
                  key={roleKey}
                  onClick={() => setActiveTab(roleKey)}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {labels[roleKey]}
                </button>
              );
            })}
          </div>

          {/* Realistic Mock Console Interface */}
          <div className="max-w-5xl mx-auto bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-800">
            {/* Mock Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full border ${activeData.badgeColor}`}>
                    {activeData.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{activeData.subtitle}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mt-1">{activeData.title}</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">{activeData.description}</p>
              </div>

              <Link
                href="/login"
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-colors self-start sm:self-center shadow-sm ${activeData.accentBg}`}
              >
                Launch Role Console →
              </Link>
            </div>

            {/* Mock KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              {activeData.metrics.map((m, i) => (
                <div key={i} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 text-left">
                  <span className="text-xs text-slate-400 font-medium block">{m.label}</span>
                  <span className="text-2xl font-bold text-white mt-1 block font-mono">{m.value}</span>
                  <span className="text-[11px] text-emerald-400 mt-0.5 block font-mono">↑ {m.change}</span>
                </div>
              ))}
            </div>

            {/* Mock Data Table Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden my-6">
              <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 font-mono">CURRENT WORKSPACE RECORDS</span>
                <span className="text-[10px] font-mono text-slate-500">Auto-Refreshed (Zero Latency)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[11px] uppercase font-mono">
                    <tr>
                      <th className="px-5 py-3">Batch / Shipment</th>
                      <th className="px-5 py-3">Pharmaceutical</th>
                      <th className="px-5 py-3">Mfg / Origin</th>
                      <th className="px-5 py-3">Expiry Status</th>
                      <th className="px-5 py-3">Quantity</th>
                      <th className="px-5 py-3">Ledger State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    <tr className="hover:bg-slate-900/50">
                      <td className="px-5 py-3.5 text-blue-400 font-semibold">{activeData.mockTable.batchNo}</td>
                      <td className="px-5 py-3.5 text-slate-200 font-sans font-medium">{activeData.mockTable.product}</td>
                      <td className="px-5 py-3.5 text-slate-400">{activeData.mockTable.mfg}</td>
                      <td className="px-5 py-3.5 text-slate-300">{activeData.mockTable.exp}</td>
                      <td className="px-5 py-3.5 text-white font-semibold">{activeData.mockTable.qty}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold ${activeData.mockTable.statusColor}`}>
                          {activeData.mockTable.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Log Banner */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{activeData.auditEvent}</span>
              </div>
              <span className="text-slate-500 text-[10px] hidden sm:inline">Immutable Block #4492</span>
            </div>

            {/* Feature Bullet List */}
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-left">
              {activeData.featureHighlights.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-300 leading-relaxed">{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Cryptographic Integrity & Anti-Counterfeit Safeguards */}
      <section id="architecture" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold font-mono tracking-widest text-blue-600 uppercase bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              SECURITY ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Why Fake Drugs Cannot Penetrate PharmaTrack
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Traditional barcodes and paper manifests are easily duplicated. PharmaTrack introduces 4 layers of cryptographic and physical defense.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-4">
                01
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Dual-QR Binding</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The outer carrier crate has a unique Shipment QR, while inside boxes have Batch QR codes. A shipment cannot be completed unless both cryptographically match on intake.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-left">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
                02
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Mandatory Driver POD</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every physical handoff requires uploading a real photo of the signed courier delivery slip. The shipment status remains locked in transit until this photographic proof is provided.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-left">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-4">
                03
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Quantity Divergence Alarm</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If a receiver enters a count different from the dispatch bill, the transaction is rejected and red-flag alerts are broadcast instantly to the sender, receiver, and regulatory inspectors.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-left">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-4">
                04
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">Locked Reverse Returns</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pharmacies returning near-expiry medicines cannot return to fake distributors or fabricate return numbers. Recipient and quantity are automatically locked from the original delivery record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Regulatory Standards */}
      <section id="compliance" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest mb-6">
            BUILT FOR GLOBAL PHARMACEUTICAL MANDATES
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-900 block font-mono">DSCSA Compliant</span>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Meets US FDA Drug Supply Chain Security Act requirements for electronic package tracing.
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-900 block font-mono">FDA 21 CFR Part 11</span>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Immutable electronic records, cryptographic signatures, and audit trails.
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-900 block font-mono">WHO-GMP Validated</span>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Standardized batch manufacturing records, recall procedures, and destruction verification.
              </p>
            </div>
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-900 block font-mono">EU FMD 2019/62</span>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                End-to-end verification and point-of-dispense authentication preventing falsified medicines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: Pre-Configured Demo Accounts (Interactive Sandbox) */}
      <section id="demo" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold font-mono tracking-widest text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              LIVE EVALUATION ACCESS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
              Explore the Sandbox with Demo Credentials
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Each organization account is pre-seeded with realistic batch and shipment data. The universal password for all roles is <code className="font-mono bg-white px-2 py-0.5 rounded border text-emerald-700 font-bold">password123</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 max-w-7xl mx-auto">
            {demoAccounts.map((acc) => (
              <div key={acc.role} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between text-left">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-900 text-sm">{acc.role}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      Seed User
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-700">{acc.name}</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{acc.duty}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="text-[11px] font-mono text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 truncate mb-2.5">
                    {acc.email}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyCreds(acc.email, acc.role)}
                      className="flex-1 py-2 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {copiedRole === acc.role ? "✓ Copied!" : "Copy Email"}
                    </button>
                    <Link
                      href={`/login?email=${encodeURIComponent(acc.email)}`}
                      className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs"
                    >
                      Login →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Field Inspector & Public Consumer Verification CTA */}
      <section className="bg-slate-900 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <span className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest block mb-1">
              PATIENT & INSPECTOR PORTAL
            </span>
            <h3 className="text-2xl font-extrabold text-white">Verify Any Medicine Box in Seconds</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              No login required. Field inspectors, hospital staff, and patients can scan any PharmaTrack QR code to review the complete, verified chain of custody.
            </p>
          </div>
          <Link
            href="/verify"
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 text-sm flex items-center gap-2 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>Open Public Scanner</span>
          </Link>
        </div>
      </section>

      {/* Corporate Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-slate-100 text-left">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  P
                </div>
                <span className="font-bold text-base text-slate-900 tracking-tight">PharmaTrack Pro</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
                Next-generation cryptographic pharmaceutical traceability system ensuring public health safety through complete supply chain verification.
              </p>
              <div className="text-[11px] font-mono text-slate-400">
                System Version 2.4.0 · Production Ready
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-900 block mb-3 uppercase tracking-wider text-[11px]">Role Workspaces</span>
              <ul className="space-y-2">
                <li><Link href="/login" className="hover:text-blue-600 transition-colors">Manufacturer Portal</Link></li>
                <li><Link href="/login" className="hover:text-blue-600 transition-colors">Distributor Hub</Link></li>
                <li><Link href="/login" className="hover:text-blue-600 transition-colors">Retail Pharmacy</Link></li>
                <li><Link href="/login" className="hover:text-blue-600 transition-colors">Bio-Disposal Vault</Link></li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-slate-900 block mb-3 uppercase tracking-wider text-[11px]">Protocols</span>
              <ul className="space-y-2">
                <li><Link href="/verify" className="hover:text-blue-600 transition-colors">Public QR Verification</Link></li>
                <li><a href="#architecture" className="hover:text-blue-600 transition-colors">Dual-QR Security</a></li>
                <li><a href="#architecture" className="hover:text-blue-600 transition-colors">Signed Proof of Delivery</a></li>
                <li><a href="#pipeline" className="hover:text-blue-600 transition-colors">Reverse Logistics Returns</a></li>
              </ul>
            </div>

            <div>
              <span className="font-bold text-slate-900 block mb-3 uppercase tracking-wider text-[11px]">Standards</span>
              <ul className="space-y-2">
                <li><span className="text-slate-600">FDA 21 CFR Part 11</span></li>
                <li><span className="text-slate-600">DSCSA Drug Tracing</span></li>
                <li><span className="text-slate-600">WHO-GMP Validated</span></li>
                <li><span className="text-slate-600">EU FMD 2019/62</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} PharmaTrack Technologies Inc. All rights reserved.</p>
            <p className="font-mono text-[11px] text-slate-400">Encrypted · Verified · DSCSA Audited</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
