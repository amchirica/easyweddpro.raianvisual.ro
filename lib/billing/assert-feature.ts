import "server-only";

import {
  canUseFeature,
  getUsageForWorkspace,
  type PlanId,
} from "@/lib/billing/plans";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type FeatureKey =
  | "automations"
  | "analytics"
  | "customBranding"
  | "productionPipeline"
  | "multiBrand";

const FEATURE_LABELS: Record<FeatureKey, string> = {
  automations: "Automatizări",
  analytics: "Analytics",
  customBranding: "Branding personalizat",
  productionPipeline: "Pipeline producție",
  multiBrand: "Multiple branduri",
};

/**
 * Server-side plan feature gate. Returns null when allowed, or a Romanian reason string.
 */
export async function assertPlanFeature(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  feature: FeatureKey,
): Promise<{ ok: true; plan: PlanId } | { ok: false; reason: string; plan: PlanId }> {
  const usage = await getUsageForWorkspace(supabase, workspaceId);
  if (canUseFeature(usage.plan, feature)) {
    return { ok: true, plan: usage.plan };
  }
  return {
    ok: false,
    plan: usage.plan,
    reason: `${FEATURE_LABELS[feature]} este disponibil pe planul Studio sau Agency. Planul curent: ${usage.plan === "free" ? "Free" : usage.plan}.`,
  };
}
