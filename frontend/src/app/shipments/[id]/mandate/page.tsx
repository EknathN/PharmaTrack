import { getShipmentForMandate } from "@/app/actions/shipments";
import { getCurrentSession } from "@/app/actions/auth";
import { notFound, redirect } from "next/navigation";
import MandatePrintView from "./MandatePrintView";

export const dynamic = "force-dynamic";

export default async function ShipmentMandatePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const data = await getShipmentForMandate(params.id);
  if (!data || !data.shipment) {
    notFound();
  }

  return (
    <MandatePrintView
      shipment={data.shipment}
      batch={data.batch}
      fromUser={data.fromUser}
      toUser={data.toUser}
      sessionRole={session.role}
    />
  );
}
