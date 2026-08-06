import { describe, expect, it } from "vitest";

import { computeContractMoney, defaultDepositFromTotal } from "@/lib/contracts/money";

describe("computeContractMoney", () => {
  it("computes remaining from total and deposit", () => {
    const result = computeContractMoney({
      subtotal: 1000,
      discountAmount: 100,
      taxAmount: 171,
      total: 1071,
      depositAmount: 300,
    });
    expect(result.remainingAmount).toBe(771);
    expect(result.depositAmount).toBe(300);
  });

  it("rejects negative deposit", () => {
    expect(() =>
      computeContractMoney({ subtotal: 100, depositAmount: -1, total: 100 }),
    ).toThrow("invalid_deposit");
  });

  it("rejects deposit above total", () => {
    expect(() =>
      computeContractMoney({ subtotal: 100, depositAmount: 150, total: 100 }),
    ).toThrow("deposit_exceeds_total");
  });

  it("defaultDepositFromTotal uses 30%", () => {
    expect(defaultDepositFromTotal(1000)).toBe(300);
  });
});
