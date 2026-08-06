import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { PLAN_CATALOG } from "@/lib/billing/plan-catalog";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

function planPriceRon(planId: string): number {
  return PLAN_CATALOG.find((plan) => plan.id === planId)?.priceMonthlyRon ?? 0;
}

export type PlatformKpis = {
  usersTotal: number;
  usersActive7d: number;
  usersActive30d: number;
  usersNew30d: number;
  workspacesTotal: number;
  trialsActive: number;
  subscriptionsPaid: number;
  subscriptionsPastDue: number;
  subscriptionsCancelled: number;
  mrrRon: number;
  arrRon: number;
  emailsSent24h: number;
  emailsFailed24h: number;
  cronFailures24h: number;
  automationFailures24h: number;
  feedbackNew: number;
  errorsOpen: number;
  leadsTotal: number;
  proposalsTotal: number;
  contractsTotal: number;
  projectsTotal: number;
};

export async function getPlatformKpis(supabase: Client): Promise<PlatformKpis> {
  const now = Date.now();
  const d7 = new Date(now - 7 * 86_400_000).toISOString();
  const d30 = new Date(now - 30 * 86_400_000).toISOString();
  const d24 = new Date(now - 86_400_000).toISOString();

  const [
    usersTotal,
    usersActive7d,
    usersActive30d,
    usersNew30d,
    workspacesTotal,
    subs,
    emailsSent24h,
    emailsFailed24h,
    cronFailures24h,
    automationFailures24h,
    feedbackNew,
    errorsOpen,
    leadsTotal,
    proposalsTotal,
    contractsTotal,
    projectsTotal,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("updated_at", d7),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("updated_at", d30),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .gte("created_at", d30),
    supabase.from("workspaces").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("status, plan"),
    supabase
      .from("email_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("created_at", d24),
    supabase
      .from("email_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", d24),
    supabase
      .from("cron_runs")
      .select("id", { count: "exact", head: true })
      .eq("success", false)
      .gte("started_at", d24),
    supabase
      .from("automation_runs")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", d24),
    supabase
      .from("user_feedback")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    supabase
      .from("system_errors")
      .select("id", { count: "exact", head: true })
      .is("resolved_at", null),
    supabase.from("leads").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("proposals").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("contracts").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("projects").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  let mrrRon = 0;
  let trialsActive = 0;
  let subscriptionsPaid = 0;
  let subscriptionsPastDue = 0;
  let subscriptionsCancelled = 0;

  for (const sub of subs.data ?? []) {
    if (sub.status === "trialing") trialsActive += 1;
    if (sub.status === "active") {
      subscriptionsPaid += 1;
      mrrRon += planPriceRon(sub.plan);
    }
    if (sub.status === "past_due") subscriptionsPastDue += 1;
    if (sub.status === "cancelled" || sub.status === "suspended") subscriptionsCancelled += 1;
  }

  return {
    usersTotal: usersTotal.count ?? 0,
    usersActive7d: usersActive7d.count ?? 0,
    usersActive30d: usersActive30d.count ?? 0,
    usersNew30d: usersNew30d.count ?? 0,
    workspacesTotal: workspacesTotal.count ?? 0,
    trialsActive,
    subscriptionsPaid,
    subscriptionsPastDue,
    subscriptionsCancelled,
    mrrRon,
    arrRon: mrrRon * 12,
    emailsSent24h: emailsSent24h.count ?? 0,
    emailsFailed24h: emailsFailed24h.count ?? 0,
    cronFailures24h: cronFailures24h.count ?? 0,
    automationFailures24h: automationFailures24h.count ?? 0,
    feedbackNew: feedbackNew.count ?? 0,
    errorsOpen: errorsOpen.count ?? 0,
    leadsTotal: leadsTotal.count ?? 0,
    proposalsTotal: proposalsTotal.count ?? 0,
    contractsTotal: contractsTotal.count ?? 0,
    projectsTotal: projectsTotal.count ?? 0,
  };
}
