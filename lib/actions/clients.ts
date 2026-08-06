"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { canCreateResource, getUsageForWorkspace } from "@/lib/billing/plans";
import { normalizePhone } from "@/lib/format";
import { clientFormSchema } from "@/lib/validations/crm";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";
import type { Database } from "@/types/database";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function createClientAction(
  input: unknown,
): Promise<ActionResult<{ client: ClientRow }>> {
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.write");
  } catch {
    return actionError("Nu ai permisiunea de a crea clienți.");
  }

  const usage = await getUsageForWorkspace(ctx.supabase, ctx.activeWorkspace.id);
  const limitCheck = canCreateResource(usage.plan, "client", usage);
  if (!limitCheck.ok) {
    return actionError(limitCheck.reason);
  }

  const data = parsed.data;

  const { data: client, error } = await ctx.supabase
    .from("clients")
    .insert({
      workspace_id: ctx.activeWorkspace.id,
      name: data.name.trim(),
      email: emptyToNull(data.email),
      phone: normalizePhone(data.phone),
      company: emptyToNull(data.company),
      address: emptyToNull(data.address),
      city: emptyToNull(data.city),
      country: emptyToNull(data.country),
      event_type: emptyToNull(data.eventType),
      event_date: emptyToNull(data.eventDate),
      notes: emptyToNull(data.notes),
      tags: data.tags,
      source: emptyToNull(data.source),
      status: data.status,
      created_by: ctx.user.id,
    })
    .select("*")
    .single();

  if (error || !client) {
    if (process.env.NODE_ENV === "development") {
      console.error("[clients.create]", error?.message);
    }
    return actionError("Nu am putut crea clientul.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "client",
    entityId: client.id,
    action: "client.created",
    title: "Client creat",
    description: client.name,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  return actionSuccess("Client creat.", { client });
}

export async function updateClientAction(
  clientId: string,
  input: unknown,
): Promise<ActionResult<{ client: ClientRow }>> {
  const parsed = clientFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.write");
  } catch {
    return actionError("Nu ai permisiunea de a edita clienți.");
  }
  const data = parsed.data;

  const { data: client, error } = await ctx.supabase
    .from("clients")
    .update({
      name: data.name.trim(),
      email: emptyToNull(data.email),
      phone: normalizePhone(data.phone),
      company: emptyToNull(data.company),
      address: emptyToNull(data.address),
      city: emptyToNull(data.city),
      country: emptyToNull(data.country),
      event_type: emptyToNull(data.eventType),
      event_date: emptyToNull(data.eventDate),
      notes: emptyToNull(data.notes),
      tags: data.tags,
      source: emptyToNull(data.source),
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut actualiza clientul.");
  if (!client) return actionError("Clientul nu a fost găsit.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "client",
    entityId: client.id,
    action: "client.updated",
    title: "Client actualizat",
    description: client.name,
  });

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return actionSuccess("Client actualizat.", { client });
}

export async function archiveClientAction(clientId: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.write");
  } catch {
    return actionError("Nu ai permisiunea de a arhiva clienți.");
  }

  const { data: client } = await ctx.supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!client) return actionError("Clientul nu a fost găsit.");

  const now = new Date().toISOString();
  const { error } = await ctx.supabase
    .from("clients")
    .update({
      archived_at: now,
      status: "past",
      updated_at: now,
    })
    .eq("id", clientId)
    .eq("workspace_id", ctx.activeWorkspace.id);

  if (error) return actionError("Nu am putut arhiva clientul.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "client",
    entityId: clientId,
    action: "client.archived",
    title: "Client arhivat",
    description: client.name,
  });

  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);
  return actionSuccess("Client arhivat.");
}

export async function deleteClientAction(clientId: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.delete");
  } catch {
    return actionError("Nu ai permisiunea de a șterge clienți.");
  }

  const { data: client } = await ctx.supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!client) return actionError("Clientul nu a fost găsit.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "client",
    entityId: clientId,
    action: "client.deleted",
    title: "Client șters",
    description: client.name,
  });

  const { error } = await ctx.supabase
    .from("clients")
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("workspace_id", ctx.activeWorkspace.id);

  if (error) return actionError("Nu am putut șterge clientul.");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  return actionSuccess("Client șters.");
}
