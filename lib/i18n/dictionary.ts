import type { AppLocale } from "@/lib/i18n/config";

import commonRo from "@/messages/ro/common.json";
import navRo from "@/messages/ro/nav.json";
import authRo from "@/messages/ro/auth.json";
import dashboardRo from "@/messages/ro/dashboard.json";
import adminRo from "@/messages/ro/admin.json";
import assistantRo from "@/messages/ro/assistant.json";
import searchRo from "@/messages/ro/search.json";
import themeRo from "@/messages/ro/theme.json";
import portalRo from "@/messages/ro/portal.json";
import billingRo from "@/messages/ro/billing.json";
import validationRo from "@/messages/ro/validation.json";
import toastsRo from "@/messages/ro/toasts.json";
import modulesRo from "@/messages/ro/modules.json";
import statusRo from "@/messages/ro/status.json";
import marketingRo from "@/messages/ro/marketing.json";
import settingsRo from "@/messages/ro/settings.json";

import commonEn from "@/messages/en/common.json";
import navEn from "@/messages/en/nav.json";
import authEn from "@/messages/en/auth.json";
import dashboardEn from "@/messages/en/dashboard.json";
import adminEn from "@/messages/en/admin.json";
import assistantEn from "@/messages/en/assistant.json";
import searchEn from "@/messages/en/search.json";
import themeEn from "@/messages/en/theme.json";
import portalEn from "@/messages/en/portal.json";
import billingEn from "@/messages/en/billing.json";
import validationEn from "@/messages/en/validation.json";
import toastsEn from "@/messages/en/toasts.json";
import modulesEn from "@/messages/en/modules.json";
import statusEn from "@/messages/en/status.json";
import marketingEn from "@/messages/en/marketing.json";
import settingsEn from "@/messages/en/settings.json";

export type MessageTree = Record<string, unknown>;

const dictionaries: Record<AppLocale, MessageTree> = {
  ro: {
    common: commonRo,
    nav: navRo,
    auth: authRo,
    dashboard: dashboardRo,
    admin: adminRo,
    assistant: assistantRo,
    search: searchRo,
    theme: themeRo,
    portal: portalRo,
    billing: billingRo,
    validation: validationRo,
    toasts: toastsRo,
    modules: modulesRo,
    status: statusRo,
    marketing: marketingRo,
    settings: settingsRo,
  },
  en: {
    common: commonEn,
    nav: navEn,
    auth: authEn,
    dashboard: dashboardEn,
    admin: adminEn,
    assistant: assistantEn,
    search: searchEn,
    theme: themeEn,
    portal: portalEn,
    billing: billingEn,
    validation: validationEn,
    toasts: toastsEn,
    modules: modulesEn,
    status: statusEn,
    marketing: marketingEn,
    settings: settingsEn,
  },
};

export function getDictionary(locale: AppLocale): MessageTree {
  return dictionaries[locale] ?? dictionaries.ro;
}

export function getMessageNode(dict: MessageTree, key: string): unknown {
  const parts = key.split(".");
  let cur: unknown = dict;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in (cur as object)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

export function translate(
  dict: MessageTree,
  key: string,
  params?: Record<string, string | number>,
): string {
  const node = getMessageNode(dict, key);
  if (typeof node !== "string") return key;
  if (!params) return node;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    node,
  );
}

export function translateList(dict: MessageTree, key: string): string[] {
  const node = getMessageNode(dict, key);
  if (!Array.isArray(node)) return [];
  return node.filter((item): item is string => typeof item === "string");
}
