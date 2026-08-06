import { todayDateString } from "@/lib/background/client";
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_PAGES,
  type BackgroundClient,
} from "@/lib/background/types";
import type { Json } from "@/types/database";

function toCurrencyMap(rows: Array<{ currency: string; amount: number }>): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows) {
    map[row.currency] = (map[row.currency] ?? 0) + row.amount;
  }
  return map;
}

async function aggregateWorkspace(
  supabase: BackgroundClient,
  workspaceId: string,
  today: string,
): Promise<void> {
  const [
    leads,
    leadsWon,
    contracts,
    contractsAccepted,
    paidPayments,
    openPayments,
    overduePayments,
    activeProjects,
    overdueTasks,
    upcomingEvents,
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "won")
      .is("deleted_at", null),
    supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
    supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "accepted")
      .is("deleted_at", null),
    supabase
      .from("payments")
      .select("amount, paid_amount, currency")
      .eq("workspace_id", workspaceId)
      .eq("status", "paid")
      .is("deleted_at", null)
      .limit(2000),
    supabase
      .from("payments")
      .select("amount, paid_amount, currency")
      .eq("workspace_id", workspaceId)
      .in("status", ["pending", "partial"])
      .is("deleted_at", null)
      .limit(2000),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("status", ["pending", "partial"])
      .lt("due_date", today)
      .is("deleted_at", null),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .not("status", "in", '("completed","cancelled","archived")')
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .not("status", "in", '("done","cancelled")')
      .lt("due_date", today)
      .is("deleted_at", null),
    supabase
      .from("calendar_events")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .gte("starts_at", `${today}T00:00:00.000Z`)
      .neq("status", "cancelled")
      .is("deleted_at", null),
  ]);

  const leadsCount = leads.count ?? 0;
  const leadsWonCount = leadsWon.count ?? 0;
  const conversionRate = leadsCount > 0 ? leadsWonCount / leadsCount : null;

  const revenue = toCurrencyMap(
    (paidPayments.data ?? []).map((p) => ({
      currency: p.currency,
      amount: Number(p.paid_amount || p.amount || 0),
    })),
  );
  const outstanding = toCurrencyMap(
    (openPayments.data ?? []).map((p) => ({
      currency: p.currency,
      amount: Math.max(Number(p.amount || 0) - Number(p.paid_amount || 0), 0),
    })),
  );

  const payload = {
    workspace_id: workspaceId,
    snapshot_date: today,
    leads_count: leadsCount,
    leads_won_count: leadsWonCount,
    conversion_rate: conversionRate,
    contracts_count: contracts.count ?? 0,
    contracts_accepted_count: contractsAccepted.count ?? 0,
    revenue_by_currency: revenue as Json,
    outstanding_by_currency: outstanding as Json,
    overdue_payments_count: overduePayments.count ?? 0,
    active_projects_count: activeProjects.count ?? 0,
    overdue_tasks_count: overdueTasks.count ?? 0,
    upcoming_events_count: upcomingEvents.count ?? 0,
    computed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: {} as Json,
  };

  const { error } = await supabase.from("workspace_statistics").upsert(payload, {
    onConflict: "workspace_id",
  });
  if (error) throw new Error(error.message);
}

/**
 * Batch-aggregate workspace_statistics so dashboards avoid live heavy RPCs.
 */
export async function aggregateAnalytics(
  supabase: BackgroundClient,
  options?: { batchSize?: number; maxPages?: number },
): Promise<{ processed: number; errors: number }> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  const today = todayDateString();

  let processed = 0;
  let errors = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const { data, error } = await supabase
      .from("workspaces")
      .select("id")
      .order("created_at", { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (!rows.length) break;

    // Sequential per workspace to keep memory/CPU bounded on Workers.
    for (const workspace of rows) {
      try {
        await aggregateWorkspace(supabase, workspace.id, today);
        processed += 1;
      } catch (err) {
        errors += 1;
        console.error(
          "[background.analytics]",
          workspace.id,
          err instanceof Error ? err.message : "failed",
        );
      }
    }

    if (rows.length < batchSize) break;
  }

  return { processed, errors };
}
