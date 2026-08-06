import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type AutomationRow = Database["public"]["Tables"]["automations"]["Row"];
export type AutomationRunRow = Database["public"]["Tables"]["automation_runs"]["Row"];

export async function listAutomations(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<AutomationRow[]> {
  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAutomationById(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  automationId: string,
): Promise<AutomationRow | null> {
  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", automationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function listAutomationRuns(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  automationId?: string,
  limit = 50,
): Promise<AutomationRunRow[]> {
  let query = supabase
    .from("automation_runs")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("started_at", { ascending: false })
    .limit(Math.min(limit, 200));

  if (automationId) {
    query = query.eq("automation_id", automationId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type AutomationRunCounts = { success: number; failed: number; skipped: number };

export async function countAutomationRunOutcomes(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<Map<string, AutomationRunCounts>> {
  const { data, error } = await supabase
    .from("automation_runs")
    .select("automation_id, status")
    .eq("workspace_id", workspaceId)
    .limit(2000);

  if (error) throw new Error(error.message);

  const byAutomation = new Map<string, AutomationRunCounts>();
  for (const row of data ?? []) {
    const counts = byAutomation.get(row.automation_id) ?? { success: 0, failed: 0, skipped: 0 };
    if (row.status === "success") counts.success += 1;
    else if (row.status === "failed") counts.failed += 1;
    else if (row.status === "skipped") counts.skipped += 1;
    byAutomation.set(row.automation_id, counts);
  }
  return byAutomation;
}
