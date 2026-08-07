import type { AssistantContext } from "@/lib/assistant/context";
import { roleCan } from "@/lib/assistant/context";
import { assistantMessages } from "@/lib/assistant/i18n";
import type { AssistantAnswer, AssistantLink } from "@/lib/assistant/knowledge/types";
import { linkForModule, sanitizeAssistantLinks } from "@/lib/assistant/routes";
import { searchKnowledge, type KnowledgeHit } from "@/lib/assistant/search";
import type { WorkspaceAction } from "@/lib/workspace/role-permissions";

function pick(locale: "ro" | "en", ro: string, en: string): string {
  return locale === "en" ? en : ro;
}

function detectIntent(query: string): string {
  const q = query.toLowerCase();
  if (/ce pot|what can i|în acest meniu|in this menu|modific(a|ă) aici/.test(q)) return "page_help";
  if (/șterg|sterg|delete|de ce nu pot/.test(q)) return "permission";
  if (/plan|billing|upgrade|studio|agency|free|solo/.test(q)) return "plan";
  if (/automatiz|trigger|analytics|branding/.test(q)) return "feature";
  if (/workflow|flux|după ce|dupa ce|after/.test(q)) return "workflow";
  if (/rol|role|sales|viewer|owner/.test(q)) return "role";
  if (/unde|where|cum|how|ce este|what is/.test(q)) return "howto";
  return "general";
}

function moduleActionPermission(
  moduleKey: string,
  query: string,
): WorkspaceAction | null {
  const q = query.toLowerCase();
  if (moduleKey === "clients" || moduleKey === "leads") {
    if (/șterg|sterg|delete/.test(q)) return "crm.delete";
    if (/cree|creat|adaug|write|edit/.test(q)) return "crm.write";
  }
  if (moduleKey === "proposals" && /cree|public|edit/.test(q)) return "proposals.write";
  if (moduleKey === "contracts" && /cree|edit|public/.test(q)) return "contracts.write";
  if (moduleKey === "automations") return "automations.manage";
  if (moduleKey === "team" && /invit/.test(q)) return "members.manage";
  if (moduleKey === "payments" && /adaug|cree/.test(q)) return "payments.write";
  return null;
}

