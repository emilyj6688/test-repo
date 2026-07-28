'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AppLanguage {
  code: string;       // e.g. 'en-US', 'es-ES', 'fr-FR'
  isoCode: string;    // e.g. 'en', 'es', 'fr'
  name: string;       // e.g. 'English', 'Español'
  flag: string;       // e.g. '🇺🇸', '🇪🇸'
}

export const SUPPORTED_LANGUAGES: AppLanguage[] = [
  { code: 'en-US', isoCode: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es-ES', isoCode: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', isoCode: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', isoCode: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it-IT', isoCode: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja-JP', isoCode: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', isoCode: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh-CN', isoCode: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'pt-BR', isoCode: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'ru-RU', isoCode: 'ru', name: 'Русский', flag: '🇷🇺' },
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
