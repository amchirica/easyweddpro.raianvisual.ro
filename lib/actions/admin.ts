"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { PLAN_CATALOG, type PlanId } from "@/lib/billing/plan-catalog";
import { requirePlatformAdmin } from "@/lib/workspace/session";

const PLAN_IDS = PLAN_CATALOG.map((plan) => plan.id) as [PlanId, ...PlanId[]];

const workspaceIdSchema = z.object({
  workspaceId: z.string().uuid("Workspace invalid."),
});

const changePlanSchema = z.object({
  workspaceId: z.string().uuid("Workspace invalid."),
  planId: z.enum(PLAN_IDS),
});

async function findWorkspace(supabase: Awaited<ReturnType<typeof requirePlatformAdmin>>["supabase"], workspaceId: string) {
  const { data } = await supabase.from("workspaces").select("id, name, plan").eq("id", workspaceId).maybeSingle();
  return data;
}

async function upsertSubscriptionStatus(
  supabase: Awaited<ReturnType<typeof requirePlatformAdmin>>["supabase"],
  workspaceId: string,
  status: string,
) {
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existing) {
    return supabase
      .from("subscriptions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("workspace_id", workspaceId);
  }

  return supabase.from("subscriptions").insert({ workspace_id: workspaceId, status, plan: "free" });
}

export async function suspendWorkspaceAction(input: { workspaceId: string }): Promise<ActionResult> {
  const parsed = workspaceIdSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformAdmin();
  const workspace = await findWorkspace(admin.supabase, parsed.data.workspaceId);
  if (!workspace) return actionError("Workspace-ul nu a fost găsit.");

  const { error } = await upsertSubscriptionStatus(admin.supabase, workspace.id, "suspended");
  if (error) return actionError("Nu am putut suspenda workspace-ul.");

  await logActivity(admin.supabase, {
    workspaceId: workspace.id,
    actorId: admin.user.id,
    entityType: "workspace",
    entityId: workspace.id,
    action: "admin.workspace_suspended",
    title: "Workspace suspendat de admin platformă",
    description: workspace.name,
  });

  revalidatePath("/admin/workspaces");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin");
  return actionSuccess("Workspace suspendat.");
}

export async function activateWorkspaceAction(input: { workspaceId: string }): Promise<ActionResult> {
  const parsed = workspaceIdSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");

  const admin = await requirePlatformAdmin();
  const workspace = await findWorkspace(admin.supabase, parsed.data.workspaceId);
  if (!workspace) return actionError("Workspace-ul nu a fost găsit.");

  const { error } = await upsertSubscriptionStatus(admin.supabase, workspace.id, "active");
  if (error) return actionError("Nu am putut reactiva workspace-ul.");

  await logActivity(admin.supabase, {
    workspaceId: workspace.id,
    actorId: admin.user.id,
    entityType: "workspace",
    entityId: workspace.id,
    action: "admin.workspace_activated",
    title: "Workspace reactivat de admin platformă",
    description: workspace.name,
  });

  revalidatePath("/admin/workspaces");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin");
  return actionSuccess("Workspace reactivat.");
}

export async function changePlanAction(input: { workspaceId: string; planId: string }): Promise<ActionResult> {
  const parsed = changePlanSchema.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0]?.message ?? "Plan invalid.");

  const admin = await requirePlatformAdmin();
  const workspace = await findWorkspace(admin.supabase, parsed.data.workspaceId);
  if (!workspace) return actionError("Workspace-ul nu a fost găsit.");

  const { error: workspaceError } = await admin.supabase
    .from("workspaces")
    .update({ plan: parsed.data.planId, updated_at: new Date().toISOString() })
    .eq("id", workspace.id);
  if (workspaceError) return actionError("Nu am putut actualiza planul workspace-ului.");

  const { data: existingSub } = await admin.supabase
    .from("subscriptions")
    .select("id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const { error: subError } = existingSub
    ? await admin.supabase
        .from("subscriptions")
        .update({ plan: parsed.data.planId, updated_at: new Date().toISOString() })
        .eq("workspace_id", workspace.id)
    : await admin.supabase
        .from("subscriptions")
        .insert({ workspace_id: workspace.id, plan: parsed.data.planId, status: "active" });

  if (subError) return actionError("Planul workspace-ului a fost salvat, dar abonamentul nu a putut fi actualizat.");

  await logActivity(admin.supabase, {
    workspaceId: workspace.id,
    actorId: admin.user.id,
    entityType: "workspace",
    entityId: workspace.id,
    action: "admin.plan_changed",
    title: "Plan schimbat de admin platformă",
    description: `${workspace.plan} → ${parsed.data.planId}`,
    metadata: { fromPlan: workspace.plan, toPlan: parsed.data.planId },
  });

  revalidatePath("/admin/workspaces");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin/plans");
  revalidatePath("/admin");
  return actionSuccess("Plan actualizat.");
}
