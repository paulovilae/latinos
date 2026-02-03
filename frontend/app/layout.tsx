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
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen">
        <AppProviders>
            {children}
        </AppProviders>
      </body>
    </html>
  );
}
