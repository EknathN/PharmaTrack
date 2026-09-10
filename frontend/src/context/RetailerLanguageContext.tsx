"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { RetailerLanguage, RETAILER_LANGUAGES, TRANSLATIONS } from "@/lib/i18n/retailerTranslations";

interface RetailerLanguageContextType {
  language: RetailerLanguage;
  setLanguage: (lang: RetailerLanguage) => void;
  t: (key: string, defaultText?: string) => string;
  languages: typeof RETAILER_LANGUAGES;
}

const RetailerLanguageContext = createContext<RetailerLanguageContextType | undefined>(undefined);

const STORAGE_KEY = "pharmatrack_retailer_lang";

export function RetailerLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<RetailerLanguage>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as RetailerLanguage;
      if (savedLang && TRANSLATIONS[savedLang]) {
        setLanguageState(savedLang);
      }
    } catch (e) {
      // Ignore if localStorage is inaccessible
    }
    setMounted(true);
  }, []);

  const setLanguage = (newLang: RetailerLanguage) => {
    if (!TRANSLATIONS[newLang]) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      // Also write cookie so server can read it if needed
      document.cookie = `${STORAGE_KEY}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {}
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const enDict = TRANSLATIONS.en;
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return defaultText || key;
  };

  return (
    <RetailerLanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: RETAILER_LANGUAGES,
      }}
    >
      {children}
    </RetailerLanguageContext.Provider>
  );
}

export function useRetailerLanguage() {
  const context = useContext(RetailerLanguageContext);
  if (!context) {
    // Fallback if rendered outside provider to avoid crashes
    return {
      language: "en" as RetailerLanguage,
      setLanguage: () => {},
      t: (key: string, defaultText?: string) => TRANSLATIONS.en[key] || defaultText || key,
      languages: RETAILER_LANGUAGES,
    };
  }
  return context;
}
