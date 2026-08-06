import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ContractStatus } from "@/lib/constants";
import {
  DEFAULT_CONTRACT_SECTIONS,
  parseContractContent,
  type ContractSnapshot,
} from "@/lib/contracts/content";
import { getEffectiveContractStatus } from "@/lib/contracts/status";
import type { Database, Json } from "@/types/database";

export type ContractRow = Database["public"]["Tables"]["contracts"]["Row"];

export type ContractListParams = {
  workspaceId: string;
  search?: string;
  status?: ContractStatus | "all";
  clientId?: string | "all";
  eventDateFrom?: string;
  eventDateTo?: string;
  sort?: "updated_at" | "event_date" | "total" | "contract_number";
  ascending?: boolean;
  limit?: number;
  offset?: number;
};

export async function listContracts(
  supabase: SupabaseClient<Database>,
  params: ContractListParams,
) {
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;
  const sort = params.sort ?? "updated_at";
  const ascending = params.ascending ?? false;

  let query = supabase
    .from("contracts")
    .select("*", { count: "exact" })
    .eq("workspace_id", params.workspaceId)
    .is("deleted_at", null)
    .order(sort, { ascending })
    .range(offset, offset + limit - 1);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.clientId && params.clientId !== "all") {
    query = query.eq("client_id", params.clientId);
  }
  if (params.eventDateFrom) {
    query = query.gte("event_date", params.eventDateFrom);
  }
  if (params.eventDateTo) {
    query = query.lte("event_date", params.eventDateTo);
  }
  if (params.search?.trim()) {
    const q = params.search.trim().replace(/[%_,]/g, "");
    if (q) {
      const pattern = `%${q}%`;
      query = query.or(`title.ilike."${pattern}",contract_number.ilike."${pattern}"`);
    }
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const clientIds = [...new Set(rows.map((r) => r.client_id).filter(Boolean))] as string[];
  const { data: clients } = clientIds.length
    ? await supabase.from("clients").select("id, name").in("id", clientIds)
    : { data: [] as Array<{ id: string; name: string }> };

  const clientNameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  return {
    contracts: rows.map((row) => {
      const effectiveStatus = getEffectiveContractStatus({
        status: row.status,
        validUntil: row.valid_until,
        publicTokenExpiresAt: row.public_token_expires_at,
        acceptedAt: row.accepted_at,
      });
      return {
        ...row,
        effectiveStatus,
        clientName: row.client_id ? (clientNameById.get(row.client_id) ?? null) : null,
      };
    }),
    count: count ?? 0,
  };
}

/**
 * Internal staff loader — returns contracts in any valid status, including draft.
 * Does not require public_token, published_at, or snapshot.
 * Avoids PostgREST nested joins (Relationships may be missing in generated types).
 */
export async function getContractByIdForWorkspace(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  contractId: string,
) {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", contractId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  let client: { id: string; name: string; email: string | null; phone: string | null } | null =
    null;
  let proposal: { id: string; title: string | null; proposal_number: string | null } | null = null;

  if (data.client_id) {
    const { data: clientRow } = await supabase
      .from("clients")
      .select("id, name, email, phone")
      .eq("workspace_id", workspaceId)
      .eq("id", data.client_id)
      .maybeSingle();
    client = clientRow ?? null;
  }

  if (data.proposal_id) {
    const { data: proposalRow } = await supabase
      .from("proposals")
      .select("id, title, proposal_number")
      .eq("workspace_id", workspaceId)
      .eq("id", data.proposal_id)
      .maybeSingle();
    proposal = proposalRow ?? null;
  }

  return {
    ...data,
    clients: client,
    proposals: proposal,
  };
}

/** @deprecated Prefer getContractByIdForWorkspace — same behavior, clearer name. */
export async function getContractById(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  contractId: string,
) {
  return getContractByIdForWorkspace(supabase, workspaceId, contractId);
}

