"use client";

import Link from "next/link";
import { useRetailerLanguage } from "@/context/RetailerLanguageContext";

const NAV_ICONS: Record<string, string> = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  receive: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12',
  sell: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  return: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
};

export function RetailerDesktopNav() {
  const { t } = useRetailerLanguage();

  const navItems = [
    { href: '/retailer', label: t('navDashboard', 'Dashboard'), icon: NAV_ICONS.dashboard },
    { href: '/retailer/receive', label: t('navReceive', 'Receive Stock'), icon: NAV_ICONS.receive },
    { href: '/retailer/sell', label: t('navSell', 'Record Sale'), icon: NAV_ICONS.sell },
    { href: '/retailer/returns/new', label: t('navReturn', 'Return Near-Expiry'), icon: NAV_ICONS.return },
  ];

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navItems.map(n => (
        <Link
          key={n.href}
          href={n.href}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-lg transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={n.icon} />
          </svg>
          {n.label}
        </Link>
      ))}
    </nav>
  );
}

export function RetailerMobileNav() {
  const { t } = useRetailerLanguage();

  const navItems = [
    { href: '/retailer', label: t('navDashboard', 'Dashboard') },
    { href: '/retailer/receive', label: t('navReceive', 'Receive Stock') },
    { href: '/retailer/sell', label: t('navSell', 'Record Sale') },
    { href: '/retailer/returns/new', label: t('navReturn', 'Return Near-Expiry') },
  ];

  return (
    <div className="md:hidden flex overflow-x-auto gap-1 px-4 pb-2">
      {navItems.map(n => (
        <Link
          key={n.href}
          href={n.href}
          className="whitespace-nowrap px-3 py-1.5 text-xs font-medium text-emerald-200 hover:text-white hover:bg-emerald-800/60 rounded-lg transition-all"
        >
          {n.label}
        </Link>
      ))}
    </div>
  );
}

export function RetailerHeaderRole() {
  const { t } = useRetailerLanguage();
  return <span className="text-xs text-emerald-300">{t('retailerRole', 'Retailer')}</span>;
}
