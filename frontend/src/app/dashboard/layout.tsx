import { redirect } from "next/navigation";
import { getCurrentSession } from "@/app/actions/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect('/login');
  redirect(`/${session.role}`);
}
