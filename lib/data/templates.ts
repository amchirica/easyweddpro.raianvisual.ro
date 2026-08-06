import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { TemplateType } from "@/lib/validations/templates";
import type { Database } from "@/types/database";

export type TemplateRow = Database["public"]["Tables"]["workspace_templates"]["Row"];

export type TemplateListFilters = {
  type?: TemplateType | "all";
  search?: string;
  includeArchived?: boolean;
  limit?: number;
};

export async function listTemplates(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  filters: TemplateListFilters = {},
): Promise<TemplateRow[]> {
  const limit = Math.min(filters.limit ?? 200, 300);

  let query = supabase
    .from("workspace_templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }
  if (!filters.includeArchived) {
    query = query.is("archived_at", null);
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim().replace(/[%_,]/g, "");
    if (q) {
      query = query.ilike("name", `%${q}%`);
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTemplateById(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  templateId: string,
): Promise<TemplateRow | null> {
  const { data, error } = await supabase
    .from("workspace_templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", templateId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
