"use client";

import { ReactNode } from "react";

import { LocalizationProvider } from "./LocalizationProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocalizationProvider>{children}</LocalizationProvider>
    </ThemeProvider>
  );
}
