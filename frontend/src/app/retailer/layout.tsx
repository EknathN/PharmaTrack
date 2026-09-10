import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession, logoutUser } from "@/app/actions/auth";
import { RetailerLanguageProvider } from "@/context/RetailerLanguageContext";
import RetailerLanguageSelector from "@/components/RetailerLanguageSelector";
import { RetailerDesktopNav, RetailerMobileNav, RetailerHeaderRole } from "@/components/RetailerNav";
import AiDashboardChatbot from "@/components/AiDashboardChatbot";

export default async function RetailerLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session || session.role !== 'retailer') redirect('/login');

  return (
    <RetailerLanguageProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="sticky top-0 z-40 w-full bg-emerald-900/95 backdrop-blur-md border-b border-emerald-800 shadow-lg">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/retailer" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <div>
                  <span className="text-white font-bold text-sm">PharmaTrack</span>
                  <span className="ml-2 text-xs text-emerald-300 font-medium px-2 py-0.5 bg-emerald-800/60 rounded-full border border-emerald-700/50">
                    Retailer
                  </span>
                </div>
              </Link>
            </div>

            {/* Localized Desktop Nav */}
            <RetailerDesktopNav />

            {/* Right Area: Language Selector + Profile + Logout */}
            <div className="flex items-center gap-3">
              {/* Language Selector Dropdown */}
              <RetailerLanguageSelector />

              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white">{session.name}</div>
                <RetailerHeaderRole />
              </div>

              <form action={async () => { "use server"; await logoutUser(); redirect('/login'); }}>
                <button
                  type="submit"
                  className="p-2 text-emerald-300 hover:text-white hover:bg-emerald-800/60 rounded-lg transition-colors"
                  title="Logout"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>

          {/* Localized Mobile Nav */}
          <RetailerMobileNav />
        </header>

        <main className="flex-1 container mx-auto p-4 md:p-6">{children}</main>
        <AiDashboardChatbot />
      </div>
    </RetailerLanguageProvider>
  );
}
