import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PLAN_CATALOG,
  type PlanDefinition,
  type PlanId,
} from "@/lib/billing/plan-catalog";
import { yearlyPriceFromMonthly } from "@/lib/billing/pricing";
import type { Database, Json } from "@/types/database";

type Client = SupabaseClient<Database>;

function parseLimits(raw: Json): PlanDefinition["limits"] {
  const obj = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    activeLeads: typeof obj.activeLeads === "number" ? obj.activeLeads : obj.activeLeads === null ? null : 5,
    clients: typeof obj.clients === "number" ? obj.clients : obj.clients === null ? null : 3,
    users: typeof obj.users === "number" ? obj.users : 1,
    automations: Boolean(obj.automations),
    analytics: Boolean(obj.analytics),
    customBranding: Boolean(obj.customBranding),
    productionPipeline: Boolean(obj.productionPipeline),
    multiBrand: Boolean(obj.multiBrand),
  };
}

function parseFeatures(raw: Json): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

/** Resolve plan definition from DB current version, falling back to code catalog. */
export async function resolvePlanDefinition(
  supabase: Client,
  planId: string,
): Promise<PlanDefinition> {
  const fallback =
    PLAN_CATALOG.find((p) => p.id === planId) ?? PLAN_CATALOG[0];

  try {
    const { data: plan } = await supabase
      .from("plans")
      .select("*")
      .eq("id", planId)
      .maybeSingle();
    if (!plan) return fallback;

    const { data: version } = await supabase
      .from("plan_versions")
      .select("*")
      .eq("plan_id", planId)
      .eq("is_current", true)
      .maybeSingle();

    if (!version) {
      return {
        ...fallback,
        id: plan.id as PlanId,
        name: plan.name,
        description: plan.description,
        highlighted: plan.highlighted,
        cta: plan.cta,
      };
    }

    return {
      id: plan.id as PlanId,
      name: plan.name,
      description: plan.description,
      priceMonthlyRon: version.price_monthly,
      priceYearlyRon: version.price_yearly ?? yearlyPriceFromMonthly(version.price_monthly),
      features: parseFeatures(version.features),
      limits: parseLimits(version.limits),
      highlighted: plan.highlighted,
      cta: plan.cta,
    };
  } catch {
    return fallback;
  }
}

export async function listAdminPlans(supabase: Client) {
  const { data: plans, error } = await supabase
    .from("plans")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !plans?.length) {
    return PLAN_CATALOG.map((plan) => ({
      ...plan,
      slug: plan.id,
      currency: "RON",
      visible: true,
      active: true,
      visibility: "public" as const,
      sortOrder: PLAN_CATALOG.findIndex((p) => p.id === plan.id),
      version: 1,
      priceYearly: plan.priceYearlyRon,
      stripePriceMonthlyId: null as string | null,
      stripePriceYearlyId: null as string | null,
      trialDays: 0,
      source: "catalog" as const,
    }));
  }

  const { data: versions } = await supabase
    .from("plan_versions")
    .select("*")
    .eq("is_current", true);

  const versionByPlan = new Map((versions ?? []).map((v) => [v.plan_id, v]));

  return plans.map((plan) => {
    const version = versionByPlan.get(plan.id);
    const fallback = PLAN_CATALOG.find((p) => p.id === plan.id);
    return {
      id: plan.id as PlanId,
      name: plan.name,
      slug: plan.slug,
      description: plan.description,
      currency: plan.currency,
      visible: plan.visible,
      active: plan.active,
      highlighted: plan.highlighted,
      visibility: plan.visibility,
      sortOrder: plan.sort_order,
      cta: plan.cta,
      priceMonthlyRon: version?.price_monthly ?? fallback?.priceMonthlyRon ?? 0,
      priceYearly: version?.price_yearly ?? null,
      stripePriceMonthlyId: version?.stripe_price_monthly_id ?? null,
      stripePriceYearlyId: version?.stripe_price_yearly_id ?? null,
      trialDays: version?.trial_days ?? 0,
      version: version?.version ?? 1,
      features: version ? parseFeatures(version.features) : fallback?.features ?? [],
      limits: version ? parseLimits(version.limits) : fallback?.limits ?? PLAN_CATALOG[0].limits,
      source: "db" as const,
    };
  });
}
