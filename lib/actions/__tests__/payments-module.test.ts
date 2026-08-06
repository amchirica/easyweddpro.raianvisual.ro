import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { markPaidSchema, markPartialSchema, paymentFormSchema } from "@/lib/validations/payments";

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

describe("paymentFormSchema", () => {
  it("accepts a valid create payload", () => {
    const result = paymentFormSchema.safeParse({
      label: "Avans rezervare",
      clientId: "11111111-1111-4111-8111-111111111111",
      contractId: null,
      projectId: null,
      amount: 5000,
      paidAmount: 1000,
      dueDate: "2026-12-31",
      method: "bank_transfer",
      reference: "OP 1234",
      notes: "",
      proofUrl: "",
      currency: "RON",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a negative amount", () => {
    const result = paymentFormSchema.safeParse({
      label: "Avans",
      amount: -100,
      paidAmount: 0,
      currency: "RON",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative paid amount", () => {
    const result = paymentFormSchema.safeParse({
      label: "Avans",
      amount: 100,
      paidAmount: -10,
      currency: "RON",
    });

    expect(result.success).toBe(false);
  });

  it("defaults allowOverpay to false", () => {
    const result = paymentFormSchema.safeParse({
      label: "Avans",
      amount: 100,
      paidAmount: 50,
      currency: "RON",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.allowOverpay).toBe(false);
    }
  });
});

describe("markPartialSchema / markPaidSchema", () => {
  it("accepts a valid mark-partial payload", () => {
    const result = markPartialSchema.safeParse({ paidAmount: 250, allowOverpay: false });
    expect(result.success).toBe(true);
  });

  it("accepts an empty mark-paid payload", () => {
    const result = markPaidSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("payments server actions module", () => {
  it("does not export PaymentRow as a runtime value from use server file", () => {
    const source = readFileSync(path.resolve(__dirname, "../payments.ts"), "utf8");

    expect(source).not.toMatch(/export\s+type\s*\{\s*PaymentRow\s*\}/);
    expect(source).not.toMatch(/export\s+\{\s*PaymentRow\s*\}/);
    expect(source).not.toMatch(/\bPaymentRow\.(parse|safeParse)\b/);
  });

  it("can be imported without runtime reference errors", async () => {
    const paymentsActions = await import("@/lib/actions/payments");

    expect(paymentsActions.createPaymentAction).toBeDefined();
    expect(paymentsActions.updatePaymentAction).toBeDefined();
    expect(paymentsActions.markPaidAction).toBeDefined();
    expect(paymentsActions.markPartialAction).toBeDefined();
    expect(paymentsActions.cancelPaymentAction).toBeDefined();
    expect(paymentsActions.softDeletePaymentAction).toBeDefined();
    expect((paymentsActions as Record<string, unknown>).PaymentRow).toBeUndefined();
  });
});
