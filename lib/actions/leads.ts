"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { runAutomationsForTrigger } from "@/lib/automations/engine";
import { canCreateResource, getUsageForWorkspace } from "@/lib/billing/plans";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/constants";
import { normalizePhone } from "@/lib/format";
import {
  convertLeadSchema,
  leadFormSchema,
  leadNoteSchema,
  leadStatusSchema,
} from "@/lib/validations/crm";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";
import type { Database } from "@/types/database";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function mapLeadInput(
  data: ReturnType<typeof leadFormSchema.parse>,
  workspaceId: string,
  userId: string,
) {
  return {
    workspace_id: workspaceId,
    name: data.name.trim(),
    email: emptyToNull(data.email),
    phone: normalizePhone(data.phone),
    event_type: emptyToNull(data.eventType),
    event_date: emptyToNull(data.eventDate),
    city: emptyToNull(data.city),
    venue: emptyToNull(data.venue),
    budget: data.budget ?? null,
    currency: data.currency || "RON",
    source: emptyToNull(data.source),
    services: data.services,
    notes: emptyToNull(data.notes),
    owner_id: data.ownerId ?? userId,
    created_by: userId,
    estimated_value: data.estimatedValue ?? null,
    follow_up_date: emptyToNull(data.followUpDate),
    status: data.status,
    tags: data.tags,
    lost_reason: data.status === "lost" ? emptyToNull(data.lostReason) : null,
  };
}

export async function createLeadAction(
  input: unknown,
): Promise<ActionResult<{ lead: LeadRow }>> {
  const parsed = leadFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.write");
  } catch {
    return actionError("Nu ai permisiunea de a crea leaduri.");
  }

  const usage = await getUsageForWorkspace(ctx.supabase, ctx.activeWorkspace.id);
  const limitCheck = canCreateResource(usage.plan, "lead", usage);
  if (!limitCheck.ok) {
    return actionError(limitCheck.reason);
  }

  const payload = mapLeadInput(parsed.data, ctx.activeWorkspace.id, ctx.user.id);

  const { data, error } = await ctx.supabase
    .from("leads")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    if (process.env.NODE_ENV === "development") {
      console.error("[leads.create]", error?.message);
    }
    return actionError("Nu am putut crea leadul. Încearcă din nou.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "lead",
    entityId: data.id,
    action: "lead.created",
    title: "Lead creat",
    description: data.name,
  });

  // Fire-and-forget: automation failures must never break lead creation.
  try {
    await runAutomationsForTrigger({
      supabase: ctx.supabase,
      workspaceId: ctx.activeWorkspace.id,
      triggerKey: "lead_created",
      entityId: data.id,
      actorId: ctx.user.id,
      metadata: {
        source: data.source,
        eventType: data.event_type,
        city: data.city,
        status: data.status,
      },
      idempotencyKey: `lead_created:${data.id}`,
    });
  } catch (automationError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[automations.lead_created]", automationError);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  return actionSuccess("Lead creat cu succes.", { lead: data });
}

export async function updateLeadAction(
  leadId: string,
  input: unknown,
): Promise<ActionResult<{ lead: LeadRow }>> {
  if (!leadId) return actionError("Lead invalid.");

  const parsed = leadFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.write");
  } catch {
    return actionError("Nu ai permisiunea de a edita leaduri.");
  }
  const payload = mapLeadInput(parsed.data, ctx.activeWorkspace.id, ctx.user.id);
  // Never allow workspace_id / created_by override from client
  const updatePayload = { ...payload };
  delete (updatePayload as { workspace_id?: string }).workspace_id;
  delete (updatePayload as { created_by?: string }).created_by;

  const { data, error } = await ctx.supabase
    .from("leads")
    .update({ ...updatePayload, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[leads.update]", error.message);
    }
    return actionError("Nu am putut actualiza leadul.");
  }
  if (!data) {
    return actionError("Leadul nu a fost găsit.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "lead",
    entityId: data.id,
    action: "lead.updated",
    title: "Lead actualizat",
    description: data.name,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);
  return actionSuccess("Lead actualizat.", { lead: data });
}

