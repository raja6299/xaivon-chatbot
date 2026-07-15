import { createContext, useContext } from 'react';
import { Language, TranslationContextType, Translations } from './types';
import { en } from './locales/en';
import { hi } from './locales/hi';
import { hinglish } from './locales/hinglish';

export const locales: Record<string, Translations> = {
  en,
  hi,
  hinglish
};

export const TranslationContext = createContext<TranslationContextType>({
  language: 'auto',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const useTranslation = () => useContext(TranslationContext);

export function getTranslation(language: Language, key: string): string {
  // If auto, fallback to English for UI strings, though AI handles its own detection.
  const lang = language === 'auto' ? 'en' : language;
  const locale = locales[lang] || locales.en;
  
  const keys = key.split('.');
  let current: unknown = locale;
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  
  return typeof current === 'string' ? current : key;
}
