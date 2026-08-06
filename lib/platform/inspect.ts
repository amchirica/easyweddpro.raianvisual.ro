import "server-only";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

const INSPECT_COOKIE = "ewp_inspect";

export type ActiveInspectSession = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  reason: string;
  adminId: string;
  expiresAt: string;
};

export async function getActiveInspectSession(): Promise<ActiveInspectSession | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(INSPECT_COOKIE)?.value;
  if (!sessionId) return null;

  const supabase = await createClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("admin_inspect_sessions")
    .select("id, admin_id, workspace_id, reason, expires_at, ended_at")
    .eq("id", sessionId)
    .is("ended_at", null)
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", data.workspace_id)
    .maybeSingle();

  return {
    id: data.id,
    workspaceId: data.workspace_id,
    workspaceName: workspace?.name ?? "Workspace",
    reason: data.reason,
    adminId: data.admin_id,
    expiresAt: data.expires_at,
  };
}