export type PublicContractPayload = {
  id: string;
  contract_number: string | null;
  title: string;
  status: ContractStatus;
  currency: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  deposit_amount: number;
  remaining_amount: number;
  event_date: string | null;
  event_location: string | null;
  valid_until: string | null;
  published_at: string | null;
  accepted_at: string | null;
  version: number;
  terms: string | null;
  content: Json | null;
  snapshot: ContractSnapshot | null;
  contract_content_hash: string | null;
  provider_name: string | null;
  brand_accent: string | null;
  logo_url: string | null;
  client_name: string | null;
  client_email: string | null;
  acceptance: {
    full_name?: string;
    accepted_at?: string;
    document_hash?: string;
  } | null;
};

function throwRpcError(operation: string, error: { message: string; code?: string }) {
  if (process.env.NODE_ENV === "development") {
    console.error("Request failed", {
      operation,
      url: `supabase.rpc/${operation}`,
      message: error.message,
      code: error.code,
    });
  }
  if (/digest\(|does not exist|42883|PGRST202/i.test(error.message)) {
    throw new Error(
      `RPC indisponibil (${operation}). Aplică migrația 20260805170000_fix_contract_token_hash.sql.`,
    );
  }
  throw new Error(error.message);
}

export async function fetchPublicContract(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<PublicContractPayload | null> {
  const { data, error } = await supabase.rpc("get_public_contract_by_token", {
    p_token: token,
  });
  if (error) throwRpcError("get_public_contract_by_token", error);
  if (!data) return null;
  return data as unknown as PublicContractPayload;
}

export async function markPublicContractViewed(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<PublicContractPayload | null> {
  const { data, error } = await supabase.rpc("mark_contract_viewed_by_token", {
    p_token: token,
  });
  if (error) throwRpcError("mark_contract_viewed_by_token", error);
  if (!data) return null;
  return data as unknown as PublicContractPayload;
}

export type ClientPortalPayload = {
  client: {
    name: string;
    email: string | null;
    event_date: string | null;
    event_type: string | null;
    city: string | null;
  };
  provider: {
    name: string;
    brand_accent: string | null;
    logo_url: string | null;
    city: string | null;
  };
  proposal: {
    id: string;
    title: string;
    status: string;
    total: number;
    currency: string;
    proposal_number: string | null;
    valid_until: string | null;
  } | null;
  contract: {
    id: string;
    title: string;
    status: string;
    total: number;
    deposit_amount: number;
    remaining_amount: number;
    currency: string;
    contract_number: string | null;
    event_date: string | null;
    accepted_at: string | null;
    has_public_link: boolean;
  } | null;
  /** Client-safe project snapshot — never includes budget/cost/notes. */
  project: {
    name: string;
    status: string;
    event_date: string | null;
    progress: number;
    location?: string | null;
  } | null;
  /** Client-safe payment schedule — never includes internal notes/references/proof links. */
  payments: Array<{
    id: string;
    label: string;
    amount: number;
    paid_amount: number;
    due_date: string | null;
    status: string;
    currency: string;
  }>;
};

export async function fetchClientPortal(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<ClientPortalPayload | null> {
  const { data, error } = await supabase.rpc("get_client_portal_by_token", {
    p_token: token,
  });
  if (error) throwRpcError("get_client_portal_by_token", error);
  if (!data) return null;
  const payload = data as unknown as Partial<ClientPortalPayload>;
  return {
    ...payload,
    project: payload.project ?? null,
    payments: payload.payments ?? [],
  } as ClientPortalPayload;
}

export function contractContentFromRow(row: ContractRow) {
  return (
    parseContractContent(row.content) ?? {
      provider: { name: "" },
      client: { name: "" },
      services: [],
      installments: [],
      sections: DEFAULT_CONTRACT_SECTIONS,
      eventLocation: row.event_location,
    }
  );
}

export function snapshotFromRow(row: ContractRow): ContractSnapshot | null {
  if (!row.snapshot || typeof row.snapshot !== "object") return null;
  return row.snapshot as unknown as ContractSnapshot;
}
