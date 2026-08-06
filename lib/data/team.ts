import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { WorkspaceRole } from "@/lib/constants";
import type { Database } from "@/types/database";

export type MembershipRow = Database["public"]["Tables"]["workspace_members"]["Row"];
export type InvitationRow = Database["public"]["Tables"]["workspace_invitations"]["Row"];

export type TeamMember = {
  membershipId: string;
  userId: string;
  role: WorkspaceRole;
  disabledAt: string | null;
  memberSince: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export async function listMembers(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<TeamMember[]> {
  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("id, user_id, role, disabled_at, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const rows = members ?? [];
  if (!rows.length) return [];

  const ids = rows.map((row) => row.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return rows.map((row) => {
    const profile = profileById.get(row.user_id);
    return {
      membershipId: row.id,
      userId: row.user_id,
      role: row.role as WorkspaceRole,
      disabledAt: row.disabled_at,
      memberSince: row.created_at,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    };
  });
}

export async function getMemberByMembershipId(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  membershipId: string,
): Promise<TeamMember | null> {
  const { data: row, error } = await supabase
    .from("workspace_members")
    .select("id, user_id, role, disabled_at, created_at")
    .eq("workspace_id", workspaceId)
    .eq("id", membershipId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", row.user_id)
    .maybeSingle();

  return {
    membershipId: row.id,
    userId: row.user_id,
    role: row.role as WorkspaceRole,
    disabledAt: row.disabled_at,
    memberSince: row.created_at,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
  };
}

export async function listPendingInvitations(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<InvitationRow[]> {
  const { data, error } = await supabase
    .from("workspace_invitations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export type MemberWorkload = {
  openTasks: number;
  totalTasks: number;
  projects: number;
};

export async function getMemberWorkload(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
): Promise<MemberWorkload> {
  const [{ count: totalTasks }, { count: openTasks }, { data: projectRows }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("assignee_id", userId)
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("assignee_id", userId)
      .is("deleted_at", null)
      .not("status", "in", '("done","cancelled")'),
    supabase
      .from("projects")
      .select("id, team")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
  ]);

  const projects = (projectRows ?? []).filter((project) => (project.team ?? []).includes(userId)).length;

  return {
    totalTasks: totalTasks ?? 0,
    openTasks: openTasks ?? 0,
    projects,
  };
}

export type MemberTaskItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
};

export async function listMemberTasks(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
): Promise<MemberTaskItem[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date")
    .eq("workspace_id", workspaceId)
    .eq("assignee_id", userId)
    .is("deleted_at", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
  }));
}

export type MemberProjectItem = {
  id: string;
  name: string;
  status: string;
  progress: number;
};

export async function listMemberProjects(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
): Promise<MemberProjectItem[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, progress, team")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((row) => (row.team ?? []).includes(userId))
    .map((row) => ({ id: row.id, name: row.name, status: row.status, progress: row.progress }));
}
