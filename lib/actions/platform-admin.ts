"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { runBackgroundJobs } from "@/lib/background/runBackgroundJobs";
import { PLAN_CATALOG, type PlanId } from "@/lib/billing/plan-catalog";
import { yearlyPriceFromMonthly } from "@/lib/billing/pricing";
import { writePlatformAudit } from "@/lib/platform/audit";
import { requirePlatformPermission } from "@/lib/platform/session";
import { isPlatformRole, PLATFORM_ROLES } from "@/lib/platform/roles";
import { createAdminClient } from "@/lib/supabase/admin";

const PLAN_IDS = PLAN_CATALOG.map((plan) => plan.id) as [PlanId, ...PlanId[]];
const INSPECT_COOKIE = "ewp_inspect";

export async function suspendUserAction(input: {
  userId: string;
  reason: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      userId: z.string().uuid(),
      reason: z.string().trim().min(10).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("users.write");
  const { error } = await admin.supabase
    .from("profiles")
    .update({
      account_status: "suspended",
      suspended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.userId);

  if (error) return actionError("Nu am putut suspenda utilizatorul.");

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "user.suspend",
    entityType: "user",
    entityId: parsed.data.userId,
    reason: parsed.data.reason,
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.userId}`);
  return actionSuccess("Utilizator suspendat.");
}

export async function reactivateUserAction(input: {
  userId: string;
  reason: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      userId: z.string().uuid(),
      reason: z.string().trim().min(10).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("users.write");
  const { error } = await admin.supabase
    .from("profiles")
    .update({
      account_status: "active",
      suspended_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.userId);

  if (error) return actionError("Nu am putut reactiva utilizatorul.");

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "user.reactivate",
    entityType: "user",
    entityId: parsed.data.userId,
    reason: parsed.data.reason,
  });

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${parsed.data.userId}`);
  return actionSuccess("Utilizator reactivat.");
}

export async function sendPasswordResetAction(input: {
  userId: string;
  reason: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      userId: z.string().uuid(),
      reason: z.string().trim().min(10).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("users.write");
  let email: string | null = null;
  try {
    const service = createAdminClient();
    const { data, error } = await service.auth.admin.getUserById(parsed.data.userId);
    if (error || !data.user?.email) return actionError("Nu am găsit emailul utilizatorului.");
    email = data.user.email;
    const { error: resetError } = await service.auth.resetPasswordForEmail(email);
    if (resetError) return actionError("Nu am putut trimite resetarea parolei.");
  } catch {
    return actionError("Service role indisponibil pentru resetare parolă.");
  }

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "user.password_reset",
    entityType: "user",
    entityId: parsed.data.userId,
    reason: parsed.data.reason,
    metadata: { emailDomain: email?.split("@")[1] ?? null },
  });

  return actionSuccess("Email de resetare parolă trimis.");
}

export async function extendTrialAction(input: {
  workspaceId: string;
  days: number;
  reason: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      workspaceId: z.string().uuid(),
      days: z.number().int().min(1).max(90),
      reason: z.string().trim().min(10).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("subscriptions.write");
  const trialEnd = new Date(Date.now() + parsed.data.days * 86_400_000).toISOString();

  const { data: existing } = await admin.supabase
    .from("subscriptions")
    .select("id")
    .eq("workspace_id", parsed.data.workspaceId)
    .maybeSingle();

  const { error } = existing
    ? await admin.supabase
        .from("subscriptions")
        .update({
          status: "trialing",
          trial_end: trialEnd,
          updated_at: new Date().toISOString(),
        })
        .eq("workspace_id", parsed.data.workspaceId)
    : await admin.supabase.from("subscriptions").insert({
        workspace_id: parsed.data.workspaceId,
        status: "trialing",
        plan: "solo",
        trial_end: trialEnd,
      });

  if (error) return actionError("Nu am putut extinde trial-ul.");

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "subscription.extend_trial",
    entityType: "workspace",
    entityId: parsed.data.workspaceId,
    reason: parsed.data.reason,
    metadata: { days: parsed.data.days, trialEnd },
  });

  revalidatePath("/admin/workspaces");
  revalidatePath(`/admin/workspaces/${parsed.data.workspaceId}`);
  revalidatePath("/admin/subscriptions");
  return actionSuccess(`Trial extins cu ${parsed.data.days} zile.`);
}

