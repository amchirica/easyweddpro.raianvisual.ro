"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  type AppLocale,
} from "@/lib/i18n/config";
import {
  getDictionary,
  getMessageNode,
  translate,
  translateList,
  type MessageTree,
} from "@/lib/i18n/dictionary";

type I18nContextValue = {
  locale: AppLocale;
  dict: MessageTree;
  t: (key: string, params?: Record<string, string | number>) => string;
  ta: (key: string) => string[];
  tm: <T = unknown>(key: string) => T | undefined;
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

  // Sync after soft locale switch + router.refresh() when server prop changes without remount.
  useEffect(() => {
    const next = initialLocale || DEFAULT_LOCALE;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional SSR locale sync
    setLocaleState(next);
    document.documentElement.lang = next;
  }, [initialLocale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(dict, key, params),
    [dict],
  );
  const ta = useCallback((key: string) => translateList(dict, key), [dict]);
  const tm = useCallback(
    <T = unknown>(key: string) => getMessageNode(dict, key) as T | undefined,
    [dict],
  );

  const setLocale = useCallback((next: AppLocale) => {
    persistLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo(
    () => ({ locale, dict, t, ta, tm, setLocale }),
    [locale, dict, t, ta, tm, setLocale],
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