export function composeKnowledgeAnswer(
  query: string,
  ctx: AssistantContext,
  hit: KnowledgeHit,
): AssistantAnswer {
  const msg = assistantMessages(ctx.locale);
  const intent = detectIntent(query);
  const links: AssistantLink[] = [];
  const parts: string[] = [];
  let resolved = false;

  // Page-specific
  if (intent === "page_help" && ctx.module) {
    const title = ctx.locale === "en" ? ctx.module.titleEn : ctx.module.title;
    const desc = ctx.locale === "en" ? ctx.module.descriptionEn : ctx.module.description;
    const actions = ctx.locale === "en" ? ctx.module.actionsEn : ctx.module.actions;
    parts.push(`**${title}** — ${desc}`);
    parts.push(
      pick(ctx.locale, "Poți:", "You can:") +
        "\n" +
        actions.map((a) => `• ${a}`).join("\n"),
    );
    if (ctx.pageHint) parts.push(ctx.pageHint);
    const link = linkForModule(
      ctx.surface,
      ctx.module.key,
      pick(ctx.locale, `Deschide ${ctx.module.title}`, `Open ${ctx.module.titleEn}`),
    );
    if (link) links.push(link);
    resolved = true;
  }

  if (hit.workflowNote) {
    parts.push(hit.workflowNote);
    resolved = true;
  }

  if (hit.glossary) {
    const term = ctx.locale === "en" ? hit.glossary.termEn : hit.glossary.term;
    const def = ctx.locale === "en" ? hit.glossary.definitionEn : hit.glossary.definition;
    parts.push(`**${term}**: ${def}`);
    resolved = true;
  }

  if (hit.roleGuide) {
    const summary = ctx.locale === "en" ? hit.roleGuide.summaryEn : hit.roleGuide.summary;
    const can = ctx.locale === "en" ? hit.roleGuide.canEn : hit.roleGuide.can;
    const cannot = ctx.locale === "en" ? hit.roleGuide.cannotEn : hit.roleGuide.cannot;
    parts.push(`**${hit.roleGuide.role}**: ${summary}`);
    if (can.length) {
      parts.push(pick(ctx.locale, "Poate:", "Can:") + " " + can.join("; "));
    }
    if (cannot.length) {
      parts.push(pick(ctx.locale, "Nu poate:", "Cannot:") + " " + cannot.join("; "));
    }
    resolved = true;
  }

  const primary =
    intent === "page_help" && ctx.module
      ? ctx.module
      : (hit.modules[0] ?? ctx.module);
  if (primary && !resolved) {
    const title = ctx.locale === "en" ? primary.titleEn : primary.title;
    const desc = ctx.locale === "en" ? primary.descriptionEn : primary.description;
    const actions = ctx.locale === "en" ? primary.actionsEn : primary.actions;
    parts.push(`**${title}** — ${desc}`);
    parts.push(actions.map((a) => `• ${a}`).join("\n"));
    if (primary.pageHints && /edit|draft|modific/.test(query.toLowerCase())) {
      parts.push(primary.pageHints[0]);
    }
    const link = linkForModule(
      ctx.surface,
      primary.key,
      pick(ctx.locale, `Deschide ${primary.title}`, `Open ${primary.titleEn}`),
    );
    if (link) links.push(link);
    resolved = true;
  }

  // Plan / feature gating
  if (primary?.planFeatures?.length && ctx.plan) {
    for (const feature of primary.planFeatures) {
      if (!ctx.capabilities.features[feature]) {
        parts.push(msg.planMissing);
        const billing = linkForModule(ctx.surface, "billing", msg.seePlans);
        if (billing) links.push(billing);
        break;
      }
    }
  }

  // Role gating for destructive / write asks
  if (ctx.workspaceRole && primary) {
    const needed = moduleActionPermission(primary.key, query);
    if (needed && !roleCan(ctx.workspaceRole, needed)) {
      parts.push(msg.roleBlocked);
      if (ctx.locale === "ro") {
        parts.push(
          `Rolul tău este **${ctx.workspaceRole}**. Cere unui owner/admin dacă ai nevoie de acest drept.`,
        );
      } else {
        parts.push(
          `Your role is **${ctx.workspaceRole}**. Ask an owner/admin if you need this permission.`,
        );
      }
    }
  }

  // Cross-tenant safety note for admin
  if (ctx.surface === "admin") {
    parts.push(
      pick(
        ctx.locale,
        "Răspunsurile sunt ghidare UI — nu afișez date din alte workspace-uri.",
        "Answers are UI guidance — I do not show other workspaces' data.",
      ),
    );
  }

  if (!parts.length) {
    parts.push(msg.fallback);
    if (ctx.module) {
      const link = linkForModule(
        ctx.surface,
        ctx.module.key,
        pick(ctx.locale, `Deschide ${ctx.module.title}`, `Open ${ctx.module.titleEn}`),
      );
      if (link) links.push(link);
    }
  }

  const suggested =
    (ctx.locale === "en"
      ? primary?.suggestedQuestionsEn
      : primary?.suggestedQuestions) ??
    (ctx.module
      ? ctx.locale === "en"
        ? ctx.module.suggestedQuestionsEn
        : ctx.module.suggestedQuestions
      : [msg.whatCanIDo]);

  return {
    answer: parts.join("\n\n"),
    links: sanitizeAssistantLinks(ctx.surface, links),
    suggestedQuestions: suggested.slice(0, 4),
    moduleKey: primary?.key ?? ctx.moduleKey,
    intent,
    resolved,
    provider: "knowledge",
  };
}

export function answerFromKnowledge(query: string, ctx: AssistantContext): AssistantAnswer {
  const hit = searchKnowledge({
    surface: ctx.surface,
    query,
    locale: ctx.locale,
    pageModuleKey: ctx.moduleKey,
  });
  return composeKnowledgeAnswer(query, ctx, hit);
}