export async function updateLeadStatusAction(
  leadId: string,
  input: unknown,
): Promise<ActionResult<{ lead: LeadRow }>> {
  const parsed = leadStatusSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Status invalid");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.write");
  } catch {
    return actionError("Nu ai permisiunea de a schimba statusul.");
  }
  const status = parsed.data.status as LeadStatus;

  const { data, error } = await ctx.supabase
    .from("leads")
    .update({
      status,
      lost_reason: status === "lost" ? emptyToNull(parsed.data.lostReason) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error || !data) {
    return actionError("Nu am putut schimba statusul.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "lead",
    entityId: data.id,
    action: "lead.status_changed",
    title: "Status lead schimbat",
    description: LEAD_STATUS_LABELS[status],
    metadata: { status },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);
  return actionSuccess("Status actualizat.", { lead: data });
}

export async function addLeadNoteAction(
  leadId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = leadNoteSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Notă invalidă");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.write");
  } catch {
    return actionError("Nu ai permisiunea de a adăuga note.");
  }

  const { data: lead } = await ctx.supabase
    .from("leads")
    .select("id, notes, name")
    .eq("id", leadId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) return actionError("Leadul nu a fost găsit.");

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const nextNotes = [lead.notes, `[${stamp}] ${parsed.data.note}`]
    .filter(Boolean)
    .join("\n\n");

  const { error } = await ctx.supabase
    .from("leads")
    .update({ notes: nextNotes, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("workspace_id", ctx.activeWorkspace.id);

  if (error) return actionError("Nu am putut salva nota.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "lead",
    entityId: leadId,
    action: "lead.note_added",
    title: "Notă adăugată",
    description: parsed.data.note.slice(0, 180),
  });

  revalidatePath(`/dashboard/leads/${leadId}`);
  revalidatePath("/dashboard/leads");
  return actionSuccess("Notă adăugată.");
}

export async function deleteLeadAction(leadId: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.delete");
  } catch {
    return actionError("Nu ai permisiunea de a șterge leaduri.");
  }

  const { data: lead } = await ctx.supabase
    .from("leads")
    .select("id, name")
    .eq("id", leadId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) return actionError("Leadul nu a fost găsit.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "lead",
    entityId: leadId,
    action: "lead.deleted",
    title: "Lead șters",
    description: lead.name,
  });

  const { error } = await ctx.supabase
    .from("leads")
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("workspace_id", ctx.activeWorkspace.id);

  if (error) return actionError("Nu am putut șterge leadul.");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  return actionSuccess("Lead șters.");
}

export async function convertLeadToClientAction(
  input: unknown,
): Promise<ActionResult<{ clientId: string }>> {
  const parsed = convertLeadSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  if (parsed.data.mode === "existing" && !parsed.data.existingClientId) {
    return actionError("Selectează clientul existent.");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.write");
  } catch {
    return actionError("Nu ai permisiunea de a converti leaduri.");
  }

  const { data: clientId, error } = await ctx.supabase.rpc("convert_lead_to_client", {
    p_lead_id: parsed.data.leadId,
    p_existing_client_id:
      parsed.data.mode === "existing" ? parsed.data.existingClientId ?? null : null,
  });

  if (error || !clientId) {
    if (process.env.NODE_ENV === "development") {
      console.error("[leads.convert]", error?.message);
    }
    const msg = error?.message ?? "";
    if (msg.includes("lead_not_found")) return actionError("Leadul nu a fost găsit.");
    if (msg.includes("client_not_found")) return actionError("Clientul selectat nu există.");
    if (msg.includes("forbidden")) return actionError("Nu ai acces la acest lead.");
    return actionError("Conversia a eșuat. Încearcă din nou.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${parsed.data.leadId}`);
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${clientId}`);

  return actionSuccess("Lead convertit în client.", { clientId });
}

export async function findMatchingClientsAction(leadId: string): Promise<
  ActionResult<{
    matches: Array<{ id: string; name: string; email: string | null; phone: string | null }>;
  }>
> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("crm.read");
  } catch {
    return actionError("Nu ai acces.");
  }

  const { data: lead } = await ctx.supabase
    .from("leads")
    .select("email, phone")
    .eq("id", leadId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) return actionError("Leadul nu a fost găsit.");

  let query = ctx.supabase
    .from("clients")
    .select("id, name, email, phone")
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .limit(10);

  if (lead.email) {
    query = query.or(
      [`email.eq.${lead.email}`, lead.phone ? `phone.eq.${lead.phone}` : null]
        .filter(Boolean)
        .join(","),
    );
  } else if (lead.phone) {
    query = query.eq("phone", lead.phone);
  } else {
    return actionSuccess("Nicio potrivire.", { matches: [] });
  }

  const { data, error } = await query;
  if (error) return actionError("Nu am putut căuta clienți existenți.");

  return actionSuccess("Potriviri încărcate.", { matches: data ?? [] });
}
