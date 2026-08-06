import { contractContentFromRow, type ContractRow } from "@/lib/data/contracts";
import { getEffectiveContractStatus } from "@/lib/contracts/status";
import type { ContractDetailData } from "@/lib/contracts/types";

type RelatedClient = { id?: string; name?: string; email?: string | null; phone?: string | null };
type RelatedProposal = { id?: string; title?: string | null; proposal_number?: string | null };

function asRelatedClient(value: unknown): RelatedClient | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as RelatedClient;
}

function asRelatedProposal(value: unknown): RelatedProposal | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as RelatedProposal;
}

export function mapContractRowToDetail(row: ContractRow & Record<string, unknown>): ContractDetailData {
  const content = contractContentFromRow(row);
  const client = asRelatedClient(row.clients);
  const proposal = asRelatedProposal(row.proposals);

  return {
    id: row.id,
    contractNumber: row.contract_number,
    title: row.title,
    status: row.status,
    effectiveStatus: getEffectiveContractStatus({
      status: row.status,
      validUntil: row.valid_until,
      publicTokenExpiresAt: row.public_token_expires_at,
      acceptedAt: row.accepted_at,
    }),
    currency: row.currency,
    subtotal: Number(row.subtotal),
    discountAmount: Number(row.discount_amount),
    taxAmount: Number(row.tax_amount),
    total: Number(row.total),
    depositAmount: Number(row.deposit_amount),
    remainingAmount: Number(row.remaining_amount),
    eventDate: row.event_date,
    eventLocation: row.event_location,
    validUntil: row.valid_until,
    terms: row.terms,
    publicToken: row.public_token,
    clientId: row.client_id,
    clientName: client?.name ?? null,
    proposalId: row.proposal_id,
    proposalNumber: proposal?.proposal_number ?? null,
    version: row.version ?? 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    acceptedAt: row.accepted_at,
    publishedAt: row.published_at,
    viewedAt: row.viewed_at,
    content,
  };
}
