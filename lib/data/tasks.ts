import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

export type TaskListFilters = {
  /** Filter by a specific assignee id, or "all"/undefined for no filter. */
  assigneeId?: string | "all";
  status?: string | "all";
  search?: string;
  /** Only tasks without an assignee. */
  unassigned?: boolean;
  /** Only tasks past their due date that are not done/cancelled. */
  overdue?: boolean;
  /** Only tasks due today. */
  dueToday?: boolean;
  /** Only tasks assigned to this user id — takes priority over assigneeId/unassigned. */
  mine?: string;
  /** Exact due date match (YYYY-MM-DD), ignored when overdue/dueToday are set. */
  due?: string;
  limit?: number;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function listTasks(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  filters: TaskListFilters = {},
): Promise<TaskRow[]> {
  const limit = Math.min(filters.limit ?? 200, 300);

  let query = supabase
    .from("tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.mine) {
    query = query.eq("assignee_id", filters.mine);
  } else if (filters.unassigned) {
    query = query.is("assignee_id", null);
  } else if (filters.assigneeId && filters.assigneeId !== "all") {
    query = query.eq("assignee_id", filters.assigneeId);
  }

  const today = todayDateString();
  if (filters.dueToday) {
    query = query.eq("due_date", today);
  } else if (filters.overdue) {
    query = query.lt("due_date", today).not("status", "in", '("done","cancelled")');
  } else if (filters.due) {
    query = query.eq("due_date", filters.due);
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim().replace(/[%_,]/g, "");
    if (q) {
      const pattern = `%${q}%`;
      query = query.or(`title.ilike."${pattern}",notes.ilike."${pattern}"`);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTaskById(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  taskId: string,
): Promise<TaskRow | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", taskId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export type WorkspaceMemberOption = {
  id: string;
  name: string;
  role: string;
};

/** Basic member roster (id + display name) used for assignee pickers. */
export async function listWorkspaceMemberOptions(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<WorkspaceMemberOption[]> {
  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", workspaceId)
    .is("disabled_at", null);

  if (error) throw new Error(error.message);

  const rows = members ?? [];
  if (!rows.length) return [];

  const ids = rows.map((member) => member.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  const nameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));

  return rows.map((member) => ({
    id: member.user_id,
    name: nameById.get(member.user_id) || "Membru",
    role: member.role,
  }));
}
