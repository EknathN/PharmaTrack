"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { finalizeDisposal, getDisposerDashboard } from "@/app/actions/shipments";
import ProofUpload from "@/components/ProofUpload";

export default function DisposePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [photoBeforeUrl, setPhotoBeforeUrl] = useState('');
  const [photoAfterUrl, setPhotoAfterUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [certificateUrl, setCertificateUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    getDisposerDashboard().then(data => {
      if (data) {
        const found = data.disposalRecords.find((d: any) => d.id === params.id);
        setRecord(found);
      }
    });
  }, [params.id]);

  const handleFinalize = async () => {
    if (!photoBeforeUrl || !photoAfterUrl || !videoUrl || !certificateUrl) {
      setError('All four files are required: photo before, photo after, video (min 30 seconds), and disposal certificate.'); return;
    }
    setIsSubmitting(true); setError('');
    const fd = new FormData();
    fd.set('disposalId', params.id);
    fd.set('photoBeforeUrl', photoBeforeUrl);
    fd.set('photoAfterUrl', photoAfterUrl);
    fd.set('videoUrl', videoUrl);
    fd.set('certificateUrl', certificateUrl);
    const res = await finalizeDisposal(fd);
    setIsSubmitting(false);
    if (res.success) setDone(true);
    else setError(res.error || 'Failed.');
  };

  if (done) return (
    <div className="max-w-xl mx-auto text-center py-16">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Disposal Complete!</h2>
      <p className="text-slate-500 mt-2">The batch has been marked as <strong>Fully Disposed</strong>. The Manufacturer has been notified and can now view all proofs and the certificate.</p>
      <button onClick={() => router.push('/disposer')} className="mt-6 px-6 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700">Back to Dashboard</button>
    </div>
  );

  if (!record) return (
    <div className="text-center py-20 text-slate-400">Loading disposal record...</div>
  );

  if (record.status === 'completed') return (
    <div className="max-w-xl mx-auto text-center py-16">
      <h2 className="text-2xl font-bold text-slate-900">Already Completed</h2>
      <p className="text-slate-500 mt-2">This disposal has already been finalized.</p>
      <button onClick={() => router.push('/disposer')} className="mt-6 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-medium">Back to Dashboard</button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Complete Disposal</h1>
        <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="font-semibold text-orange-900">{record.batch?.medicineName}</p>
          <p className="text-sm text-orange-700">Batch: {record.batch?.batchNumber} · Mfr: {record.batch?.manufacturerName}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <strong>⚠️ All four uploads are mandatory.</strong> The Manufacturer will be able to see and download all proofs and the certificate once submitted.
        </div>

        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm font-medium">{error}</div>}

        <ProofUpload
          label="1. Photo BEFORE Disposal"
          accept="image/*"
          required
          onUploaded={setPhotoBeforeUrl}
          hint="Clear photo of all medicine packages before disposal begins."
        />
        <ProofUpload
          label="2. Photo AFTER Disposal"
          accept="image/*"
          required
          onUploaded={setPhotoAfterUrl}
          hint="Clear photo showing the medicines after disposal/destruction."
        />
        <ProofUpload
          label="3. Video of Disposal Process (Minimum 30 seconds)"
          accept="video/*"
          required
          onUploaded={setVideoUrl}
          hint="Video recording of the actual disposal process. Must be at least 30 seconds."
        />
        <ProofUpload
          label="4. Official Disposal Certificate (PDF or Image)"
          accept="image/*,.pdf"
          required
          onUploaded={setCertificateUrl}
          hint="Official signed disposal certificate from your organization."
        />

        <div className="pt-2">
          <button
            onClick={handleFinalize}
            disabled={isSubmitting || !photoBeforeUrl || !photoAfterUrl || !videoUrl || !certificateUrl}
            className="w-full py-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20 disabled:opacity-40 text-base"
          >
            {isSubmitting ? 'Submitting Proofs...' : '✓ Confirm Disposal Complete — Mark as Fully Disposed'}
          </button>
          <p className="text-xs text-center text-slate-500 mt-2">This action is irreversible. The batch will be permanently marked as Fully Disposed.</p>
        </div>
      </div>
    </div>
  );
}
