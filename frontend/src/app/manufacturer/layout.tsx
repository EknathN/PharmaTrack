import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, logoutUser } from "@/app/actions/auth";
import AiDashboardChatbot from "@/components/AiDashboardChatbot";

const NAV = [
  { href: '/manufacturer', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/manufacturer/batches/new', label: 'Add New Batch', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
  { href: '/manufacturer/shipments/new', label: 'Ship Stock', icon: 'M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4' },
  { href: '/manufacturer/returns', label: 'Returns', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
  { href: '/manufacturer/disposal/new', label: 'Send to Disposal', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
];

export default async function ManufacturerLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'manufacturer') redirect('/login');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-blue-900/95 backdrop-blur-md border-b border-blue-800 shadow-lg">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
            </div>
            <div>
              <span className="text-white font-bold text-sm">PharmaTrack</span>
              <span className="ml-2 text-xs text-blue-300 font-medium px-2 py-0.5 bg-blue-800/60 rounded-full">Manufacturer</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(n => (
              <Link key={n.href} href={n.href} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-200 hover:text-white hover:bg-blue-800/60 rounded-lg transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={n.icon}/></svg>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{session.name}</div>
              <div className="text-xs text-blue-300">Manufacturer</div>
            </div>
            <form action={async () => { "use server"; await logoutUser(); redirect('/login'); }}>
              <button type="submit" className="p-2 text-blue-300 hover:text-white transition-colors" title="Logout">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              </button>
            </form>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap px-3 py-1.5 text-xs font-medium text-blue-200 hover:text-white hover:bg-blue-800/60 rounded-lg transition-all">
              {n.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 md:p-6">{children}</main>
      <AiDashboardChatbot />
    </div>
  );
}
