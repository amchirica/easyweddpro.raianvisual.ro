import { describe, expect, it } from "vitest";

import { DEFAULT_CONTRACT_SECTIONS } from "@/lib/contracts/content";
import { buildContractSnapshot } from "@/lib/contracts/snapshot";

describe("buildContractSnapshot", () => {
  it("produces a stable snapshot with content hash", () => {
    const snap = buildContractSnapshot({
      content: {
        provider: { name: "Studio Raian", email: "hello@example.com" },
        client: { name: "Ana Pop", email: "ana@example.com" },
        services: [
          { name: "Foto nuntă", quantity: 1, unitPrice: 5000, lineTotal: 5000 },
        ],
        sections: DEFAULT_CONTRACT_SECTIONS,
      },
      money: {
        subtotal: 5000,
        discountAmount: 0,
        taxAmount: 0,
        total: 5000,
        depositAmount: 1500,
        remainingAmount: 3500,
      },
      currency: "RON",
      title: "Contract foto",
      terms: "Termeni finali",
      eventDate: "2026-09-01",
      eventLocation: "Cluj-Napoca",
      contractNumber: "CTR-2026-0001",
      version: 1,
      proposalNumber: "EWP-2026-0001",
    });

    expect(snap.contract_content_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(snap.items).toHaveLength(1);
    expect(snap.total).toBe(5000);

    const again = buildContractSnapshot({
      content: {
        provider: { name: "Studio Raian", email: "hello@example.com" },
        client: { name: "Ana Pop", email: "ana@example.com" },
        services: [
          { name: "Foto nuntă", quantity: 1, unitPrice: 5000, lineTotal: 5000 },
        ],
        sections: DEFAULT_CONTRACT_SECTIONS,
      },
      money: {
        subtotal: 5000,
        discountAmount: 0,
        taxAmount: 0,
        total: 5000,
        depositAmount: 1500,
        remainingAmount: 3500,
      },
      currency: "RON",
      title: "Contract foto",
      terms: "Termeni finali",
      eventDate: "2026-09-01",
      eventLocation: "Cluj-Napoca",
      contractNumber: "CTR-2026-0001",
      version: 1,
      proposalNumber: "EWP-2026-0001",
    });

    expect(again.contract_content_hash).toBe(snap.contract_content_hash);
  });
});
