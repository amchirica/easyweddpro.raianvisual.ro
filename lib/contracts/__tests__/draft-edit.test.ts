import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONTRACT_SECTIONS,
  parseContractContent,
  type CustomContractSection,
} from "@/lib/contracts/content";
import { canEditContract } from "@/lib/contracts/status";

describe("contract draft edit content", () => {
  it("parses draft content without public token or snapshot", () => {
    const parsed = parseContractContent({
      provider: { name: "Furnizor Demo" },
      client: { name: "Client Demo" },
      services: [{ name: "Serviciu", quantity: 1, unitPrice: 1000, lineTotal: 1000 }],
      sections: {
        ...DEFAULT_CONTRACT_SECTIONS,
        special_clauses: "Clauză custom",
      },
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.provider.name).toBe("Furnizor Demo");
    expect(parsed?.sections.special_clauses).toBe("Clauză custom");
    expect(parsed?.customSections).toEqual([]);
  });

  it("persists custom sections through parse", () => {
    const customSections: CustomContractSection[] = [
      {
        id: "sec_1",
        title: "Acces scenă",
        content: "Acces cu 2 ore înainte.",
        sortOrder: 0,
      },
      {
        id: "sec_2",
        title: "Pauză tehnică",
        content: "15 minute.",
        sortOrder: 1,
      },
    ];

    const parsed = parseContractContent({
      provider: { name: "A" },
      client: { name: "B" },
      services: [],
      sections: DEFAULT_CONTRACT_SECTIONS,
      customSections,
    });

    expect(parsed?.customSections).toHaveLength(2);
    expect(parsed?.customSections?.[0]?.title).toBe("Acces scenă");
    expect(parsed?.customSections?.[1]?.content).toBe("15 minute.");
  });

  it("allows edit only for draft status", () => {
    expect(canEditContract("draft")).toBe(true);
    expect(canEditContract("published")).toBe(false);
    expect(canEditContract("viewed")).toBe(false);
    expect(canEditContract("accepted")).toBe(false);
    expect(canEditContract("cancelled")).toBe(false);
    expect(canEditContract("superseded")).toBe(false);
  });

  it("builds edit href from contract.id uuid", () => {
    const contractId = "11111111-1111-4111-8111-111111111111";
    const proposalId = "22222222-2222-4222-8222-222222222222";
    const href = `/dashboard/contracts/${contractId}/edit`;

    expect(href).toContain(contractId);
    expect(href).not.toContain(proposalId);
    expect(href).toBe(`/dashboard/contracts/${contractId}/edit`);
  });
});

describe("contract edit route module", () => {
  it("edit page redirects to detail editor without demo fixtures", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const source = readFileSync(
      resolve(__dirname, "../../../app/dashboard/contracts/[id]/edit/page.tsx"),
      "utf8",
    );

    expect(source).toContain("getContractByIdForWorkspace");
    expect(source).toContain("redirect");
    expect(source).toContain("?edit=1");
    expect(source).not.toContain("DEMO_CONTRACTS");
    expect(source).not.toContain("get_public_contract_by_token");
  });
});
