"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { softDeleteRow } from "@/lib/data/soft-delete";
import { calendarEventFormSchema, moveCalendarEventSchema } from "@/lib/validations/calendar";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";
import type { Database, Json } from "@/types/database";

type CalendarEventRow = Database["public"]["Tables"]["calendar_events"]["Row"];

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toIso(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function createCalendarEventAction(
  input: unknown,
): Promise<ActionResult<{ event: CalendarEventRow }>> {
  const parsed = calendarEventFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("calendar.write");
  } catch {
    return actionError("Nu ai permisiunea de a crea evenimente.");
  }
  const data = parsed.data;

  const { data: event, error } = await ctx.supabase
    .from("calendar_events")
    .insert({
      workspace_id: ctx.activeWorkspace.id,
      title: data.title.trim(),
      description: emptyToNull(data.description),
      event_type: data.eventType.trim(),
      starts_at: toIso(data.startsAt) ?? data.startsAt,
      ends_at: toIso(data.endsAt) ?? data.endsAt,
      all_day: data.allDay,
      location: emptyToNull(data.location),
      client_id: data.clientId,
      project_id: data.projectId,
      contract_id: data.contractId,
      member_ids: data.memberIds,
      color: emptyToNull(data.color),
      status: data.status,
      notes: emptyToNull(data.notes),
      reminder_at: toIso(data.reminderAt),
      recurrence: (data.recurrence ?? null) as Json | null,
      created_by: ctx.user.id,
    })
    .select("*")
    .single();

  if (error || !event) {
    if (process.env.NODE_ENV === "development") {
      console.error("[calendar.create]", error?.message);
    }
    return actionError("Nu am putut crea evenimentul.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "calendar_event",
    entityId: event.id,
    action: "calendar_event.created",
    title: "Eveniment creat",
    description: event.title,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  return actionSuccess("Eveniment creat.", { event });
}

export async function updateCalendarEventAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<{ event: CalendarEventRow }>> {
  const parsed = calendarEventFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("calendar.write");
  } catch {
    return actionError("Nu ai permisiunea de a edita evenimente.");
  }
  const data = parsed.data;

  const { data: event, error } = await ctx.supabase
    .from("calendar_events")
    .update({
      title: data.title.trim(),
      description: emptyToNull(data.description),
      event_type: data.eventType.trim(),
      starts_at: toIso(data.startsAt) ?? data.startsAt,
      ends_at: toIso(data.endsAt) ?? data.endsAt,
      all_day: data.allDay,
      location: emptyToNull(data.location),
      client_id: data.clientId,
      project_id: data.projectId,
      contract_id: data.contractId,
      member_ids: data.memberIds,
      color: emptyToNull(data.color),
      status: data.status,
      notes: emptyToNull(data.notes),
      reminder_at: toIso(data.reminderAt),
      recurrence: (data.recurrence ?? null) as Json | null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut actualiza evenimentul.");
  if (!event) return actionError("Evenimentul nu a fost găsit.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "calendar_event",
    entityId: event.id,
    action: "calendar_event.updated",
    title: "Eveniment actualizat",
    description: event.title,
  });

  revalidatePath("/dashboard/calendar");
  return actionSuccess("Eveniment actualizat.", { event });
}

export async function moveCalendarEventAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<{ event: CalendarEventRow }>> {
  const parsed = moveCalendarEventSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("calendar.write");
  } catch {
    return actionError("Nu ai permisiunea de a reprograma evenimente.");
  }
  const data = parsed.data;

  const { data: event, error } = await ctx.supabase
    .from("calendar_events")
    .update({
      starts_at: toIso(data.startsAt) ?? data.startsAt,
      ends_at: toIso(data.endsAt) ?? data.endsAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut reprograma evenimentul.");
  if (!event) return actionError("Evenimentul nu a fost găsit.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "calendar_event",
    entityId: event.id,
    action: "calendar_event.moved",
    title: "Eveniment reprogramat",
    description: event.title,
  });

  revalidatePath("/dashboard/calendar");
  return actionSuccess("Eveniment reprogramat.", { event });
}

export async function deleteCalendarEventAction(eventId: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("calendar.write");
  } catch {
    return actionError("Nu ai permisiunea de a șterge evenimente.");
  }

  const { data: event } = await ctx.supabase
    .from("calendar_events")
    .select("id, title")
    .eq("id", eventId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!event) return actionError("Evenimentul nu a fost găsit.");

  const result = await softDeleteRow(
    ctx.supabase,
    "calendar_events",
    ctx.activeWorkspace.id,
    eventId,
  );

  if (!result.ok) return actionError("Nu am putut șterge evenimentul.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "calendar_event",
    entityId: eventId,
    action: "calendar_event.deleted",
    title: "Eveniment șters",
    description: event.title,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  return actionSuccess("Eveniment șters.");
}
