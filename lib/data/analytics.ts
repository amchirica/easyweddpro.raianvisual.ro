import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type WorkspaceAnalyticsSummary = {
  leadsCreated: number;
  leadsBySource: Record<string, number>;
  proposalsSent: number;
  proposalsAccepted: number;
  contractsCreated: number;
  contractsAccepted: number;
  contractedByCurrency: Record<string, number>;
  collectedByCurrency: Record<string, number>;
  outstandingByCurrency: Record<string, number>;
  activeProjects: number;
  overdueTasks: number;
  upcomingEvents: number;
};

export type AnalyticsRange = { from?: string | null; to?: string | null };

/**
 * Normalizes an RPC currency-keyed jsonb object (`{ RON: 1000, EUR: 200 }`)
 * into a numeric map, dropping non-numeric entries defensively.
 */
export function toCurrencyMap(input: unknown): Record<string, number> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const num = typeof value === "number" ? value : Number(value);
    if (!Number.isNaN(num)) result[key] = num;
  }
  return result;
}

export function mapAnalyticsSummary(raw: unknown): WorkspaceAnalyticsSummary {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    leadsCreated: Number(data.leads_created ?? 0) || 0,
    leadsBySource: toCurrencyMap(data.leads_by_source),
    proposalsSent: Number(data.proposals_sent ?? 0) || 0,
    proposalsAccepted: Number(data.proposals_accepted ?? 0) || 0,
    contractsCreated: Number(data.contracts_created ?? 0) || 0,
    contractsAccepted: Number(data.contracts_accepted ?? 0) || 0,
    contractedByCurrency: toCurrencyMap(data.contracted_by_currency),
    collectedByCurrency: toCurrencyMap(data.collected_by_currency),
    outstandingByCurrency: toCurrencyMap(data.outstanding_by_currency),
    activeProjects: Number(data.active_projects ?? 0) || 0,
    overdueTasks: Number(data.overdue_tasks ?? 0) || 0,
    upcomingEvents: Number(data.upcoming_events ?? 0) || 0,
  };
}

/** Calls `workspace_analytics_summary` and normalizes the jsonb payload. */
export async function fetchWorkspaceAnalyticsSummary(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  range: AnalyticsRange = {},
): Promise<WorkspaceAnalyticsSummary> {
  const { data, error } = await supabase.rpc("workspace_analytics_summary", {
    p_workspace_id: workspaceId,
    p_from: range.from ?? null,
    p_to: range.to ?? null,
  });

  if (error) throw new Error(error.message);
  return mapAnalyticsSummary(data);
}
