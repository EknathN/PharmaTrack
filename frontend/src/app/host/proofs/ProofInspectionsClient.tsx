"use client";

import React, { useState } from "react";
import Link from "next/link";
import { InspectionProofItem, markProofVerified, flagProofFraud } from "@/app/actions/inspections";

interface ProofInspectionsClientProps {
  initialData: {
    proofs: InspectionProofItem[];
    stats: {
      totalProofs: number;
      uniqueUploaders: number;
      duplicateSuspectCount: number;
      roleBreakdown: {
        manufacturer: number;
        distributor: number;
        retailer: number;
        disposer: number;
      };
    };
  };
}

export default function ProofInspectionsClient({ initialData }: ProofInspectionsClientProps) {
  const [proofs, setProofs] = useState<InspectionProofItem[]>(initialData.proofs);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [suspectOnly, setSuspectOnly] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal inspection state
  const [selectedProof, setSelectedProof] = useState<InspectionProofItem | null>(null);
  const [freezeModalProof, setFreezeModalProof] = useState<InspectionProofItem | null>(null);
  const [freezeReason, setFreezeReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredProofs = proofs.filter((p) => {
    if (roleFilter !== "all" && p.uploaderRole !== roleFilter) return false;
    if (typeFilter === "courier_pod" && p.type !== "courier_pod") return false;
    if (typeFilter === "ocg_sheet" && p.type !== "ocg_sheet") return false;
    if (typeFilter === "disposal" && !["disposal_before", "disposal_after", "disposal_video"].includes(p.type)) return false;
    if (typeFilter === "certificate" && p.type !== "disposal_certificate") return false;
    if (suspectOnly && !p.isDuplicateReuse) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchBatch = p.batchNumber?.toLowerCase().includes(q);
      const matchMed = p.medicineName?.toLowerCase().includes(q);
      const matchUploader = p.uploaderName?.toLowerCase().includes(q);
      const matchShipment = p.shipmentNumber?.toLowerCase().includes(q);
      if (!matchBatch && !matchMed && !matchUploader && !matchShipment) return false;
    }

    return true;
  });

  const handleVerify = async (proof: InspectionProofItem) => {
    setActionLoading(proof.id);
    const res = await markProofVerified(proof.id);
    setActionLoading(null);
    if (res.success) {
      setProofs(prev => prev.map(p => p.id === proof.id ? { ...p, verificationStatus: 'verified' } : p));
      setStatusMessage({ type: 'success', text: `Proof #${proof.id} marked as inspected & genuine.` });
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleFreezeBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!freezeModalProof || !freezeModalProof.batchId) return;

    setActionLoading(freezeModalProof.id);
    const fd = new FormData();
    fd.set('batchId', freezeModalProof.batchId);
    fd.set('reason', freezeReason || 'Proof forgery/tampering detected in regulatory media inspection.');

    const res = await flagProofFraud(fd);
    setActionLoading(null);
    setFreezeModalProof(null);

    if (res.success) {
      setProofs(prev => prev.map(p => p.batchId === freezeModalProof.batchId ? { ...p, isFrozen: true, verificationStatus: 'suspect' } : p));
      setStatusMessage({ type: 'success', text: `🚨 Batch ${res.batchNumber} has been successfully FROZEN across the entire supply chain!` });
      setTimeout(() => setStatusMessage(null), 5000);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to freeze batch.' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'manufacturer': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'distributor': return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'retailer': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'disposer': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Proof & Media Inspection Center</h1>
            <span className="bg-rose-100 text-rose-800 font-mono text-xs px-2.5 py-0.5 rounded-full font-bold border border-rose-200">
              Surveillance Hub
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Audit all uploaded courier consignment proofs, physical OCG security sheets, pre/post disposal photos, and certificates across Manufacturers, Distributors, Retailers, and Disposers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/host"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            ← Host Overview
          </Link>
          <Link
            href="/host/security"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            View Active Holds
          </Link>
        </div>
      </div>

      {/* ─── STATUS MESSAGE TOAST ─── */}
      {statusMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between shadow-xs ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* ─── KPI METRICS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Total Audited Proofs</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{initialData.stats.totalProofs}</span>
            <span className="text-xs text-slate-400">Media Files</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm ${
          initialData.stats.duplicateSuspectCount > 0 ? 'bg-red-50/70 border-red-200' : 'bg-white border-slate-100'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 block">Suspect / Reused Proofs</span>
            {initialData.stats.duplicateSuspectCount > 0 && (
              <span className="animate-ping w-2 h-2 rounded-full bg-red-500"></span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${
              initialData.stats.duplicateSuspectCount > 0 ? 'text-red-700' : 'text-slate-900'
            }`}>
              {initialData.stats.duplicateSuspectCount}
            </span>
            <span className="text-xs text-slate-500">Duplicate Image Alerts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Active Verified Uploaders</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">{initialData.stats.uniqueUploaders}</span>
            <span className="text-xs text-slate-400">Entities</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-xs font-medium text-slate-500 block">Proofs by Role Breakdown</span>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] font-bold">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              MFR: {initialData.stats.roleBreakdown.manufacturer}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200">
              DIS: {initialData.stats.roleBreakdown.distributor}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              RET: {initialData.stats.roleBreakdown.retailer}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200">
              DSP: {initialData.stats.roleBreakdown.disposer}
            </span>
          </div>
        </div>
      </div>

      {/* ─── FILTER CONTROLS ─── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="w-full md:w-80 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search batch, medicine, uploader, or shipment..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>

          {/* Quick Filter Badges */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => { setRoleFilter('all'); setTypeFilter('all'); setSuspectOnly(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                roleFilter === 'all' && typeFilter === 'all' && !suspectOnly
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Proofs ({proofs.length})
            </button>

            <button
              onClick={() => setSuspectOnly(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                suspectOnly
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              <span>🚨</span>
              <span>Suspect Duplicates ({initialData.stats.duplicateSuspectCount})</span>
            </button>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="manufacturer">Manufacturers</option>
              <option value="distributor">Distributors</option>
              <option value="retailer">Retailers</option>
              <option value="disposer">Disposers</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Proof Types</option>
              <option value="courier_pod">Courier PODs</option>
              <option value="ocg_sheet">OCG Security Sheets</option>
              <option value="disposal">Disposal Proofs</option>
              <option value="certificate">Destruction Certificates</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── MEDIA CARDS GRID ─── */}
      {filteredProofs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            📷
          </div>
          <h3 className="text-base font-bold text-slate-800">No proofs matching criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the role/type filters or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProofs.map((proof) => (
            <div
              key={proof.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between ${
                proof.isDuplicateReuse
                  ? 'border-red-300 ring-2 ring-red-500/20'
                  : proof.isFrozen
                  ? 'border-rose-300 ring-2 ring-rose-500/20'
                  : 'border-slate-200'
              }`}
            >
              {/* Media Header / Image Thumbnail */}
              <div>
                <div className="relative h-48 bg-slate-900 overflow-hidden flex items-center justify-center group">
                  {proof.isVideo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white bg-slate-950 p-4 text-center">
                      <span className="text-4xl mb-2">🎬</span>
                      <span className="text-xs font-bold font-mono">VIDEO AUDIT RECORDING</span>
                      <a
                        href={proof.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium"
                      >
                        Play Video ↗
                      </a>
                    </div>
                  ) : proof.isCertificate ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-emerald-950 bg-emerald-50 p-4 text-center">
                      <span className="text-4xl mb-2">📄</span>
                      <span className="text-xs font-bold uppercase tracking-wider">OFFICIAL CERTIFICATE</span>
                      <a
                        href={proof.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs"
                      >
                        Open Certificate ↗
                      </a>
                    </div>
                  ) : (
                    <>
                      <img
                        src={proof.url}
                        alt={proof.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => setSelectedProof(proof)}
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedProof(proof)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2"
                      >
                        <span>🔍 Click to Zoom & Inspect</span>
                      </button>
                    </>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border shadow-xs ${roleColor(proof.uploaderRole)}`}>
                      {proof.uploaderRole}
                    </span>
                    {proof.isFrozen && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-600 text-white shadow-xs">
                        ❄️ FROZEN HOLD
                      </span>
                    )}
                  </div>

                  {proof.isDuplicateReuse && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-red-600 text-white uppercase tracking-wider shadow-md animate-pulse">
                        ⚠️ SUSPECT DUPLICATE
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{proof.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Uploaded by <strong className="text-slate-800">{proof.uploaderName}</strong>
                    </p>
                  </div>

                  {/* Duplicate Reuse Warning */}
                  {proof.isDuplicateReuse && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 leading-snug font-medium">
                      {proof.fraudAlertMessage}
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Reference:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {proof.shipmentNumber ? `#${proof.shipmentNumber}` : `Record #${proof.entityId.slice(0, 8)}`}
                      </span>
                    </div>
                    {proof.batchNumber && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Batch / Drug:</span>
                        <span className="font-medium text-slate-800 text-right truncate max-w-[180px]">
                          {proof.batchNumber} ({proof.medicineName})
                        </span>
                      </div>
                    )}
                    {proof.ocgCode && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">OCG Security Key:</span>
                        <span className="font-mono font-semibold text-emerald-700 text-right">
                          {proof.ocgCode}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Timestamp:</span>
                      <span className="text-slate-700">
                        {new Date(proof.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="p-4 pt-0 flex items-center gap-2">
                {!proof.isVideo && !proof.isCertificate && (
                  <button
                    type="button"
                    onClick={() => setSelectedProof(proof)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors text-center"
                  >
                    Inspect Full-Res
                  </button>
                )}

                {proof.batchId && !proof.isFrozen && (
                  <button
                    type="button"
                    onClick={() => {
                      setFreezeModalProof(proof);
                      setFreezeReason(`Fraudulent / reused proof photo detected in consignment ${proof.shipmentNumber || proof.entityId.slice(0, 8)}`);
                    }}
                    className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                    title="Freeze associated batch immediately"
                  >
                    <span>🚨</span>
                    <span>Freeze</span>
                  </button>
                )}

                {proof.verificationStatus === 'verified' ? (
                  <span className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-1">
                    <span>✓</span>
                    <span>Verified</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={actionLoading === proof.id}
                    onClick={() => handleVerify(proof)}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
                  >
                    {actionLoading === proof.id ? 'Saving...' : '✓ Pass'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── FULL-RESOLUTION INSPECTION MODAL ─── */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedProof.title}</h3>
                <p className="text-xs text-slate-500">
                  Uploader: <strong className="text-slate-800">{selectedProof.uploaderName}</strong> ({selectedProof.uploaderRole}) · {new Date(selectedProof.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProof(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Image Display */}
            <div className="flex-1 overflow-auto p-6 bg-slate-950 flex items-center justify-center min-h-[360px]">
              <img
                src={selectedProof.url}
                alt={selectedProof.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg border border-slate-800"
              />
            </div>

            {/* Modal Details & Actions Footer */}
            <div className="p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="space-y-1 text-slate-600">
                <div>
                  Batch: <strong className="font-mono text-slate-900">{selectedProof.batchNumber || 'N/A'}</strong> · Medicine: <strong>{selectedProof.medicineName || 'N/A'}</strong>
                </div>
                {selectedProof.ocgCode && (
                  <div>
                    OCG Gatepass Key: <strong className="font-mono text-emerald-700">{selectedProof.ocgCode}</strong>
                  </div>
                )}
                {selectedProof.isDuplicateReuse && (
                  <div className="text-red-600 font-bold">
                    ⚠️ Flagged as duplicate: Reused across {selectedProof.duplicateOccurrences} separate consignments.
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={selectedProof.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-center"
                >
                  Open Original Tab ↗
                </a>
                {selectedProof.batchId && !selectedProof.isFrozen && (
                  <button
                    type="button"
                    onClick={() => {
                      setFreezeModalProof(selectedProof);
                      setFreezeReason(`Fraudulent image detected in inspection: ${selectedProof.title}`);
                      setSelectedProof(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    🚨 Freeze Batch
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FREEZE CONFIRMATION MODAL ─── */}
      {freezeModalProof && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleFreezeBatch} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-red-200">
            <div className="flex items-center gap-3 text-red-700">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-2xl">
                🚨
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Enforce Regulatory Freeze</h3>
                <p className="text-xs text-slate-500">Block all movements for Batch #{freezeModalProof.batchNumber}</p>
              </div>
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
              <p><strong>Warning:</strong> This will place a mandatory hold across all Manufacturers, Distributors, and Retailers.</p>
              <p className="text-slate-600">No shipments or customer sales can be performed for this batch.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Regulatory Freeze:
              </label>
              <textarea
                required
                rows={3}
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Detail the tampering or fraudulent upload detected..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFreezeModalProof(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading === freezeModalProof.id}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {actionLoading === freezeModalProof.id ? 'Applying Freeze...' : 'Confirm Freeze Directive'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
