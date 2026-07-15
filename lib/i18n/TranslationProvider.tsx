"use client";

import React, { useState, useEffect } from 'react';
import { TranslationContext, getTranslation } from './index';
import { Language } from './types';

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('auto');

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem('xaivon_language') as Language;
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('xaivon_language', lang);
  };

  const t = (key: string) => getTranslation(language, key);

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}
