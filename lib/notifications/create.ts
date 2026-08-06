import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

type NotificationsClient = SupabaseClient<Database>;
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type CreateNotificationInput = {
  supabase: NotificationsClient;
  workspaceId: string;
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, Json | undefined>;
};

/**
 * Insert an in-app notification. Never throws — a failed notification insert
 * should not unwind whatever workflow (action, automation, cron) triggered it.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationRow | null> {
  const metadata = Object.fromEntries(
    Object.entries(input.metadata ?? {}).filter(([, value]) => value !== undefined),
  ) as Json;

  const { data, error } = await input.supabase
    .from("notifications")
    .insert({
      workspace_id: input.workspaceId,
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      action_url: input.actionUrl ?? null,
      metadata,
    })
    .select("*")
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[notifications.create]", error.message);
    }
    return null;
  }

  return data;
}

/**
 * Notify every enabled owner/admin/manager of a workspace — used by system jobs
 * (cron, automations) that don't target a single user.
 */
export async function notifyWorkspaceManagers(
  supabase: NotificationsClient,
  workspaceId: string,
  input: Omit<CreateNotificationInput, "supabase" | "workspaceId" | "userId">,
): Promise<NotificationRow[]> {
  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", workspaceId)
    .in("role", ["owner", "admin", "manager"])
    .is("disabled_at", null);

  if (error || !members?.length) {
    if (error && process.env.NODE_ENV === "development") {
      console.error("[notifications.notifyWorkspaceManagers]", error.message);
    }
    return [];
  }

  const results = await Promise.all(
    members.map((member) =>
      createNotification({ supabase, workspaceId, userId: member.user_id, ...input }),
    ),
  );

  return results.filter((row): row is NotificationRow => row !== null);
}
