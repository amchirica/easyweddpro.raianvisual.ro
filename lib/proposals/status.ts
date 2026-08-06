import type { ProposalStatus } from "@/lib/constants";

export function getEffectiveProposalStatus(input: {
  status: string;
  validUntil?: string | null;
  publicTokenExpiresAt?: string | null;
  acceptedAt?: string | null;
}): ProposalStatus {
  const status = input.status as ProposalStatus;
  if (status === "accepted" || status === "rejected" || status === "cancelled") {
    return status;
  }
  if (status === "draft") return "draft";

  const today = new Date().toISOString().slice(0, 10);
  if (input.publicTokenExpiresAt) {
    const exp = new Date(input.publicTokenExpiresAt);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
      return "expired";
    }
  }
  if (input.validUntil && input.validUntil < today) {
    return "expired";
  }
  return status;
}

export function canEditProposal(status: ProposalStatus): boolean {
  return status === "draft" || status === "sent" || status === "viewed";
}

export function canAcceptProposal(status: ProposalStatus): boolean {
  return status === "sent" || status === "viewed";
}
