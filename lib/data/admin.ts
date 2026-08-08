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

export type AdminSubscriptionItem = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  plan: string;
  status: string;
  amount: number;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  billingInterval: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  /** True when the workspace has no subscriptions row (shown as Free). */
  isFreeFallback: boolean;
};

function planPriceRon(planId: string): number {
  return PLAN_CATALOG.find((plan) => plan.id === planId)?.priceMonthlyRon ?? 0;
}

/** Pure mapper for admin subscription rows — Free when the workspace has no Stripe sub. */
export function mapWorkspaceSubscriptionForAdmin(
  workspace: { id: string; name: string; plan?: string | null },
  sub: SubscriptionRow | null,
): AdminSubscriptionItem {
  if (!sub) {
    return {
      id: `free:${workspace.id}`,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      plan: "free",
      status: "inactive",
      amount: 0,
      trialEndsAt: null,
      currentPeriodEnd: null,
      billingInterval: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
      isFreeFallback: true,
    };
  }

  return {
    id: sub.id,
    workspaceId: sub.workspace_id,
    workspaceName: workspace.name,
    plan: sub.plan,
    status: sub.status,
    amount: planPriceRon(sub.plan),
    trialEndsAt: sub.trial_ends_at,
    currentPeriodEnd: sub.current_period_end,
    billingInterval: sub.billing_interval,
    stripeCustomerId: sub.stripe_customer_id,
    stripeSubscriptionId: sub.stripe_subscription_id,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    trialEnd: sub.trial_end,
    isFreeFallback: false,
  };
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

export async function listSubscriptionsForAdmin(
  supabase: SupabaseClient<Database>,
  limit = 300,
): Promise<AdminSubscriptionItem[]> {
  const [{ data: workspaces, error: wsError }, { data: subs, error: subError }] = await Promise.all([
    supabase.from("workspaces").select("id, name").order("created_at", { ascending: false }).limit(limit),
    supabase.from("subscriptions").select("*"),
  ]);

  if (wsError) throw new Error(wsError.message);
  if (subError) throw new Error(subError.message);

  const subByWorkspace = new Map((subs ?? []).map((sub: SubscriptionRow) => [sub.workspace_id, sub]));

  return (workspaces ?? []).map((workspace) =>
    mapWorkspaceSubscriptionForAdmin(
      { id: workspace.id, name: workspace.name },
      subByWorkspace.get(workspace.id) ?? null,
    ),
  );
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

export type AdminCronRunItem = {
  id: string;
  job: string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  success: boolean;
  processed: number;
  errors: number;
};

export type AdminSystemStatus = {
  recentCronRuns: AdminCronRunItem[];
  emailQueue: { pending: number; failed: number; sent24h: number; skipped: number };
  automationQueue: { running: number; failed24h: number; success24h: number };
  webhooks: { processed24h: number };
  notifications: {
    total: number;
    unread: number;
    lastNotificationsJob: AdminCronRunItem | null;
  };
  storageConfigured: boolean;
  resendConfigured: boolean;
  stripeConfigured: boolean;
};

/** Platform-admin system monitor (cron, queues, integrations). */
export async function getSystemStatusForAdmin(
  supabase: SupabaseClient<Database>,
): Promise<AdminSystemStatus> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    cronRuns,
    emailPending,
    emailFailed,
    emailSent,
    emailSkipped,
    automationRunning,
    automationFailed,
    automationSuccess,
    webhooks,
    notificationsTotal,
    notificationsUnread,
  ] = await Promise.all([
    supabase
      .from("cron_runs")
      .select("id, job, started_at, finished_at, duration_ms, success, processed, errors")
      .order("started_at", { ascending: false })
      .limit(40),
    supabase
      .from("email_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("email_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
    supabase
      .from("email_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent")
      .gte("created_at", since24h),
    supabase
      .from("email_deliveries")
      .select("id", { count: "exact", head: true })
      .eq("status", "skipped"),
    supabase
      .from("automation_runs")
      .select("id", { count: "exact", head: true })
      .eq("status", "running"),
    supabase
      .from("automation_runs")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("created_at", since24h),
    supabase
      .from("automation_runs")
      .select("id", { count: "exact", head: true })
      .eq("status", "success")
      .gte("created_at", since24h),
    supabase
      .from("stripe_webhook_events")
      .select("id", { count: "exact", head: true })
      .gte("processed_at", since24h),
    supabase.from("notifications").select("id", { count: "exact", head: true }),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  if (cronRuns.error) throw new Error(cronRuns.error.message);

  const recentCronRuns = (cronRuns.data ?? []).map((row) => ({
    id: row.id,
    job: row.job,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMs: row.duration_ms,
    success: row.success,
    processed: row.processed,
    errors: row.errors,
  }));

  const lastNotificationsJob =
    recentCronRuns.find((run) => run.job === "notifications") ??
    recentCronRuns.find((run) => run.job === "billing_reminders") ??
    null;

  return {
    recentCronRuns,
    emailQueue: {
      pending: emailPending.count ?? 0,
      failed: emailFailed.count ?? 0,
      sent24h: emailSent.count ?? 0,
      skipped: emailSkipped.count ?? 0,
    },
    automationQueue: {
      running: automationRunning.count ?? 0,
      failed24h: automationFailed.count ?? 0,
      success24h: automationSuccess.count ?? 0,
    },
    webhooks: { processed24h: webhooks.count ?? 0 },
    notifications: {
      total: notificationsTotal.count ?? 0,
      unread: notificationsUnread.count ?? 0,
      lastNotificationsJob,
    },
    storageConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    ),
    resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
  };
}

export type EmailTemplateStats = {
  total: number;
  sent: number;
  failed: number;
  byTemplate: Map<string, { total: number; sent: number; failed: number; skipped: number }>;
};

/** Delivery counts for the last 7 days, grouped by template key. */
export async function getEmailTemplateStatsForAdmin(
  supabase: SupabaseClient<Database>,
): Promise<EmailTemplateStats> {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent, error } = await supabase
    .from("email_deliveries")
    .select("template, status")
    .gte("created_at", since7d)
    .limit(2000);

  if (error) throw new Error(error.message);

  const byTemplate = new Map<
    string,
    { total: number; sent: number; failed: number; skipped: number }
  >();
  let sent = 0;
  let failed = 0;

  for (const row of recent ?? []) {
    const key = row.template || "unknown";
    const current = byTemplate.get(key) ?? { total: 0, sent: 0, failed: 0, skipped: 0 };
    current.total += 1;
    if (row.status === "sent") {
      current.sent += 1;
      sent += 1;
    }
    if (row.status === "failed") {
      current.failed += 1;
      failed += 1;
    }
    if (row.status === "skipped") current.skipped += 1;
    byTemplate.set(key, current);
  }

  return { total: recent?.length ?? 0, sent, failed, byTemplate };
}

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
