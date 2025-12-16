import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import en from '../locales/en.json';
import es from '../locales/es.json';

export type Locale = 'en' | 'es';

// Define a more robust type for translations to allow nested structure
export interface Translations {
  [key: string]: string | Translations;
}

const translationsData: Record<Locale, Translations> = { en, es };

interface LanguageContextType {
  language: Locale;
  setLanguage: (language: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedValue = (obj: Translations, path: string): string | undefined => {
  const keys = path.split('.');
  let current: string | Translations | undefined = obj;
  for (const key of keys) {
    if (typeof current !== 'object' || current === null || !current.hasOwnProperty(key)) {
      return undefined;
    }
    current = (current as Translations)[key];
  }
  return typeof current === 'string' ? current : undefined; // Ensure final value is a string
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('appLanguage') as Locale;
      return storedLang && translationsData[storedLang] ? storedLang : 'en';
    }
    return 'en'; // Fallback for SSR or non-browser env
  });

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Locale) => {
    if (translationsData[lang]) {
      setLanguageState(lang);
    }
  }, []);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    let translation = getNestedValue(translationsData[language], key) || getNestedValue(translationsData['en'], key);
    
    if (translation === undefined) {
      console.warn(`Translation key "${key}" not found in language "${language}" or fallback "en".`);
      return key; // Fallback to the key itself
    }

    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = (translation as string).replace(new RegExp(`{{${placeholder}}}`, 'g'), String(value));
      });
    }
    return translation as string;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};