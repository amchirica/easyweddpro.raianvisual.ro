"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { assertPlanFeature } from "@/lib/billing/assert-feature";
import { automationFormSchema } from "@/lib/validations/automations";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";
import type { Database, Json } from "@/types/database";

type AutomationRow = Database["public"]["Tables"]["automations"]["Row"];

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function createAutomationAction(
  input: unknown,
): Promise<ActionResult<{ automation: AutomationRow }>> {
  const parsed = automationFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("automations.manage");
  } catch {
    return actionError("Nu ai permisiunea de a gestiona automatizări.");
  }

  const feature = await assertPlanFeature(ctx.supabase, ctx.activeWorkspace.id, "automations");
  if (!feature.ok) return actionError(feature.reason);

  const data = parsed.data;

  const { data: automation, error } = await ctx.supabase
    .from("automations")
    .insert({
      workspace_id: ctx.activeWorkspace.id,
      name: data.name.trim(),
      description: emptyToNull(data.description),
      trigger_key: data.triggerKey,
      channel: data.channel,
      enabled: data.enabled,
      conditions: data.conditions as unknown as Json,
      actions: data.actions as unknown as Json,
      created_by: ctx.user.id,
    })
    .select("*")
    .single();

  if (error || !automation) {
    if (process.env.NODE_ENV === "development") {
      console.error("[automations.create]", error?.message);
    }
    return actionError("Nu am putut crea automatizarea.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "automation",
    entityId: automation.id,
    action: "automation.created",
    title: "Automatizare creată",
    description: automation.name,
  });

  revalidatePath("/dashboard/automations");
  return actionSuccess("Automatizare creată.", { automation });
}

export async function updateAutomationAction(
  automationId: string,
  input: unknown,
): Promise<ActionResult<{ automation: AutomationRow }>> {
  const parsed = automationFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("automations.manage");
  } catch {
    return actionError("Nu ai permisiunea de a gestiona automatizări.");
  }

  const feature = await assertPlanFeature(ctx.supabase, ctx.activeWorkspace.id, "automations");
  if (!feature.ok) return actionError(feature.reason);

  const data = parsed.data;

  const { data: automation, error } = await ctx.supabase
    .from("automations")
    .update({
      name: data.name.trim(),
      description: emptyToNull(data.description),
      trigger_key: data.triggerKey,
      channel: data.channel,
      enabled: data.enabled,
      conditions: data.conditions as unknown as Json,
      actions: data.actions as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", automationId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut actualiza automatizarea.");
  if (!automation) return actionError("Automatizarea nu a fost găsită.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "automation",
    entityId: automation.id,
    action: "automation.updated",
    title: "Automatizare actualizată",
    description: automation.name,
  });

  revalidatePath("/dashboard/automations");
  revalidatePath(`/dashboard/automations/${automationId}`);
  return actionSuccess("Automatizare actualizată.", { automation });
}

export async function toggleAutomationAction(
  automationId: string,
  enabled: boolean,
): Promise<ActionResult<{ automation: AutomationRow }>> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("automations.manage");
  } catch {
    return actionError("Nu ai permisiunea de a gestiona automatizări.");
  }

  const feature = await assertPlanFeature(ctx.supabase, ctx.activeWorkspace.id, "automations");
  if (!feature.ok) return actionError(feature.reason);

  const { data: automation, error } = await ctx.supabase
    .from("automations")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("id", automationId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut schimba starea automatizării.");
  if (!automation) return actionError("Automatizarea nu a fost găsită.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "automation",
    entityId: automation.id,
    action: enabled ? "automation.enabled" : "automation.disabled",
    title: enabled ? "Automatizare activată" : "Automatizare dezactivată",
    description: automation.name,
  });

  revalidatePath("/dashboard/automations");
  revalidatePath(`/dashboard/automations/${automationId}`);
  return actionSuccess(enabled ? "Automatizare activată." : "Automatizare dezactivată.", {
    automation,
  });
}

export async function duplicateAutomationAction(
  automationId: string,
): Promise<ActionResult<{ automationId: string }>> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("automations.manage");
  } catch {
    return actionError("Nu ai permisiunea de a gestiona automatizări.");
  }

  const feature = await assertPlanFeature(ctx.supabase, ctx.activeWorkspace.id, "automations");
  if (!feature.ok) return actionError(feature.reason);

  const { data: source } = await ctx.supabase
    .from("automations")
    .select("*")
    .eq("id", automationId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!source) return actionError("Automatizarea nu a fost găsită.");

  const { data: created, error } = await ctx.supabase
    .from("automations")
    .insert({
      workspace_id: ctx.activeWorkspace.id,
      name: `${source.name} (copie)`,
      description: source.description,
      trigger_key: source.trigger_key,
      channel: source.channel,
      enabled: false,
      config: source.config,
      conditions: source.conditions,
      actions: source.actions,
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !created) return actionError("Nu am putut duplica automatizarea.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "automation",
    entityId: created.id,
    action: "automation.duplicated",
    title: "Automatizare duplicată",
    description: source.name,
    metadata: { source_id: automationId },
  });

  revalidatePath("/dashboard/automations");
  return actionSuccess("Automatizare duplicată.", { automationId: created.id });
}

export async function deleteAutomationAction(automationId: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("automations.manage");
  } catch {
    return actionError("Nu ai permisiunea de a gestiona automatizări.");
  }

  const { data: automation } = await ctx.supabase
    .from("automations")
    .select("id, name")
    .eq("id", automationId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!automation) return actionError("Automatizarea nu a fost găsită.");

  const { error } = await ctx.supabase
    .from("automations")
    .update({ deleted_at: new Date().toISOString(), enabled: false, updated_at: new Date().toISOString() })
    .eq("id", automationId)
    .eq("workspace_id", ctx.activeWorkspace.id);

  if (error) return actionError("Nu am putut șterge automatizarea.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "automation",
    entityId: automationId,
    action: "automation.deleted",
    title: "Automatizare ștearsă",
    description: automation.name,
  });

  revalidatePath("/dashboard/automations");
  return actionSuccess("Automatizare ștearsă.");
}
