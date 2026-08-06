import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { PLAN_CATALOG, type PlanId } from "@/lib/billing/plan-catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export type AdminWorkspaceItem = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  city: string | null;
  country: string | null;
  currency: string;
  memberCount: number;
  subscriptionStatus: string | null;
  mrr: number;
  createdAt: string;
};

function planPriceRon(planId: string): number {
  return PLAN_CATALOG.find((plan) => plan.id === planId)?.priceMonthlyRon ?? 0;
}

/** Platform-admin only: relies on `is_platform_admin()` RLS grants, never a service-role client. */
export async function listWorkspacesForAdmin(
  supabase: SupabaseClient<Database>,
  limit = 200,
): Promise<AdminWorkspaceItem[]> {
  const [{ data: workspaces, error: wsError }, { data: subs }, { data: members }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("subscriptions").select("workspace_id, status, plan"),
    supabase.from("workspace_members").select("workspace_id"),
  ]);

  if (wsError) throw new Error(wsError.message);

  const subByWorkspace = new Map((subs ?? []).map((s) => [s.workspace_id, s]));
  const memberCounts = new Map<string, number>();
  for (const member of members ?? []) {
    memberCounts.set(member.workspace_id, (memberCounts.get(member.workspace_id) ?? 0) + 1);
  }

  return (workspaces ?? []).map((workspace: WorkspaceRow) => {
    const sub = subByWorkspace.get(workspace.id);
    const effectivePlan = sub?.plan ?? workspace.plan;
    const isBillable = sub ? sub.status === "active" : false;
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      city: workspace.city,
      country: workspace.country,
      currency: workspace.currency,
      memberCount: memberCounts.get(workspace.id) ?? 0,
      subscriptionStatus: sub?.status ?? null,
      mrr: isBillable ? planPriceRon(effectivePlan) : 0,
      createdAt: workspace.created_at,
    };
  });
}

export type AdminUserItem = {
  id: string;
  fullName: string | null;
  email: string | null;
  accountStatus: string;
  isPlatformAdmin: boolean;
  updatedAt: string;
  createdAt: string;
  memberships: Array<{ workspaceId: string; workspaceName: string; role: string }>;
};

/**
 * Emails live in Supabase `auth.users`, not `profiles`. We resolve them with the
 * service-role admin client (server-only, never sent to the browser). If the
 * service-role key isn't configured in this environment, emails degrade to null
 * instead of throwing — the rest of the admin UI keeps working.
 */
async function resolveEmailsById(userIds: string[]): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  if (userIds.length === 0) return result;

  try {
    const admin = createAdminClient();
    let page = 1;
    const perPage = 200;
    for (let i = 0; i < 25; i += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error || !data) break;
      for (const user of data.users) {
        result.set(user.id, user.email ?? null);
      }
      if (data.users.length < perPage) break;
      page += 1;
    }
  } catch {
    // Service role not configured in this environment — emails stay null.
  }

  return result;
}

export async function listUsersForAdmin(
  supabase: SupabaseClient<Database>,
  limit = 300,
): Promise<AdminUserItem[]> {
  const [{ data: profiles, error }, { data: members }, { data: workspaces }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(limit),
    supabase.from("workspace_members").select("user_id, workspace_id, role"),
    supabase.from("workspaces").select("id, name"),
  ]);

  if (error) throw new Error(error.message);

  const workspaceNameById = new Map((workspaces ?? []).map((w) => [w.id, w.name]));
  const membershipsByUser = new Map<string, AdminUserItem["memberships"]>();
  for (const member of members ?? []) {
    const list = membershipsByUser.get(member.user_id) ?? [];
    list.push({
      workspaceId: member.workspace_id,
      workspaceName: workspaceNameById.get(member.workspace_id) ?? "—",
      role: member.role,
    });
    membershipsByUser.set(member.user_id, list);
  }

  const emailById = await resolveEmailsById((profiles ?? []).map((p) => p.id));

  return (profiles ?? []).map((profile: ProfileRow) => ({
    id: profile.id,
    fullName: profile.full_name,
    email: emailById.get(profile.id) ?? null,
    accountStatus: profile.account_status,
    isPlatformAdmin: profile.is_platform_admin,
    updatedAt: profile.updated_at,
    createdAt: profile.created_at,
    memberships: membershipsByUser.get(profile.id) ?? [],
  }));
}

