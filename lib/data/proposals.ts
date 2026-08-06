import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProposalStatus } from "@/lib/constants";
import { getEffectiveProposalStatus } from "@/lib/proposals/status";
import type { Database, Json } from "@/types/database";

export type ProposalRow = Database["public"]["Tables"]["proposals"]["Row"];
export type ProposalItemRow = Database["public"]["Tables"]["proposal_items"]["Row"];

export type ProposalListParams = {
  workspaceId: string;
  search?: string;
  status?: ProposalStatus | "all";
  clientId?: string | "all";
  limit?: number;
  offset?: number;
};

export async function listProposals(
  supabase: SupabaseClient<Database>,
  params: ProposalListParams,
) {
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;

  let query = supabase
    .from("proposals")
    .select("*", { count: "exact" })
    .eq("workspace_id", params.workspaceId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

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
      query = query.or(
        `title.ilike."${pattern}",proposal_number.ilike."${pattern}"`,
      );
    }
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[];
  const leadIds = [...new Set(rows.map((r) => r.lead_id).filter(Boolean))] as string[];

  const [{ data: clients }, { data: leads }] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    leadIds.length
      ? supabase.from("leads").select("id, name").in("id", leadIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const leadNameById = new Map((leads ?? []).map((l) => [l.id, l.name]));

  return {
    proposals: rows.map((row) => {
      const effective = getEffectiveProposalStatus({
        status: row.status,
        validUntil: row.valid_until,
        publicTokenExpiresAt: row.public_token_expires_at,
        acceptedAt: row.accepted_at,
      });
      return {
        ...row,
        effectiveStatus: effective,
        clientName: row.client_id ? (clientNameById.get(row.client_id) ?? null) : null,
        leadName: row.lead_id ? (leadNameById.get(row.lead_id) ?? null) : null,
      };
    }),
    count: count ?? 0,
  };
}

export async function getProposalById(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  proposalId: string,
) {
  const { data, error } = await supabase
    .from("proposals")
    .select("*, clients(id, name, email), leads(id, name, email)")
    .eq("workspace_id", workspaceId)
    .eq("id", proposalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getProposalItems(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  proposalId: string,
) {
  const { data, error } = await supabase
    .from("proposal_items")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("proposal_id", proposalId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export type PublicProposalPayload = {
  id: string;
  proposal_number: string | null;
  title: string;
  status: ProposalStatus;
  currency: string;
  subtotal: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  valid_until: string | null;
  created_at: string;
  terms: string | null;
  notes: string | null;
  client_name: string | null;
  provider_name: string | null;
  brand_accent: string | null;
  logo_url: string | null;
  items: Array<{
    name: string;
    description: string | null;
    quantity: number;
    unit_price: number;
    discount: number;
    tax_rate: number;
    line_total: number;
    sort_order: number;
  }>;
  accepted_at: string | null;
  rejected_at: string | null;
  viewed_at: string | null;
};

export async function fetchPublicProposal(
  supabase: SupabaseClient<Database>,
  token: string,
  markViewed: boolean,
): Promise<PublicProposalPayload | null> {
  if (markViewed) {
    const { data, error } = await supabase.rpc("mark_proposal_viewed_by_token", {
      p_token: token,
    });
    if (error) throw new Error(error.message);
    return (data as PublicProposalPayload | null) ?? null;
  }

  const { data, error } = await supabase.rpc("get_public_proposal_by_token", {
    p_token: token,
  });
  if (error) throw new Error(error.message);
  return (data as PublicProposalPayload | null) ?? null;
}

export function buildProposalSnapshot(input: {
  clientName: string | null;
  providerName: string;
  currency: string;
  items: Array<{
    name: string;
    description?: string | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  terms: string | null;
  validUntil: string | null;
  title: string;
  proposalNumber: string | null;
}): Json {
  return {
    client_name: input.clientName,
    provider_name: input.providerName,
    currency: input.currency,
    title: input.title,
    proposal_number: input.proposalNumber,
    valid_until: input.validUntil,
    terms: input.terms,
    subtotal: input.subtotal,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    discount_amount: input.discountAmount,
    tax_rate: input.taxRate,
    tax_amount: input.taxAmount,
    total: input.total,
    items: input.items.map((item) => ({
      name: item.name,
      description: item.description ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount: item.discount,
      tax_rate: item.taxRate,
      line_total: item.lineTotal,
    })),
    captured_at: new Date().toISOString(),
  };
}
