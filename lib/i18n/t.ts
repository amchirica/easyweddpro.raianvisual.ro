import "server-only";

import { getDictionary, translate } from "@/lib/i18n/dictionary";
import { getRequestLocale } from "@/lib/i18n/get-locale";
import type { AppLocale } from "@/lib/i18n/config";

export async function getTranslator(locale?: AppLocale) {
  const resolved = locale ?? (await getRequestLocale());
  const dict = getDictionary(resolved);
  return {
    locale: resolved,
    t: (key: string, params?: Record<string, string | number>) =>
      translate(dict, key, params),
  };
}