export type AdminSubscriptionItem = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  plan: string;
  status: string;
  amount: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
};

export async function listSubscriptionsForAdmin(
  supabase: SupabaseClient<Database>,
  limit = 300,
): Promise<AdminSubscriptionItem[]> {
  const [{ data: subs, error }, { data: workspaces }] = await Promise.all([
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }).limit(limit),
    supabase.from("workspaces").select("id, name"),
  ]);

  if (error) throw new Error(error.message);

  const workspaceNameById = new Map((workspaces ?? []).map((w) => [w.id, w.name]));

  return (subs ?? []).map((sub: SubscriptionRow) => ({
    id: sub.id,
    workspaceId: sub.workspace_id,
    workspaceName: workspaceNameById.get(sub.workspace_id) ?? "—",
    plan: sub.plan,
    status: sub.status,
    amount: planPriceRon(sub.plan),
    trialEndsAt: sub.trial_ends_at,
    currentPeriodEnd: sub.current_period_end,
  }));
}

export type PlatformStats = {
  workspaceCount: number;
  activeUserCount: number;
  mrr: number;
  churnRatePercent: number;
  planDistribution: Array<{ planId: PlanId; count: number; share: number }>;
};

export async function getPlatformStats(supabase: SupabaseClient<Database>): Promise<PlatformStats> {
  const [{ data: workspaces, error }, { data: subs }, { count: userCount }] = await Promise.all([
    supabase.from("workspaces").select("id, plan"),
    supabase.from("subscriptions").select("workspace_id, status, plan"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  if (error) throw new Error(error.message);

  const rows = workspaces ?? [];
  const workspaceCount = rows.length;

  const subByWorkspace = new Map((subs ?? []).map((s) => [s.workspace_id, s]));
  let mrr = 0;
  let cancelledCount = 0;
  for (const sub of subs ?? []) {
    if (sub.status === "active") mrr += planPriceRon(sub.plan);
    if (sub.status === "cancelled" || sub.status === "suspended") cancelledCount += 1;
  }
  const churnRatePercent = (subs ?? []).length ? (cancelledCount / (subs ?? []).length) * 100 : 0;

  const distributionMap = new Map<string, number>();
  for (const workspace of rows) {
    const plan = subByWorkspace.get(workspace.id)?.plan ?? workspace.plan;
    distributionMap.set(plan, (distributionMap.get(plan) ?? 0) + 1);
  }

  const planDistribution = PLAN_CATALOG.map((plan) => {
    const count = distributionMap.get(plan.id) ?? 0;
    return {
      planId: plan.id,
      count,
      share: workspaceCount > 0 ? Math.round((count / workspaceCount) * 100) : 0,
    };
  });

  return {
    workspaceCount,
    activeUserCount: userCount ?? 0,
    mrr,
    churnRatePercent,
    planDistribution,
  };
}

export type AdminActivityItem = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  action: string | null;
  title: string;
  description: string | null;
  createdAt: string;
};

/** Recent activity across every workspace — visible only to platform admins via RLS. */
export async function listRecentActivityForAdmin(
  supabase: SupabaseClient<Database>,
  limit = 60,
): Promise<AdminActivityItem[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const workspaceIds = [...new Set((data ?? []).map((row) => row.workspace_id))];
  const { data: workspaces } = workspaceIds.length
    ? await supabase.from("workspaces").select("id, name").in("id", workspaceIds)
    : { data: [] as Array<{ id: string; name: string }> };
  const nameById = new Map((workspaces ?? []).map((w) => [w.id, w.name]));

  return (data ?? []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    workspaceName: nameById.get(row.workspace_id) ?? "—",
    action: row.action,
    title: row.title,
    description: row.description,
    createdAt: row.created_at,
  }));
}
