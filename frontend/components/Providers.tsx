"use client";

import { ReactNode } from "react";

import { SessionProvider } from "next-auth/react";
import { LocalizationProvider } from "./LocalizationProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LocalizationProvider>{children}</LocalizationProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
