import "server-only";

import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

type LeadRow = Database["public"]["Tables"]["leads"]["Row"];
type ActivityRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export type DashboardStats = {
  newLeadsThisMonth: number;
  activeLeads: number;
  wonLeads: number;
  conversionRate: number;
  clientsCount: number;
  pipelineValue: number;
  dueFollowUps: number;
  recentActivity: ActivityRow[];
  pipelineByStatus: Array<{ status: string; count: number; value: number }>;
  leadSources: Array<{ source: string; count: number }>;
};

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDashboardStats(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<DashboardStats> {
  const monthStart = startOfMonthIso();
  const today = todayDateString();

  const [
    newLeadsRes,
    activeLeadsRes,
    wonRes,
    lostRes,
    clientsRes,
    pipelineRes,
    followUpsRes,
    activityRes,
    allActiveLeadsRes,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .gte("created_at", monthStart),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .not("status", "in", '("won","lost")'),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .eq("status", "won"),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .eq("status", "lost"),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select("estimated_value")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .not("status", "in", '("won","lost")'),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .not("status", "in", '("won","lost")')
      .lte("follow_up_date", today)
      .not("follow_up_date", "is", null),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("leads")
      .select("status, estimated_value, source")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .limit(500),
  ]);

  const won = wonRes.count ?? 0;
  const lost = lostRes.count ?? 0;
  const closed = won + lost;
  const conversionRate = closed === 0 ? 0 : (won / closed) * 100;

  const pipelineValue = (pipelineRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.estimated_value ?? 0),
    0,
  );

  const leads = (allActiveLeadsRes.data ?? []) as Pick<
    LeadRow,
    "status" | "estimated_value" | "source"
  >[];

  const statusMap = new Map<string, { count: number; value: number }>();
  const sourceMap = new Map<string, number>();

  for (const lead of leads) {
    const current = statusMap.get(lead.status) ?? { count: 0, value: 0 };
    current.count += 1;
    current.value += Number(lead.estimated_value ?? 0);
    statusMap.set(lead.status, current);

    const source = lead.source?.trim() || "Necunoscut";
    sourceMap.set(source, (sourceMap.get(source) ?? 0) + 1);
  }

  return {
    newLeadsThisMonth: newLeadsRes.count ?? 0,
    activeLeads: activeLeadsRes.count ?? 0,
    wonLeads: won,
    conversionRate,
    clientsCount: clientsRes.count ?? 0,
    pipelineValue,
    dueFollowUps: followUpsRes.count ?? 0,
    recentActivity: activityRes.data ?? [],
    pipelineByStatus: Array.from(statusMap.entries()).map(([status, stats]) => ({
      status,
      count: stats.count,
      value: stats.value,
    })),
    leadSources: Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
  };
}
