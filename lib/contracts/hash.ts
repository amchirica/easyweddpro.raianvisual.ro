import { createHash } from "crypto";

/** Stable JSON stringify with sorted object keys (arrays keep order). */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

export type ContractHashPayload = {
  contractNumber: string | null;
  version: number;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  depositAmount: number;
  remainingAmount: number;
  title: string;
  terms: string | null;
  client: unknown;
  provider: unknown;
  items: unknown;
  sections: unknown;
  eventDate: string | null;
  eventLocation: string | null;
};

/** Deterministic SHA-256 of the contract content relevant for acceptance. */
export function computeContractContentHash(payload: ContractHashPayload): string {
  const canonical = {
    contract_number: payload.contractNumber,
    version: payload.version,
    currency: payload.currency,
    subtotal: payload.subtotal,
    discount_amount: payload.discountAmount,
    tax_amount: payload.taxAmount,
    total: payload.total,
    deposit_amount: payload.depositAmount,
    remaining_amount: payload.remainingAmount,
    title: payload.title,
    terms: payload.terms ?? "",
    client: payload.client ?? null,
    provider: payload.provider ?? null,
    items: payload.items ?? [],
    sections: payload.sections ?? {},
    event_date: payload.eventDate,
    event_location: payload.eventLocation,
  };
  return createHash("sha256").update(stableStringify(canonical), "utf8").digest("hex");
}

export function hashTokenSha256(token: string): string {
  return createHash("sha256").update(token.trim(), "utf8").digest("hex");
}
