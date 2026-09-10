import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, logoutUser } from "@/app/actions/auth";

const NAV = [
  { href: '/distributor', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/distributor/receive', label: 'Receive Stock', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14' },
  { href: '/distributor/shipments/new', label: 'Ship to Retailer', icon: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' },
  { href: '/distributor/returns', label: 'Returns', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
];

export default async function DistributorLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'distributor') redirect('/login');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-violet-900/95 backdrop-blur-md border-b border-violet-800 shadow-lg">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500 text-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </div>
            <div>
              <span className="text-white font-bold text-sm">PharmaTrack</span>
              <span className="ml-2 text-xs text-violet-300 font-medium px-2 py-0.5 bg-violet-800/60 rounded-full">Distributor</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-violet-200 hover:text-white hover:bg-violet-800/60 rounded-lg transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={n.icon}/></svg>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{session.name}</div>
              <div className="text-xs text-violet-300">Distributor</div>
            </div>
            <form action={async () => { "use server"; await logoutUser(); redirect('/login'); }}>
              <button type="submit" className="p-2 text-violet-300 hover:text-white transition-colors" title="Logout">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </form>
          </div>
        </div>
        <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
          {NAV.map(n => <Link key={n.href} href={n.href} className="whitespace-nowrap px-3 py-1.5 text-xs font-medium text-violet-200 hover:text-white hover:bg-violet-800/60 rounded-lg">{n.label}</Link>)}
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
