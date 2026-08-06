import { describe, expect, it } from "vitest";

import { computeContractContentHash, stableStringify } from "@/lib/contracts/hash";

const basePayload = {
  contractNumber: "CTR-2026-0001",
  version: 1,
  currency: "RON",
  subtotal: 1000,
  discountAmount: 0,
  taxAmount: 0,
  total: 1000,
  depositAmount: 300,
  remainingAmount: 700,
  title: "Contract nuntă",
  terms: "Termeni",
  client: { name: "Ana", email: "ana@example.com" },
  provider: { name: "Studio", email: "studio@example.com" },
  items: [{ name: "Foto", quantity: 1, unitPrice: 1000, lineTotal: 1000 }],
  sections: { delivery: "14 zile" },
  eventDate: "2026-09-01",
  eventLocation: "București",
};

describe("contract content hash", () => {
  it("is deterministic for the same payload", () => {
    const a = computeContractContentHash(basePayload);
    const b = computeContractContentHash(basePayload);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when material content changes", () => {
    const a = computeContractContentHash(basePayload);
    const b = computeContractContentHash({ ...basePayload, total: 1100 });
    expect(a).not.toBe(b);
  });

  it("stableStringify sorts object keys", () => {
    expect(stableStringify({ b: 1, a: 2 })).toBe(stableStringify({ a: 2, b: 1 }));
  });
});
