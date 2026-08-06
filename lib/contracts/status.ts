import type { ContractStatus } from "@/lib/constants";

export function getEffectiveContractStatus(input: {
  status: string;
  validUntil?: string | null;
  publicTokenExpiresAt?: string | null;
  acceptedAt?: string | null;
}): ContractStatus {
  const status = input.status as ContractStatus;

  // Accepted contracts never become expired automatically.
  if (status === "accepted") return "accepted";
  if (status === "cancelled") return "cancelled";
  if (status === "superseded") return "superseded";
  if (status === "draft") return "draft";

  if (input.publicTokenExpiresAt) {
    const exp = new Date(input.publicTokenExpiresAt);
    if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
      return "expired";
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  if (input.validUntil && input.validUntil < today) {
    return "expired";
  }

  if (
    status === "published" ||
    status === "viewed" ||
    status === "expired"
  ) {
    return status;
  }

  return "draft";
}

export function canEditContract(status: ContractStatus): boolean {
  return status === "draft";
}

export function canPublishContract(status: ContractStatus): boolean {
  return status === "draft";
}

export function canAcceptContract(status: ContractStatus): boolean {
  return status === "published" || status === "viewed";
}

export function canCancelContract(status: ContractStatus): boolean {
  return status !== "accepted" && status !== "cancelled" && status !== "superseded";
}

export function canCreateNewVersion(status: ContractStatus): boolean {
  return (
    status === "published" ||
    status === "viewed" ||
    status === "accepted" ||
    status === "expired"
  );
}

export const CONTRACT_STATUS_STEPS: ContractStatus[] = [
  "draft",
  "published",
  "viewed",
  "accepted",
];
