import "server-only";

import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
export type ActivityRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export async function listClients(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  options?: { search?: string; status?: string; limit?: number },
): Promise<ClientRow[]> {
  const limit = Math.min(options?.limit ?? 100, 200);

  let query = supabase
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options?.search?.trim()) {
    const q = options.search.trim().replace(/[%_,]/g, "");
    if (q) {
      const pattern = `%${q}%`;
      query = query.or(
        `name.ilike."${pattern}",email.ilike."${pattern}",phone.ilike."${pattern}",city.ilike."${pattern}"`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getClientById(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  clientId: string,
): Promise<ClientRow | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", clientId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getClientActivity(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  clientId: string,
): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("entity_type", "client")
    .eq("entity_id", clientId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data ?? [];
}