export async function changeWorkspacePlanAction(input: {
  workspaceId: string;
  planId: string;
  reason: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      workspaceId: z.string().uuid(),
      planId: z.enum(PLAN_IDS),
      reason: z.string().trim().min(10).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("subscriptions.write");
  const { data: workspace } = await admin.supabase
    .from("workspaces")
    .select("id, plan, name")
    .eq("id", parsed.data.workspaceId)
    .maybeSingle();
  if (!workspace) return actionError("Workspace-ul nu a fost găsit.");

  await admin.supabase
    .from("workspaces")
    .update({ plan: parsed.data.planId, updated_at: new Date().toISOString() })
    .eq("id", workspace.id);

  const { data: existing } = await admin.supabase
    .from("subscriptions")
    .select("id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (existing) {
    await admin.supabase
      .from("subscriptions")
      .update({ plan: parsed.data.planId, updated_at: new Date().toISOString() })
      .eq("workspace_id", workspace.id);
  } else {
    await admin.supabase.from("subscriptions").insert({
      workspace_id: workspace.id,
      plan: parsed.data.planId,
      status: "active",
    });
  }

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "workspace.change_plan",
    entityType: "workspace",
    entityId: workspace.id,
    reason: parsed.data.reason,
    metadata: { from: workspace.plan, to: parsed.data.planId },
  });

  revalidatePath("/admin/workspaces");
  revalidatePath(`/admin/workspaces/${workspace.id}`);
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/plans");
  return actionSuccess("Plan actualizat.");
}

export async function startInspectSessionAction(input: {
  workspaceId: string;
  reason: string;
}): Promise<ActionResult<{ sessionId: string }>> {
  const parsed = z
    .object({
      workspaceId: z.string().uuid(),
      reason: z.string().trim().min(10).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("workspaces.inspect");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { data, error } = await admin.supabase
    .from("admin_inspect_sessions")
    .insert({
      admin_id: admin.user.id,
      workspace_id: parsed.data.workspaceId,
      reason: parsed.data.reason,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !data) return actionError("Nu am putut deschide sesiunea de inspectare.");

  const cookieStore = await cookies();
  cookieStore.set(INSPECT_COOKIE, data.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60,
  });

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "workspace.inspect_start",
    entityType: "workspace",
    entityId: parsed.data.workspaceId,
    reason: parsed.data.reason,
    metadata: { sessionId: data.id },
  });

  return actionSuccess("Sesiune de inspectare deschisă (read-only, 60 min).", {
    sessionId: data.id,
  });
}

export async function endInspectSessionAction(): Promise<ActionResult> {
  const admin = await requirePlatformPermission("workspaces.inspect");
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(INSPECT_COOKIE)?.value;
  if (!sessionId) return actionSuccess("Nicio sesiune activă.");

  await admin.supabase
    .from("admin_inspect_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("admin_id", admin.user.id);

  cookieStore.delete(INSPECT_COOKIE);

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "workspace.inspect_end",
    entityType: "admin_inspect_session",
    entityId: sessionId,
  });

  return actionSuccess("Sesiune de inspectare închisă.");
}

export async function runCronNowAction(input: { reason: string }): Promise<ActionResult> {
  const parsed = z.object({ reason: z.string().trim().min(10).max(500) }).safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("cron.run");

  try {
    const summary = await runBackgroundJobs({ source: "admin_run_now" });
    await writePlatformAudit(admin.supabase, {
      actorId: admin.user.id,
      action: "cron.run_now",
      entityType: "cron",
      entityId: "runner",
      reason: parsed.data.reason,
      metadata: {
        ok: summary.ok,
        processed: summary.jobs.reduce((s, j) => s + j.processed, 0),
        errors: summary.jobs.reduce((s, j) => s + j.errors, 0),
      },
    });
    revalidatePath("/admin/cron");
    revalidatePath("/admin/jobs");
    revalidatePath("/admin/system/health");
    return actionSuccess(summary.ok ? "Cron rulat cu succes." : "Cron rulat cu erori parțiale.");
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Cron eșuat.");
  }
}

export async function updateFeedbackStatusAction(input: {
  feedbackId: string;
  status: string;
  priority?: string;
  notes?: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      feedbackId: z.string().uuid(),
      status: z.enum(["new", "triaged", "resolved", "dismissed"]),
      priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
      notes: z.string().trim().max(2000).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("feedback.write");
  const { error } = await admin.supabase
    .from("user_feedback")
    .update({
      status: parsed.data.status,
      priority: parsed.data.priority ?? null,
      admin_notes: parsed.data.notes ?? null,
    })
    .eq("id", parsed.data.feedbackId);

  if (error) return actionError("Nu am putut actualiza feedback-ul.");

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "feedback.update",
    entityType: "user_feedback",
    entityId: parsed.data.feedbackId,
    metadata: { status: parsed.data.status, priority: parsed.data.priority ?? null },
  });

  revalidatePath("/admin/feedback");
  return actionSuccess("Feedback actualizat.");
}

