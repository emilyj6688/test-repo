'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppLanguage {
  code: string;       // e.g. 'en-US', 'ar-SA', 'he-IL'
  isoCode: string;    // e.g. 'en', 'ar', 'he'
  name: string;       // e.g. 'English', 'العربية (Arabic)', 'עברית (Hebrew)'
  flag: string;       // e.g. '🇺🇸', '🇸🇦', '🇮🇱'
  isRTL?: boolean;    // true for Right-To-Left languages (Arabic, Hebrew)
}

export const SUPPORTED_LANGUAGES: AppLanguage[] = [
  { code: 'en-US', isoCode: 'en', name: 'English', flag: '🇺🇸', isRTL: false },
  { code: 'ar-SA', isoCode: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦', isRTL: true },
  { code: 'he-IL', isoCode: 'he', name: 'עברית (Hebrew)', flag: '🇮🇱', isRTL: true },
  { code: 'es-ES', isoCode: 'es', name: 'Español', flag: '🇪🇸', isRTL: false },
  { code: 'fr-FR', isoCode: 'fr', name: 'Français', flag: '🇫🇷', isRTL: false },
  { code: 'de-DE', isoCode: 'de', name: 'Deutsch', flag: '🇩🇪', isRTL: false },
  { code: 'it-IT', isoCode: 'it', name: 'Italiano', flag: '🇮🇹', isRTL: false },
  { code: 'pt-PT', isoCode: 'pt', name: 'Português', flag: '🇵🇹', isRTL: false },
  { code: 'ja-JP', isoCode: 'ja', name: '日本語', flag: '🇯🇵', isRTL: false },
  { code: 'ko-KR', isoCode: 'ko', name: '한국어', flag: '🇰🇷', isRTL: false },
  { code: 'zh-CN', isoCode: 'zh', name: '中文', flag: '🇨🇳', isRTL: false },
  { code: 'ru-RU', isoCode: 'ru', name: 'Русский', flag: '🇷🇺', isRTL: false },
  { code: 'nl-NL', isoCode: 'nl', name: 'Nederlands', flag: '🇳🇱', isRTL: false },
  { code: 'sv-SE', isoCode: 'sv', name: 'Svenska', flag: '🇸🇪', isRTL: false },
  { code: 'tr-TR', isoCode: 'tr', name: 'Türkçe', flag: '🇹🇷', isRTL: false },
  { code: 'hi-IN', isoCode: 'hi', name: 'हिन्दी', flag: '🇮🇳', isRTL: false },
];

interface LanguageContextType {
  currentLanguage: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLanguage: SUPPORTED_LANGUAGES[0],
  setLanguage: () => {},
});

const LANG_KEY = 'cinetrack_language_v1';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === 'undefined') return SUPPORTED_LANGUAGES[0];
    try {
      const savedCode = localStorage.getItem(LANG_KEY);
      if (savedCode) {
        const found = SUPPORTED_LANGUAGES.find((l) => l.code === savedCode || l.isoCode === savedCode);
        if (found) return found;
      }
    } catch {
      // fallback
    }
    return SUPPORTED_LANGUAGES[0];
  });

  // Apply Document Direction (dir="rtl" vs dir="ltr") dynamically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dir = currentLanguage.isRTL ? 'rtl' : 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = currentLanguage.isoCode;
    }
  }, [currentLanguage]);

  const setLanguage = (lang: AppLanguage) => {
    setCurrentLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANG_KEY, lang.code);
      window.dispatchEvent(new CustomEvent('cinetrack_language_changed', { detail: lang }));
    }
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
