import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { effectivePaymentStatus } from "@/lib/payments/status";
import type { Database } from "@/types/database";

export type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

export type PaymentListFilters = {
  status?: string | "all";
  clientId?: string | "all";
  contractId?: string | "all";
  projectId?: string | "all";
  currency?: string | "all";
  search?: string;
  /** Payments past their due date, excluding cancelled/refunded. */
  overdue?: boolean;
  limit?: number;
  offset?: number;
};

export type PaymentWithRelations = PaymentRow & {
  effectiveStatus: string;
  clientName: string | null;
  contractTitle: string | null;
  contractStatus: string | null;
  projectName: string | null;
};

async function attachRelations(
  supabase: SupabaseClient<Database>,
  rows: PaymentRow[],
): Promise<PaymentWithRelations[]> {
  const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[];
  const contractIds = [...new Set(rows.map((r) => r.contract_id).filter(Boolean))] as string[];
  const projectIds = [...new Set(rows.map((r) => r.project_id).filter(Boolean))] as string[];

  const [{ data: clients }, { data: contracts }, { data: projects }] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    contractIds.length
      ? supabase.from("contracts").select("id, title, status").in("id", contractIds)
      : Promise.resolve({ data: [] as Array<{ id: string; title: string; status: string }> }),
    projectIds.length
      ? supabase.from("projects").select("id, name").in("id", projectIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const clientById = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const contractById = new Map((contracts ?? []).map((c) => [c.id, c]));
  const projectById = new Map((projects ?? []).map((p) => [p.id, p.name]));

  return rows.map((row) => ({
    ...row,
    effectiveStatus: effectivePaymentStatus(row),
    clientName: row.client_id ? clientById.get(row.client_id) ?? null : null,
    contractTitle: row.contract_id ? contractById.get(row.contract_id)?.title ?? null : null,
    contractStatus: row.contract_id ? contractById.get(row.contract_id)?.status ?? null : null,
    projectName: row.project_id ? projectById.get(row.project_id) ?? null : null,
  }));
}

export async function listPayments(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  filters: PaymentListFilters = {},
): Promise<{ payments: PaymentWithRelations[]; count: number }> {
  const limit = Math.min(filters.limit ?? 100, 200);
  const offset = filters.offset ?? 0;

  let query = supabase
    .from("payments")
    .select("*", { count: "exact" })
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.clientId && filters.clientId !== "all") {
    query = query.eq("client_id", filters.clientId);
  }
  if (filters.contractId && filters.contractId !== "all") {
    query = query.eq("contract_id", filters.contractId);
  }
  if (filters.projectId && filters.projectId !== "all") {
    query = query.eq("project_id", filters.projectId);
  }
  if (filters.currency && filters.currency !== "all") {
    query = query.eq("currency", filters.currency);
  }
  if (filters.overdue) {
    const today = new Date().toISOString().slice(0, 10);
    query = query.lt("due_date", today).in("status", ["pending", "partial", "overdue"]);
  }
  if (filters.search?.trim()) {
    const q = filters.search.trim().replace(/[%_,]/g, "");
    if (q) {
      const pattern = `%${q}%`;
      query = query.or(`label.ilike."${pattern}",reference.ilike."${pattern}"`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return { payments: await attachRelations(supabase, rows), count: count ?? 0 };
}

export async function getPaymentById(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  paymentId: string,
): Promise<PaymentWithRelations | null> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", paymentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const [withRelations] = await attachRelations(supabase, [data]);
  return withRelations;
}

export type PaymentCurrencyKpi = {
  currency: string;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  overdueCount: number;
  count: number;
};

export type PaymentKpis = {
  byCurrency: PaymentCurrencyKpi[];
};

/**
 * Workspace-wide payment KPIs, grouped by currency (no FX conversion —
 * amounts in different currencies are never summed together).
 */
export async function getWorkspacePaymentKpis(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
): Promise<PaymentKpis> {
  const { data, error } = await supabase
    .from("payments")
    .select("amount, paid_amount, due_date, status, currency")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .neq("status", "cancelled")
    .limit(5000);

  if (error) throw new Error(error.message);

  const today = new Date().toISOString().slice(0, 10);
  const byCurrency = new Map<string, PaymentCurrencyKpi>();

  for (const row of data ?? []) {
    const currency = row.currency || "RON";
    const bucket =
      byCurrency.get(currency) ??
      ({
        currency,
        totalPaid: 0,
        totalOutstanding: 0,
        totalOverdue: 0,
        overdueCount: 0,
        count: 0,
      } satisfies PaymentCurrencyKpi);

    const amount = Number(row.amount) || 0;
    const paid = Number(row.paid_amount) || 0;
    const remaining = Math.max(amount - paid, 0);

    bucket.count += 1;
    bucket.totalPaid += paid;

    if (row.status !== "refunded") {
      bucket.totalOutstanding += remaining;
      const overdue =
        row.status === "overdue" ||
        ((row.status === "pending" || row.status === "partial") &&
          Boolean(row.due_date) &&
          (row.due_date as string) < today);
      if (overdue) {
        bucket.totalOverdue += remaining;
        bucket.overdueCount += 1;
      }
    }

    byCurrency.set(currency, bucket);
  }

  return {
    byCurrency: Array.from(byCurrency.values()).sort(
      (a, b) => b.totalOutstanding - a.totalOutstanding,
    ),
  };
}
