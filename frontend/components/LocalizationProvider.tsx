"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Language, TranslationKey, getTranslation } from "@/lib/i18n";

type LocalizationContextValue = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, fallback: string) => string;
};

const LocalizationContext = createContext<LocalizationContextValue | undefined>(undefined);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("es");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("latinos-lang") as Language | null) : null;
    if (stored) {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("latinos-lang", lang);
    }
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey, fallback: string) => getTranslation(key, language, fallback),
    }),
    [language, setLanguage],
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocalizationContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocalizationProvider");
  }
  return ctx;
}
