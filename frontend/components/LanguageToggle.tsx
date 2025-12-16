"use client";

import { useLocale } from "./LocalizationProvider";

export function LanguageToggle() {
  const { language, setLanguage } = useLocale();

  return (
    <div className="flex rounded-full border border-slate-700 overflow-hidden">
      {(["en", "es"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          className={`px-3 py-1 text-xs font-semibold ${
            language === lang ? "bg-cyan-500 text-slate-900" : "bg-transparent text-muted"
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
