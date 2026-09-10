import { redirect } from "next/navigation";
import { getCurrentSession } from "@/app/actions/auth";

// The /dashboard route redirects to the role-specific portal
// Middleware handles this, but as a fallback:
export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  redirect(`/${session.role}`);
}
