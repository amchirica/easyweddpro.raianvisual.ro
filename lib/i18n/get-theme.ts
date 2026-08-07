import { cookies } from "next/headers";

import {
  DEFAULT_THEME,
  THEME_COOKIE,
  normalizeTheme,
  type AppTheme,
} from "@/lib/i18n/config";

export async function getRequestTheme(): Promise<AppTheme> {
  try {
    const jar = await cookies();
    return normalizeTheme(jar.get(THEME_COOKIE)?.value ?? DEFAULT_THEME);
  } catch {
    return DEFAULT_THEME;
  }
}

/** Inline script: apply theme class before paint to avoid flash. */
export function themeAntiFlashScript(theme: AppTheme): string {
  return `(function(){try{var t=${JSON.stringify(theme)};var d=document.documentElement;var s=localStorage.getItem('ewp-theme');if(s==='light'||s==='dark'||s==='system'){t=s;}if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}d.classList.remove('light','dark');d.classList.add(t==='light'?'light':'dark');}catch(e){document.documentElement.classList.add('dark');}})();`;
}
