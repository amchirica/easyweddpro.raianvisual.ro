import "server-only";

import type { LeadStatus } from "@/lib/constants";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
export type ActivityRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export type LeadListParams = {
  workspaceId: string;
  search?: string;
  status?: LeadStatus | "all";
  source?: string | "all";
  limit?: number;
  offset?: number;
};

export async function listLeads(
  supabase: SupabaseClient<Database>,
  params: LeadListParams,
): Promise<{ leads: LeadRow[]; count: number }> {
  const limit = Math.min(params.limit ?? 100, 200);
  const offset = params.offset ?? 0;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("workspace_id", params.workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.source && params.source !== "all") {
    query = query.eq("source", params.source);
  }
  if (params.search?.trim()) {
    const q = params.search.trim().replace(/[%_,]/g, "");
    if (q) {
      const pattern = `%${q}%`;
      query = query.or(
        `name.ilike."${pattern}",email.ilike."${pattern}",city.ilike."${pattern}",phone.ilike."${pattern}",venue.ilike."${pattern}"`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return { leads: data ?? [], count: count ?? 0 };
}

export async function getLeadById(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  leadId: string,
): Promise<LeadRow | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", leadId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getLeadActivity(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  leadId: string,
): Promise<ActivityRow[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("entity_type", "lead")
    .eq("entity_id", leadId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data ?? [];
}
