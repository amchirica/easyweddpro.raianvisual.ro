"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

import { I18nProvider } from "@/components/providers/i18n-provider";
import type { AppLocale, AppTheme } from "@/lib/i18n/config";

export function AppProviders({
  children,
  locale,
  theme,
}: {
  children: ReactNode;
  locale: AppLocale;
  theme: AppTheme;
}) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={theme}
      enableSystem
      disableTransitionOnChange
      storageKey="ewp-theme"
    >
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </NextThemesProvider>
  );
}
