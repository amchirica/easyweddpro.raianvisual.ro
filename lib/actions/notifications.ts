"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { countUnreadNotifications, listNotifications } from "@/lib/data/notifications";
import { requireWorkspace } from "@/lib/workspace/session";
import type { Database } from "@/types/database";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

const notificationIdSchema = z.object({
  notificationId: z.string().uuid("Notificare invalidă."),
});

export async function listUnreadCountAction(): Promise<ActionResult<{ count: number }>> {
  const ctx = await requireWorkspace();

  try {
    const count = await countUnreadNotifications(ctx.supabase, ctx.activeWorkspace.id, ctx.user.id);
    return actionSuccess("", { count });
  } catch {
    return actionError("Nu am putut încărca notificările.");
  }
}

export async function listNotificationsAction(
  input?: { unreadOnly?: boolean; limit?: number },
): Promise<ActionResult<{ notifications: NotificationRow[] }>> {
  const ctx = await requireWorkspace();

  try {
    const notifications = await listNotifications(ctx.supabase, ctx.activeWorkspace.id, ctx.user.id, {
      unreadOnly: input?.unreadOnly,
      limit: input?.limit,
    });
    return actionSuccess("", { notifications });
  } catch {
    return actionError("Nu am putut încărca notificările.");
  }
}

export async function markNotificationReadAction(
  input: unknown,
): Promise<ActionResult<{ notification: NotificationRow }>> {
  const parsed = notificationIdSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");
  }

  const ctx = await requireWorkspace();

  const { data: notification, error } = await ctx.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", parsed.data.notificationId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .eq("user_id", ctx.user.id)
    .is("read_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut marca notificarea ca citită.");
  if (!notification) {
    const { data: existing } = await ctx.supabase
      .from("notifications")
      .select("*")
      .eq("id", parsed.data.notificationId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .eq("user_id", ctx.user.id)
      .maybeSingle();
    if (!existing) return actionError("Notificarea nu a fost găsită.");
    return actionSuccess("", { notification: existing });
  }

  revalidatePath("/dashboard");
  return actionSuccess("", { notification });
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<{ updated: number }>> {
  const ctx = await requireWorkspace();

  const { data, error } = await ctx.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("workspace_id", ctx.activeWorkspace.id)
    .eq("user_id", ctx.user.id)
    .is("read_at", null)
    .select("id");

  if (error) return actionError("Nu am putut marca notificările ca citite.");

  revalidatePath("/dashboard");
  return actionSuccess("Notificări marcate ca citite.", { updated: data?.length ?? 0 });
}

export async function deleteNotificationAction(
  input: unknown,
): Promise<ActionResult<{ deleted: boolean }>> {
  const parsed = notificationIdSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");
  }

  const ctx = await requireWorkspace();

  const { data, error } = await ctx.supabase
    .from("notifications")
    .delete()
    .eq("id", parsed.data.notificationId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .eq("user_id", ctx.user.id)
    .select("id")
    .maybeSingle();

  if (error) return actionError("Nu am putut șterge notificarea.");
  if (!data) return actionError("Notificarea nu a fost găsită.");

  revalidatePath("/dashboard");
  return actionSuccess("", { deleted: true });
}
