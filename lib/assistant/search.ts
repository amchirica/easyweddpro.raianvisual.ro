import { ADMIN_MODULES } from "@/lib/assistant/knowledge/admin";
import { DASHBOARD_MODULES } from "@/lib/assistant/knowledge/dashboard";
import { enrichKnowledgeModules } from "@/lib/assistant/knowledge/enrich";
import { GLOSSARY } from "@/lib/assistant/knowledge/glossary";
import { ROLE_GUIDES } from "@/lib/assistant/knowledge/roles";
import type {
  AssistantLocale,
  AssistantSurface,
  GlossaryEntry,
  KnowledgeModule,
  RoleGuide,
} from "@/lib/assistant/knowledge/types";
import { MAIN_WORKFLOW, workflowAfterProposalAccepted } from "@/lib/assistant/knowledge/workflows";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  return normalize(text).split(" ").filter((t) => t.length > 1);
}

const DASHBOARD_ENRICHED = enrichKnowledgeModules(DASHBOARD_MODULES);
const ADMIN_ENRICHED = enrichKnowledgeModules(ADMIN_MODULES);

export function modulesForSurface(surface: AssistantSurface): KnowledgeModule[] {
  return surface === "admin" ? ADMIN_ENRICHED : DASHBOARD_ENRICHED;
}

export function findModuleByKey(
  surface: AssistantSurface,
  key: string | null | undefined,
): KnowledgeModule | null {
  if (!key) return null;
  return modulesForSurface(surface).find((m) => m.key === key) ?? null;
}

export function scoreModule(query: string, module: KnowledgeModule): number {
  const q = normalize(query);
  const qTokens = tokens(query);
  let score = 0;

  const haystacks = [
    module.key,
    module.title,
    module.titleEn,
    module.description,
    module.descriptionEn,
    ...module.keywords,
    ...module.actions,
    ...module.actionsEn,
  ].map(normalize);

  for (const hay of haystacks) {
    if (hay.includes(q) && q.length > 3) score += 8;
    for (const t of qTokens) {
      if (hay.includes(t)) score += 2;
    }
  }

  return score;
}

export function searchModules(
  surface: AssistantSurface,
  query: string,
  limit = 5,
): KnowledgeModule[] {
  return modulesForSurface(surface)
    .map((m) => ({ m, score: scoreModule(query, m) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.m);
}

export function searchGlossary(query: string): GlossaryEntry | null {
  const q = normalize(query);
  let best: { entry: GlossaryEntry; score: number } | null = null;
  for (const entry of GLOSSARY) {
    let score = 0;
    const fields = [entry.key, entry.term, entry.termEn, ...entry.keywords].map(normalize);
    for (const f of fields) {
      if (q.includes(f) || f.includes(q)) score += 10;
      for (const t of tokens(query)) {
        if (f.includes(t)) score += 2;
      }
    }
    if (!best || score > best.score) best = { entry, score };
  }
  return best && best.score >= 6 ? best.entry : null;
}

export function findRoleGuide(role: string | null | undefined): RoleGuide | null {
  if (!role) return null;
  return ROLE_GUIDES.find((r) => r.role === role) ?? null;
}

export type KnowledgeHit = {
  modules: KnowledgeModule[];
  glossary: GlossaryEntry | null;
  roleGuide: RoleGuide | null;
  workflowNote: string | null;
};

export function searchKnowledge(input: {
  surface: AssistantSurface;
  query: string;
  locale: AssistantLocale;
  pageModuleKey?: string | null;
}): KnowledgeHit {
  const { surface, query, locale, pageModuleKey } = input;
  const q = normalize(query);

  let workflowNote: string | null = null;
  if (
    /(dupa|after).*(accept|accepta)/.test(q) ||
    /(acceptat|accepted).*(ofert|proposal)/.test(q) ||
    /ce fac dupa/.test(q)
  ) {
    workflowNote = workflowAfterProposalAccepted(locale);
  } else if (/(workflow|flux|pipeline comercial|de la lead)/.test(q)) {
    workflowNote = MAIN_WORKFLOW.map((s, i) => {
      const title = locale === "en" ? s.titleEn : s.title;
      const desc = locale === "en" ? s.descriptionEn : s.description;
      return `${i + 1}. ${title} — ${desc}`;
    }).join("\n");
  }

  const roleMatch = q.match(
    /rol(?:ul)?\s+(owner|admin|manager|sales|editor|collaborator|viewer)/i,
  );
  const roleGuide = roleMatch ? findRoleGuide(roleMatch[1].toLowerCase()) : null;

  const modules = searchModules(surface, query);
  if (pageModuleKey) {
    const pageMod = findModuleByKey(surface, pageModuleKey);
    if (pageMod) {
      const without = modules.filter((m) => m.key !== pageMod.key);
      without.unshift(pageMod);
      return {
        modules: without,
        glossary: searchGlossary(query),
        roleGuide,
        workflowNote,
      };
    }
  }

  return {
    modules,
    glossary: searchGlossary(query),
    roleGuide,
    workflowNote,
  };
}
