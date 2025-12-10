import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investment Bot Platform",
  description: "Manage algorithmic trading bots, formulas, backtests, and billing",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-cyan-300">Investment Bot Platform</p>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted">Orchestrate bots, formulas, signals, backtests, and billing.</p>
            </div>
            <nav className="flex gap-3 text-sm text-muted">
              <a href="#bots" className="hover:text-cyan-300">Bots</a>
              <a href="#formulas" className="hover:text-cyan-300">Formulas</a>
              <a href="#signals" className="hover:text-cyan-300">Signals</a>
              <a href="#backtests" className="hover:text-cyan-300">Backtests</a>
              <a href="#billing" className="hover:text-cyan-300">Billing</a>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
