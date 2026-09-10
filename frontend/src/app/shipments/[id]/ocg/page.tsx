import { getShipmentForMandate } from "@/app/actions/shipments";
import { getCurrentSession } from "@/app/actions/auth";
import { notFound, redirect } from "next/navigation";
import OcgSheetPrintView from "./OcgSheetPrintView";

export const dynamic = "force-dynamic";

export default async function ShipmentOcgPage({
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
    <OcgSheetPrintView
      shipment={data.shipment}
      batch={data.batch}
      fromUser={data.fromUser}
      toUser={data.toUser}
      sessionRole={session.role}
    />
  );
}