export async function resolveSystemErrorAction(input: {
  errorId: string;
  notes?: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      errorId: z.string().uuid(),
      notes: z.string().trim().max(2000).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("system.write");
  const { error } = await admin.supabase
    .from("system_errors")
    .update({
      resolved_at: new Date().toISOString(),
      resolved_by: admin.user.id,
      notes: parsed.data.notes ?? null,
    })
    .eq("id", parsed.data.errorId);

  if (error) return actionError("Nu am putut marca eroarea ca rezolvată.");

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "system_error.resolve",
    entityType: "system_error",
    entityId: parsed.data.errorId,
  });

  revalidatePath("/admin/system/errors");
  return actionSuccess("Eroare marcată ca rezolvată.");
}

export async function updatePlatformSettingAction(input: {
  key: string;
  value: Record<string, unknown>;
  reason: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      key: z.string().min(1).max(80),
      value: z.record(z.string(), z.unknown()),
      reason: z.string().trim().min(10).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("settings.write");
  const { error } = await admin.supabase.from("platform_settings").upsert({
    key: parsed.data.key,
    value: parsed.data.value as never,
    updated_by: admin.user.id,
    updated_at: new Date().toISOString(),
  });

  if (error) return actionError("Nu am putut salva setarea.");

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "settings.update",
    entityType: "platform_setting",
    entityId: parsed.data.key,
    reason: parsed.data.reason,
  });

  revalidatePath("/admin/settings");
  return actionSuccess("Setare actualizată.");
}

export async function updatePlatformAdminRoleAction(input: {
  userId: string;
  role: string;
  reason: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      userId: z.string().uuid(),
      role: z.enum(PLATFORM_ROLES),
      reason: z.string().trim().min(10).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("admins.write");
  if (!isPlatformRole(parsed.data.role)) return actionError("Rol invalid.");

  if (parsed.data.userId === admin.user.id && parsed.data.role !== "platform_super_admin") {
    const { count } = await admin.supabase
      .from("platform_admins")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "platform_super_admin")
      .is("disabled_at", null);
    if ((count ?? 0) <= 1) {
      return actionError("Nu poți renunța la ultimul super-admin.");
    }
  }

  const { error } = await admin.supabase.from("platform_admins").upsert({
    user_id: parsed.data.userId,
    role: parsed.data.role,
    disabled_at: null,
    updated_at: new Date().toISOString(),
  });

  if (error) return actionError("Nu am putut actualiza rolul.");

  await admin.supabase
    .from("profiles")
    .update({ is_platform_admin: true, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.userId);

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "admins.update_role",
    entityType: "platform_admin",
    entityId: parsed.data.userId,
    reason: parsed.data.reason,
    metadata: { role: parsed.data.role },
  });

  revalidatePath("/admin/admins");
  return actionSuccess("Rol admin actualizat.");
}

export async function updatePlanAction(input: {
  planId: string;
  name: string;
  description: string;
  priceMonthly: number;
  visible: boolean;
  active: boolean;
  highlighted: boolean;
  reason: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      planId: z.enum(PLAN_IDS),
      name: z.string().trim().min(1).max(80),
      description: z.string().trim().max(500),
      priceMonthly: z.number().int().min(0).max(1_000_000),
      visible: z.boolean(),
      active: z.boolean(),
      highlighted: z.boolean(),
      reason: z.string().trim().min(10).max(500),
    })
    .safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformPermission("plans.write");

  await admin.supabase
    .from("plans")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      visible: parsed.data.visible,
      active: parsed.data.active,
      highlighted: parsed.data.highlighted,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.planId);

  const { data: current } = await admin.supabase
    .from("plan_versions")
    .select("*")
    .eq("plan_id", parsed.data.planId)
    .eq("is_current", true)
    .maybeSingle();

  if (current && current.price_monthly !== parsed.data.priceMonthly) {
    await admin.supabase
      .from("plan_versions")
      .update({ is_current: false })
      .eq("id", current.id);

    await admin.supabase.from("plan_versions").insert({
      plan_id: parsed.data.planId,
      version: current.version + 1,
      price_monthly: parsed.data.priceMonthly,
      price_yearly: yearlyPriceFromMonthly(parsed.data.priceMonthly),
      stripe_price_monthly_id: null,
      stripe_price_yearly_id: null,
      trial_days: current.trial_days,
      limits: current.limits,
      features: current.features,
      is_current: true,
    });
  } else if (current) {
    // metadata-only change on plan row; price unchanged
  }

  await writePlatformAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "plans.update",
    entityType: "plan",
    entityId: parsed.data.planId,
    reason: parsed.data.reason,
    metadata: {
      priceMonthly: parsed.data.priceMonthly,
      visible: parsed.data.visible,
      active: parsed.data.active,
    },
  });

  revalidatePath("/admin/plans");
  revalidatePath(`/admin/plans/${parsed.data.planId}`);
  return actionSuccess("Plan actualizat.");
}
