"use client";

import { LanguageToggle } from "./LanguageToggle";
import { LocalizedText } from "./LocalizedText";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-sm font-semibold text-cyan-300">Investment Bot Platform</p>
        <LocalizedText id="dashboardTitle" fallback="Dashboard" as="h1" className="text-3xl font-bold" />
        <LocalizedText id="dashboardSubtitle" fallback="Orchestrate bots..." as="p" className="text-muted" />
      </div>
      <div className="flex items-center gap-3">
        <LanguageToggle />
        <ThemeToggle />
      </div>
      <nav className="flex flex-wrap gap-3 text-sm text-muted">
        <a href="#bots" className="hover:text-cyan-300">
          <LocalizedText id="navBots" fallback="Bots" />
        </a>
        <a href="#users" className="hover:text-cyan-300">
          <LocalizedText id="navUsers" fallback="Users" />
        </a>
        <a href="#formulas" className="hover:text-cyan-300">
          <LocalizedText id="navFormulas" fallback="Formulas" />
        </a>
        <a href="#signals" className="hover:text-cyan-300">
          <LocalizedText id="navSignals" fallback="Signals" />
        </a>
        <a href="#backtests" className="hover:text-cyan-300">
          <LocalizedText id="navBacktests" fallback="Backtests" />
        </a>
        <a href="#billing" className="hover:text-cyan-300">
          <LocalizedText id="navBilling" fallback="Billing" />
        </a>
      </nav>
    </header>
  );
}
