import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  normalizeLocale,
  type AppLocale,
} from "@/lib/i18n/config";

export async function getRequestLocale(): Promise<AppLocale> {
  try {
    const jar = await cookies();
    return normalizeLocale(jar.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE);
  } catch {
    return DEFAULT_LOCALE;
  }
}
