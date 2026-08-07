import type { GlossaryEntry } from "@/lib/assistant/knowledge/types";

export const GLOSSARY: GlossaryEntry[] = [
  {
    key: "portal",
    term: "Portal client",
    termEn: "Client portal",
    definition:
      "Pagină publică pe link unic unde clientul vede ofertă, contract, plăți și documente — fără cont obligatoriu.",
    definitionEn:
      "Public page on a unique link where the client sees proposal, contract, payments, and documents — no required account.",
    keywords: ["portal", "client", "link public", "token"],
  },
  {
    key: "draft",
    term: "Draft (contract)",
    termEn: "Draft (contract)",
    definition:
      "Stare editabilă a contractului. Poți modifica conținutul pe pagina de editare. După publicare, schimbările se fac prin versiune nouă.",
    definitionEn:
      "Editable contract state. Edit on the edit page. After publish, changes go through a new version.",
    keywords: ["draft", "editare", "contract"],
  },
  {
    key: "trigger",
    term: "Trigger",
    termEn: "Trigger",
    definition:
      "Eveniment care pornește o automatizare (ex. lead nou, ofertă nevizualizată, contract trimis).",
    definitionEn:
      "Event that starts an automation (e.g. new lead, unviewed proposal, contract sent).",
    keywords: ["trigger", "automatizare", "eveniment"],
  },
  {
    key: "cron",
    term: "Cron",
    termEn: "Cron",
    definition:
      "Programare pe Cloudflare Workers care rulează job-uri de fundal (automatizări, remindere) — de obicei orar.",
    definitionEn:
      "Cloudflare Workers schedule that runs background jobs (automations, reminders) — usually hourly.",
    keywords: ["cron", "schedule", "job"],
  },
  {
    key: "webhook",
    term: "Webhook",
    termEn: "Webhook",
    definition:
      "Apel HTTP de la un serviciu extern (ex. Stripe) către aplicație, verificat cu semnătură. Nu expune secretele.",
    definitionEn:
      "HTTP call from an external service (e.g. Stripe) into the app, verified with a signature. Never expose secrets.",
    keywords: ["webhook", "stripe", "endpoint"],
  },
  {
    key: "inspect",
    term: "Inspect (admin)",
    termEn: "Inspect (admin)",
    definition:
      "Mod read-only în admin pentru a vedea un workspace fără a-l trata ca pe propriul tău tenant de lucru.",
    definitionEn:
      "Read-only admin mode to view a workspace without treating it as your own working tenant.",
    keywords: ["inspect", "read-only", "admin"],
  },
];
