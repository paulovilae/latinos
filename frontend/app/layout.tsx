import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

import { AppHeader } from "@/components/AppHeader";
import { AppProviders } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Investment Bot Platform",
  description: "Manage algorithmic trading bots, formulas, backtests, and billing",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="theme-dark">
      <body className="min-h-screen">
        <AppProviders>
          <div className="max-w-screen-2xl w-full mx-auto px-6 lg:px-10 py-8 space-y-10">
            <AppHeader />
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
