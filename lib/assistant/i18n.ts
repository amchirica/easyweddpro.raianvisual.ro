import type { AssistantLocale, AssistantSurface } from "@/lib/assistant/knowledge/types";
import { getDictionary, translate } from "@/lib/i18n/dictionary";
import type { AppLocale } from "@/lib/i18n/config";

export type AssistantMessages = {
  title: string;
  titleAdmin: string;
  subtitle: string;
  subtitleAdmin: string;
  placeholder: string;
  send: string;
  useful: string;
  openPanel: string;
  thinking: string;
  errorGeneric: string;
  errorAuth: string;
  errorRateLimit: string;
  planMissing: string;
  seePlans: string;
  featureOff: string;
  roleBlocked: string;
  whatCanIDo: string;
  fallback: string;
  readOnlyNote: string;
};

const KEYS: Array<keyof AssistantMessages> = [
  "title",
  "titleAdmin",
  "subtitle",
  "subtitleAdmin",
  "placeholder",
  "send",
  "useful",
  "openPanel",
  "thinking",
  "errorGeneric",
  "errorAuth",
  "errorRateLimit",
  "planMissing",
  "seePlans",
  "featureOff",
  "roleBlocked",
  "whatCanIDo",
  "fallback",
  "readOnlyNote",
];

export function normalizeLocale(value: string | null | undefined): AssistantLocale {
  return value?.toLowerCase().startsWith("en") ? "en" : "ro";
}

export function assistantMessages(locale: AssistantLocale): AssistantMessages {
  const dict = getDictionary(locale as AppLocale);
  const out = {} as AssistantMessages;
  for (const key of KEYS) {
    out[key] = translate(dict, `assistant.${key}`);
  }
  return out;
}

export function assistantTitle(locale: AssistantLocale, surface: AssistantSurface): string {
  const m = assistantMessages(locale);
  return surface === "admin" ? m.titleAdmin : m.title;
}

export function assistantSubtitle(locale: AssistantLocale, surface: AssistantSurface): string {
  const m = assistantMessages(locale);
  return surface === "admin" ? m.subtitleAdmin : m.subtitle;
}
