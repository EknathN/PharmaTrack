import { getCurrentSession } from "@/app/actions/auth";
import { getRetailerPosInventory, getRetailerPrices, getRetailerInvoices } from "@/app/actions/retailerPricing";
import { redirect } from "next/navigation";
import RetailerSellClient from "./RetailerSellClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RetailerSellPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "retailer") {
    redirect("/login");
  }

  const inventory = await getRetailerPosInventory();
  const prices = await getRetailerPrices();
  const invoices = await getRetailerInvoices();

  return (
    <RetailerSellClient
      initialInventory={inventory as any}
      initialPrices={prices}
      initialInvoices={invoices}
      retailerName={session.name || "City Care Pharmacy"}
    />
  );
}
