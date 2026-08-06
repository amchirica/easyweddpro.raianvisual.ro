import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

type SoftDeleteTable =
  | "contracts"
  | "calendar_events"
  | "projects"
  | "tasks"
  | "payments"
  | "automations"
  | "workspace_templates"
  | "leads"
  | "clients"
  | "proposals";

type SoftClient = SupabaseClient<Database>;

export async function softDeleteRow(
  supabase: SoftClient,
  table: SoftDeleteTable,
  workspaceId: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function restoreSoftDeletedRow(
  supabase: SoftClient,
  table: SoftDeleteTable,
  workspaceId: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: null } as never)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .not("deleted_at", "is", null);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function archiveRow(
  supabase: SoftClient,
  table: "contracts" | "projects" | "workspace_templates" | "clients",
  workspaceId: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from(table)
    .update({ archived_at: new Date().toISOString() } as never)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function unarchiveRow(
  supabase: SoftClient,
  table: "contracts" | "projects" | "workspace_templates" | "clients",
  workspaceId: string,
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from(table)
    .update({ archived_at: null } as never)
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
