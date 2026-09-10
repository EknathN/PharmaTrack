import { getDisposalForCertificate } from "@/app/actions/shipments";
import { getCurrentSession } from "@/app/actions/auth";
import { notFound, redirect } from "next/navigation";
import DisposalCertificatePrintView from "./DisposalCertificatePrintView";

export const dynamic = "force-dynamic";

export default async function DisposalCertificatePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getDisposalForCertificate(params.id);
  if (!data || !data.disposal) {
    notFound();
  }

  return (
    <DisposalCertificatePrintView
      disposal={data.disposal}
      batch={data.batch}
      shipment={data.shipment}
      disposerUser={data.disposerUser}
      manufacturerUser={data.manufacturerUser}
      certificateQr={data.certificateQr}
      qrVerificationText={data.qrVerificationText}
      sessionRole={session.role}
    />
  );
}
