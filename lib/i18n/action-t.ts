import { getDictionary, translate } from "@/lib/i18n/dictionary";
import type { AppLocale } from "@/lib/i18n/config";

/** Translate action/toast messages on the server. */
export function tAction(
  locale: AppLocale,
  key: string,
  params?: Record<string, string | number>,
): string {
  return translate(getDictionary(locale), key, params);
}
