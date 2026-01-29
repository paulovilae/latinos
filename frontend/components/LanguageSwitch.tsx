"use client";

import { useLocale } from "./LocalizationProvider";

export function LanguageSwitch() {
  const { language, setLanguage } = useLocale();

  return (
    <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
          language === "en"
            ? "bg-slate-600 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("es")}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
          language === "es"
            ? "bg-emerald-600 text-white shadow-sm"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        ES
      </button>
    </div>
  );
}
