import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

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
            {children}
        </AppProviders>
      </body>
    </html>
  );
}
