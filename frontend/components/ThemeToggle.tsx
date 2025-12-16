"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const label = theme === "dark" ? "☾" : "☀";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full border border-slate-700 flex items-center justify-center text-lg"
      aria-label="Toggle theme"
    >
      {label}
    </button>
  );
}
