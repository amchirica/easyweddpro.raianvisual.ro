import { findModuleByKey, modulesForSurface } from "@/lib/assistant/search";
import type {
  AssistantLocale,
  AssistantSurface,
  KnowledgeModule,
  PlanFeatureKey,
} from "@/lib/assistant/knowledge/types";
import { PLAN_CATALOG, type PlanId } from "@/lib/billing/plan-catalog";
import type { WorkspaceRole } from "@/lib/constants";
import {
  canPerformWorkspaceAction,
  permissionsForRole,
  type WorkspaceAction,
} from "@/lib/workspace/role-permissions";

function planHasFeature(plan: PlanId, feature: PlanFeatureKey): boolean {
  const def = PLAN_CATALOG.find((item) => item.id === plan) ?? PLAN_CATALOG[0];
  return Boolean(def.limits[feature]);
}

export type AssistantContext = {
  surface: AssistantSurface;
  pathname: string;
  locale: AssistantLocale;
  moduleKey: string | null;
  module: KnowledgeModule | null;
  workspaceRole: WorkspaceRole | null;
  platformRole: string | null;
  plan: PlanId | null;
  capabilities: {
    permissions: ReturnType<typeof permissionsForRole> | null;
    features: Record<PlanFeatureKey, boolean>;
  };
  pageHint: string | null;
};

const PATH_RULES: Array<{ pattern: RegExp; key: string; surface: AssistantSurface }> = [
  { pattern: /^\/dashboard\/leads/, key: "leads", surface: "dashboard" },
  { pattern: /^\/dashboard\/clients/, key: "clients", surface: "dashboard" },
  { pattern: /^\/dashboard\/proposals/, key: "proposals", surface: "dashboard" },
  { pattern: /^\/dashboard\/contracts\/[^/]+\/edit/, key: "contracts", surface: "dashboard" },
  { pattern: /^\/dashboard\/contracts/, key: "contracts", surface: "dashboard" },
  { pattern: /^\/dashboard\/calendar/, key: "calendar", surface: "dashboard" },
  { pattern: /^\/dashboard\/projects/, key: "projects", surface: "dashboard" },
  { pattern: /^\/dashboard\/tasks/, key: "tasks", surface: "dashboard" },
  { pattern: /^\/dashboard\/payments/, key: "payments", surface: "dashboard" },
  { pattern: /^\/dashboard\/automations/, key: "automations", surface: "dashboard" },
  { pattern: /^\/dashboard\/templates/, key: "templates", surface: "dashboard" },
  { pattern: /^\/dashboard\/team/, key: "team", surface: "dashboard" },
  { pattern: /^\/dashboard\/analytics/, key: "analytics", surface: "dashboard" },
  { pattern: /^\/dashboard\/settings\/billing/, key: "billing", surface: "dashboard" },
  { pattern: /^\/dashboard\/settings/, key: "settings", surface: "dashboard" },
  { pattern: /^\/dashboard\/?$/, key: "dashboard", surface: "dashboard" },
  { pattern: /^\/admin\/users/, key: "admin-users", surface: "admin" },
  { pattern: /^\/admin\/workspaces/, key: "admin-workspaces", surface: "admin" },
  { pattern: /^\/admin\/subscriptions/, key: "admin-subscriptions", surface: "admin" },
  { pattern: /^\/admin\/plans/, key: "admin-plans", surface: "admin" },
  { pattern: /^\/admin\/email-deliveries/, key: "admin-email-deliveries", surface: "admin" },
  { pattern: /^\/admin\/emails/, key: "admin-emails", surface: "admin" },
  { pattern: /^\/admin\/cron/, key: "admin-cron", surface: "admin" },
  { pattern: /^\/admin\/jobs/, key: "admin-jobs", surface: "admin" },
  { pattern: /^\/admin\/webhooks/, key: "admin-webhooks", surface: "admin" },
  { pattern: /^\/admin\/feedback/, key: "admin-feedback", surface: "admin" },
  { pattern: /^\/admin\/audit/, key: "admin-audit", surface: "admin" },
  { pattern: /^\/admin\/system\/health/, key: "admin-health", surface: "admin" },
  { pattern: /^\/admin\/system\/errors/, key: "admin-errors", surface: "admin" },
  { pattern: /^\/admin\/settings/, key: "admin-system", surface: "admin" },
  { pattern: /^\/admin\/admins/, key: "admin-admins", surface: "admin" },
  { pattern: /^\/admin\/?$/, key: "admin-dashboard", surface: "admin" },
];

export function resolveModuleKey(
  pathname: string,
  surface: AssistantSurface,
): string | null {
  for (const rule of PATH_RULES) {
    if (rule.surface === surface && rule.pattern.test(pathname)) {
      return rule.key;
    }
  }
  return null;
}

export function buildAssistantContext(input: {
  surface: AssistantSurface;
  pathname: string;
  locale: AssistantLocale;
  workspaceRole?: WorkspaceRole | null;
  platformRole?: string | null;
  plan?: PlanId | null;
}): AssistantContext {
  const moduleKey = resolveModuleKey(input.pathname, input.surface);
  const currentModule = findModuleByKey(input.surface, moduleKey);
  const plan = input.plan ?? null;

  const features: Record<PlanFeatureKey, boolean> = {
    automations: plan ? planHasFeature(plan, "automations") : true,
    analytics: plan ? planHasFeature(plan, "analytics") : true,
    customBranding: plan ? planHasFeature(plan, "customBranding") : true,
    productionPipeline: plan ? planHasFeature(plan, "productionPipeline") : true,
    multiBrand: plan ? planHasFeature(plan, "multiBrand") : true,
  };

  let pageHint: string | null = null;
  if (currentModule?.pageHints?.length) {
    if (/\/edit\/?$/.test(input.pathname) || input.pathname.includes("/edit")) {
      pageHint = currentModule.pageHints[0];
    }
  }

  return {
    surface: input.surface,
    pathname: input.pathname,
    locale: input.locale,
    moduleKey,
    module: currentModule,
    workspaceRole: input.workspaceRole ?? null,
    platformRole: input.platformRole ?? null,
    plan,
    capabilities: {
      permissions: input.workspaceRole ? permissionsForRole(input.workspaceRole) : null,
      features,
    },
    pageHint,
  };
}

export function roleCan(
  role: WorkspaceRole | null | undefined,
  action: WorkspaceAction,
): boolean {
  return canPerformWorkspaceAction(role, action);
}

export function suggestedForContext(
  ctx: AssistantContext,
): string[] {
  const locale = ctx.locale;
  if (ctx.module) {
    return locale === "en" ? ctx.module.suggestedQuestionsEn : ctx.module.suggestedQuestions;
  }
  const first = modulesForSurface(ctx.surface)[0];
  return locale === "en" ? first.suggestedQuestionsEn : first.suggestedQuestions;
}

// Pure plan feature check for tests / answer gating
export { planHasFeature };
