import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/app/actions/auth';
import { getProofInspections } from '@/app/actions/inspections';
import ProofInspectionsClient from './ProofInspectionsClient';

export const metadata = {
  title: 'Proof & Media Inspection Center | PharmaTrack Regulatory Host',
  description: 'National regulatory surveillance hub to inspect POD, OCG gatepasses, and disposal media across all supply chain tiers.',
};

export default async function HostProofInspectionsPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'host') {
    redirect('/auth/login');
  }

  const initialData = await getProofInspections();
  const fallbackData = initialData || {
    proofs: [],
    stats: {
      totalProofs: 0,
      uniqueUploaders: 0,
      duplicateSuspectCount: 0,
      roleBreakdown: { manufacturer: 0, distributor: 0, retailer: 0, disposer: 0 }
    }
  };

  return <ProofInspectionsClient initialData={fallbackData} />;
}
