import { Suspense } from 'react';
import { getPublicSampleBatches } from '@/app/actions/verify';
import PublicScannerClient from './PublicScannerClient';

export const metadata = {
  title: 'Public QR Box Scanner & Drug Authenticator | PharmaTrack Pro',
  description: 'National public pharmaceutical verification portal. Scan any medicine box QR code to verify authenticity, active status, manufacturer provenance, and full custody timeline.',
};

export default async function VerifyPage() {
  const initialSamples = await getPublicSampleBatches();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Loading Public Drug Scanner...</p>
        </div>
      </div>
    }>
      <PublicScannerClient initialSamples={initialSamples} />
    </Suspense>
  );
}
