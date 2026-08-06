import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

export type ProjectListItem = ProjectRow & { clientName: string | null };

export type ProjectListParams = {
  workspaceId: string;
  search?: string;
  status?: string | "all";
  clientId?: string | "all";
  includeArchived?: boolean;
  limit?: number;
};

export async function listProjects(
  supabase: SupabaseClient<Database>,
  params: ProjectListParams,
): Promise<ProjectListItem[]> {
  const limit = Math.min(params.limit ?? 100, 200);

  let query = supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", params.workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!params.includeArchived) {
    query = query.is("archived_at", null);
  }
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.clientId && params.clientId !== "all") {
    query = query.eq("client_id", params.clientId);
  }
  if (params.search?.trim()) {
    const q = params.search.trim().replace(/[%_,]/g, "");
    if (q) {
      const pattern = `%${q}%`;
      query = query.or(`name.ilike."${pattern}",location.ilike."${pattern}"`);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[];
  const { data: clients } = clientIds.length
    ? await supabase.from("clients").select("id, name").in("id", clientIds)
    : { data: [] as Array<{ id: string; name: string }> };

  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  return rows.map((row) => ({
    ...row,
    clientName: row.client_id ? (clientNameById.get(row.client_id) ?? null) : null,
  }));
}

export type ProjectDetail = ProjectRow & {
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  contractNumber: string | null;
  contractTitle: string | null;
};

/**
 * Loads a single project for the workspace. Client and contract are fetched
 * with separate queries (no nested PostgREST joins) since relationships may
 * not be declared in generated types.
 */
export async function getProjectById(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  projectId: string,
): Promise<ProjectDetail | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", projectId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  let clientName: string | null = null;
  let clientEmail: string | null = null;
  let clientPhone: string | null = null;
  if (data.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("id, name, email, phone")
      .eq("workspace_id", workspaceId)
      .eq("id", data.client_id)
      .maybeSingle();
    clientName = client?.name ?? null;
    clientEmail = client?.email ?? null;
    clientPhone = client?.phone ?? null;
  }

  let contractNumber: string | null = null;
  let contractTitle: string | null = null;
  if (data.contract_id) {
    const { data: contract } = await supabase
      .from("contracts")
      .select("id, contract_number, title")
      .eq("workspace_id", workspaceId)
      .eq("id", data.contract_id)
      .maybeSingle();
    contractNumber = contract?.contract_number ?? null;
    contractTitle = contract?.title ?? null;
  }

  return {
    ...data,
    clientName,
    clientEmail,
    clientPhone,
    contractNumber,
    contractTitle,
  };
}

export async function getProjectActivity(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  projectId: string,
) {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("entity_type", "project")
    .eq("entity_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data ?? [];
}
