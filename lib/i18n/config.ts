export const LOCALES = ["ro", "en"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "ro";
export const LOCALE_COOKIE = "ewp_locale";
export const THEME_COOKIE = "ewp_theme";

export const THEMES = ["dark", "light", "system"] as const;
export type AppTheme = (typeof THEMES)[number];
export const DEFAULT_THEME: AppTheme = "dark";

export function normalizeLocale(value: string | null | undefined): AppLocale {
  if (!value) return DEFAULT_LOCALE;
  const v = value.toLowerCase().slice(0, 2);
  return v === "en" ? "en" : "ro";
}

export function normalizeTheme(value: string | null | undefined): AppTheme {
  if (value === "light" || value === "system" || value === "dark") return value;
  return DEFAULT_THEME;
}
