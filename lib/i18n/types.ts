export type Language = 'auto' | 'en' | 'hi' | 'hinglish';

export interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export interface Translations {
  [key: string]: string | Translations;
}
