import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { proposalFormSchema } from "@/lib/validations/proposals";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn(() => []),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

vi.mock("@/lib/workspace/permissions", () => ({
  requireWorkspaceAction: vi.fn(async () => {
    throw new Error("not_used_in_import_test");
  }),
}));

vi.mock("@/lib/activity/log", () => ({
  logActivity: vi.fn(),
}));

describe("proposalFormSchema", () => {
  it("accepts a valid create payload", () => {
    const result = proposalFormSchema.safeParse({
      title: "Pachet eveniment",
      clientId: "11111111-1111-4111-8111-111111111111",
      leadId: null,
      currency: "RON",
      discountType: "none",
      discountValue: 0,
      taxRate: 19,
      validUntil: "2026-12-31",
      notes: "",
      terms: "",
      items: [
        {
          name: "Serviciu principal",
          description: "",
          quantity: 1,
          unitPrice: 2500,
          discount: 0,
          taxRate: 19,
          sortOrder: 0,
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});

describe("proposal server actions module", () => {
  it("does not export ProposalRow as a runtime value from use server file", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../proposals.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/export\s+type\s*\{\s*ProposalRow\s*\}/);
    expect(source).not.toMatch(/export\s+\{\s*ProposalRow\s*\}/);
    expect(source).not.toMatch(/\bProposalRow\.(parse|safeParse)\b/);
  });

  it("can be imported without runtime reference errors", async () => {
    const proposalsActions = await import("@/lib/actions/proposals");

    expect(proposalsActions.createProposalAction).toBeDefined();
    expect(proposalsActions.updateProposalAction).toBeDefined();
    expect((proposalsActions as Record<string, unknown>).ProposalRow).toBeUndefined();
  });
});
