import { getInvoiceById } from "@/app/actions/retailerPricing";
import { getCurrentSession } from "@/app/actions/auth";
import { notFound, redirect } from "next/navigation";
import CustomerBillView from "@/components/CustomerBillView";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function RetailerInvoicePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getCurrentSession();
  if (!session || (session.role !== "retailer" && session.role !== "host")) {
    redirect("/login");
  }

  const invoice = await getInvoiceById(params.id);
  if (!invoice) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/retailer/sell"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Back to POS Workstation</span>
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Retail Receipt #{invoice.invoiceNumber || invoice.id.slice(0, 8)}
        </span>
      </div>

      <CustomerBillView invoice={invoice} />
    </div>
  );
}
