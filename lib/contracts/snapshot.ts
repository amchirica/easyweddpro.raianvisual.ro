import type { ContractContent, ContractSnapshot } from "@/lib/contracts/content";
import { computeContractContentHash } from "@/lib/contracts/hash";
import type { ContractMoneyTotals } from "@/lib/contracts/money";

export function buildContractSnapshot(input: {
  content: ContractContent;
  money: ContractMoneyTotals;
  currency: string;
  title: string;
  terms: string | null;
  eventDate: string | null;
  eventLocation: string | null;
  contractNumber: string | null;
  version: number;
  proposalId?: string | null;
  proposalNumber?: string | null;
  proposalAcceptedAt?: string | null;
  source?: string;
}): ContractSnapshot {
  const snapshot: ContractSnapshot = {
    source: input.source ?? "manual",
    proposal_id: input.proposalId ?? null,
    proposal_number: input.proposalNumber ?? null,
    proposal_accepted_at: input.proposalAcceptedAt ?? null,
    provider: input.content.provider,
    client: input.content.client,
    items: input.content.services,
    installments: input.content.installments ?? [],
    sections: input.content.sections,
    currency: input.currency,
    subtotal: input.money.subtotal,
    discount_amount: input.money.discountAmount,
    tax_amount: input.money.taxAmount,
    total: input.money.total,
    deposit_amount: input.money.depositAmount,
    remaining_amount: input.money.remainingAmount,
    event_date: input.eventDate,
    event_location: input.eventLocation ?? input.content.eventLocation ?? null,
    terms: input.terms,
    title: input.title,
    contract_number: input.contractNumber,
    version: input.version,
  };

  snapshot.contract_content_hash = computeContractContentHash({
    contractNumber: snapshot.contract_number ?? null,
    version: snapshot.version,
    currency: snapshot.currency,
    subtotal: snapshot.subtotal,
    discountAmount: snapshot.discount_amount,
    taxAmount: snapshot.tax_amount,
    total: snapshot.total,
    depositAmount: snapshot.deposit_amount,
    remainingAmount: snapshot.remaining_amount,
    title: snapshot.title,
    terms: snapshot.terms ?? null,
    client: snapshot.client,
    provider: snapshot.provider,
    items: snapshot.items,
    sections: snapshot.sections,
    eventDate: snapshot.event_date ?? null,
    eventLocation: snapshot.event_location ?? null,
  });

  return snapshot;
}
