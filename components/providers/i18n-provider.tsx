"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type AppLocale,
} from "@/lib/i18n/config";
import { getDictionary, translate, type MessageTree } from "@/lib/i18n/dictionary";

type I18nContextValue = {
  locale: AppLocale;
  dict: MessageTree;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: AppLocale) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function persistLocale(locale: AppLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
  document.documentElement.lang = locale;
}

export function I18nProvider({
  locale: initialLocale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<AppLocale>(initialLocale || DEFAULT_LOCALE);
  const dict = useMemo(() => getDictionary(locale), [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(dict, key, params),
    [dict],
  );

  const setLocale = useCallback((next: AppLocale) => {
    persistLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({ locale, dict, t, setLocale }),
    [locale, dict, t, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export function useOptionalI18n(): I18nContextValue | null {
  return useContext(I18nContext);
}
