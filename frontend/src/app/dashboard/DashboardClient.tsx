import { redirect } from "next/navigation";
import { getCurrentSession } from "@/app/actions/auth";

// Now this is just a redirect stub — real client component was removed
export default async function DashboardClient() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  redirect(`/${session.role}`);
}
