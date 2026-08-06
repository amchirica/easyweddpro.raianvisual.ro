import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export type NotificationListFilters = {
  unreadOnly?: boolean;
  limit?: number;
};

/** Notifications for a single user, scoped to a workspace, newest first. */
export async function listNotifications(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
  filters: NotificationListFilters = {},
): Promise<NotificationRow[]> {
  const limit = Math.min(filters.limit ?? 20, 100);

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.unreadOnly) {
    query = query.is("read_at", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function countUnreadNotifications(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
