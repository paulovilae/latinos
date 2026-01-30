"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LanguageToggle } from "./LanguageToggle";
import { LocalizedText } from "./LocalizedText";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  const { data: session } = useSession();
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-semibold text-cyan-300">Investment Bot Platform</p>
        <LocalizedText id="dashboardTitle" fallback="Dashboard" as="h1" className="text-3xl font-bold" />
        <LocalizedText id="dashboardSubtitle" fallback="Orchestrate bots..." as="p" className="text-muted" />
      </div>
      <div className="flex items-center gap-4">
        <LanguageToggle />
        <ThemeToggle />
        {session?.user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
             <div className="hidden md:block text-right">
                <p className="text-xs font-semibold text-white">{session.user.name}</p>
                <p className="text-[10px] text-emerald-400 capitalize">{(session.user as any).role || "User"}</p>
             </div>
             <Link href="/dashboard/profile" className="text-xs text-slate-300 hover:text-white mr-2">
                Profile
             </Link>
             <Link href="/api/auth/signout" className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors">
               Sign Out
             </Link>
          </div>
        )}
      </div>
      <nav className="flex flex-wrap gap-3 text-sm text-muted">
        <Link href="/dashboard" className="hover:text-cyan-300">
           <LocalizedText id="navSignals" fallback="Live Data" />
        </Link>
        
        
        {/* Admin Links */}
        {(session?.user as any)?.role === "admin" && (
          <>
            <Link href="/dashboard/signals" className="hover:text-cyan-300 text-purple-400">
              <LocalizedText id="navSignalsPage" fallback="Signals" />
            </Link>
            <Link href="/dashboard/robots" className="hover:text-cyan-300 text-emerald-400">
              <LocalizedText id="navRobotsPage" fallback="Robots & Backtest" />
            </Link>
            <Link href="/dashboard/users" className="hover:text-cyan-300 text-purple-400">
              <LocalizedText id="navUsers" fallback="Users" />
            </Link>
          </>
        )}

        <Link href="/facturacion" className="hover:text-cyan-300">
          <LocalizedText id="navBilling" fallback="Facturación" />
        </Link>
      </nav>
    </header>
  );
}
