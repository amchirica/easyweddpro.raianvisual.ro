import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PLAN_CATALOG,
  type PlanDefinition,
  type PlanId,
} from "@/lib/billing/plan-catalog";
import type { Database } from "@/types/database";

export type { PlanId, PlanDefinition };
export { PLAN_CATALOG };

export type PlanLimits = PlanDefinition["limits"] & {
  activeProposals: number | null;
  activeContracts: number | null;
  storageBytes: number;
};

export type WorkspaceUsage = {
  activeLeads: number;
  clients: number;
  users: number;
  activeProposals: number;
  activeContracts: number;
  plan: PlanId;
  status: string;
};

const EXTENDED_LIMITS: Record<PlanId, Pick<PlanLimits, "activeProposals" | "activeContracts" | "storageBytes">> = {
  free: { activeProposals: 2, activeContracts: 1, storageBytes: 5 * 1024 * 1024 },
  solo: { activeProposals: null, activeContracts: null, storageBytes: 200 * 1024 * 1024 },
  studio: { activeProposals: null, activeContracts: null, storageBytes: 2 * 1024 * 1024 * 1024 },
  agency: { activeProposals: null, activeContracts: null, storageBytes: 10 * 1024 * 1024 * 1024 },
};

export function normalizePlanId(value: string | null | undefined): PlanId {
  if (value === "solo" || value === "studio" || value === "agency" || value === "free") {
    return value;
  }
  return "free";
}

/**
 * Entitlement gate used by getWorkspacePlan: canceled/unpaid/etc. paid plans
 * force Free limits until billing is active again.
 */
export function resolveEntitledPlan(plan: PlanId, status: string): PlanId {
  const entitlementActive =
    ["active", "trialing", "past_due"].includes(status) || plan === "free";
  return entitlementActive ? plan : "free";
}

export function getPlanDefinition(plan: PlanId): PlanDefinition {
  return PLAN_CATALOG.find((item) => item.id === plan) ?? PLAN_CATALOG[0];
}

export function getPlanLimits(plan: PlanId): PlanLimits {
  const base = getPlanDefinition(plan).limits;
  return { ...base, ...EXTENDED_LIMITS[plan] };
}

export function canUseFeature(
  plan: PlanId,
  feature: keyof Pick<
    PlanLimits,
    "automations" | "analytics" | "customBranding" | "productionPipeline" | "multiBrand"
  >,
): boolean {
  return Boolean(getPlanLimits(plan)[feature]);
}

export type LimitedResource =
  | "lead"
  | "client"
  | "user"
  | "proposal"
  | "contract";

export function canCreateResource(
  plan: PlanId,
  resource: LimitedResource,
  usage: WorkspaceUsage,
): { ok: true } | { ok: false; reason: string; limit: number } {
  const limits = getPlanLimits(plan);

  const checks: Array<{
    resource: LimitedResource;
    current: number;
    limit: number | null;
    label: string;
  }> = [
    { resource: "lead", current: usage.activeLeads, limit: limits.activeLeads, label: "leaduri active" },
    { resource: "client", current: usage.clients, limit: limits.clients, label: "clienți" },
    { resource: "user", current: usage.users, limit: limits.users, label: "utilizatori" },
    {
      resource: "proposal",
      current: usage.activeProposals,
      limit: limits.activeProposals,
      label: "oferte active",
    },
    {
      resource: "contract",
      current: usage.activeContracts,
      limit: limits.activeContracts,
      label: "contracte active",
    },
  ];

  const row = checks.find((item) => item.resource === resource);
  if (!row) return { ok: true };
  if (row.limit == null) return { ok: true };
  if (row.current < row.limit) return { ok: true };
  return {
    ok: false,
    limit: row.limit,
    reason: `Planul ${getPlanDefinition(plan).name} permite maximum ${row.limit} ${row.label}. Fă upgrade pentru a continua.`,
  };
}

export async function getWorkspacePlan(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<{ plan: PlanId; status: string; subscription: Database["public"]["Tables"]["subscriptions"]["Row"] | null }> {
  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!data) {
    return { plan: "free", status: "inactive", subscription: null };
  }

  const plan = normalizePlanId(data.plan);
  return {
    plan: resolveEntitledPlan(plan, data.status),
    status: data.status,
    subscription: data,
  };
}

export async function getUsageForWorkspace(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<WorkspaceUsage> {
  const { plan, status } = await getWorkspacePlan(supabase, workspaceId);

  const [leads, clients, members, proposals, contracts] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .neq("status", "lost"),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
    supabase
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("disabled_at", null),
    supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .in("status", ["draft", "sent", "viewed"]),
    supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .is("archived_at", null)
      .in("status", ["draft", "published", "viewed", "accepted"]),
  ]);

  return {
    plan,
    status,
    activeLeads: leads.count ?? 0,
    clients: clients.count ?? 0,
    users: members.count ?? 0,
    activeProposals: proposals.count ?? 0,
    activeContracts: contracts.count ?? 0,
  };
}
