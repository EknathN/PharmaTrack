import { getRetailerInventory, checkExpiryAlerts, getAllShipments } from "@/app/actions/shipments";
import { getCurrentSession } from "@/app/actions/auth";
import { getSmartRestockRecommendations } from "@/app/actions/restock";
import { redirect } from "next/navigation";
import { readDb } from "@/lib/db";
import RetailerDashboardView from "./RetailerDashboardView";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RetailerDashboard() {
  const session = await getCurrentSession();
  if (!session || session.role !== 'retailer') redirect('/login');

  // Run expiry check on every dashboard load
  await checkExpiryAlerts();

  const inventory = await getRetailerInventory();
  const db = await readDb();
  const alerts = db.alerts
    .filter(a => a.userId === session.sub && !a.isRead)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const allUserShipments = await getAllShipments();
  const incomingShipments = allUserShipments.filter((s: any) => s.toId === session.sub && s.status === 'in_transit');
  const returnShipments = allUserShipments.filter((s: any) => s.fromId === session.sub && s.type === 'return');

  const nearExpiry = inventory.filter((i: any) => i.daysToExpiry !== null && i.daysToExpiry <= 60 && i.daysToExpiry >= 0);
  const totalUnits = inventory.reduce((sum: number, i: any) => sum + i.quantity, 0);

  // Fetch predictive smart restock recommendations based on sales velocity
  const smartRestockRecommendations = await getSmartRestockRecommendations(14);

  return (
    <RetailerDashboardView
      inventory={inventory}
      alerts={alerts}
      incomingShipments={incomingShipments}
      returnShipments={returnShipments}
      nearExpiry={nearExpiry}
      totalUnits={totalUnits}
      smartRestockRecommendations={smartRestockRecommendations}
    />
  );
}

