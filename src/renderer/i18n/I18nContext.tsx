/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from "react";
import { translations, type Language, type TranslationKey } from "./translations";

interface I18nValue {
  language: Language;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ language, children }: PropsWithChildren<{ language: Language }>) {
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo<I18nValue>(() => ({
    language,
    t: (key, values) => {
      let text: string = translations[language][key];
      for (const [name, value] of Object.entries(values ?? {})) text = text.replace(`{${name}}`, String(value));
      return text;
    },
  }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error("I18nProvider is missing");
  return value;
}
