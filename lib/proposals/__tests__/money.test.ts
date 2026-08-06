import { describe, expect, it } from "vitest";

import { computeLineTotal, computeProposalTotals, roundMoney } from "@/lib/proposals/money";

describe("roundMoney", () => {
  it("rounds to 2 decimals using cents", () => {
    expect(roundMoney(10.006)).toBe(10.01);
    expect(roundMoney(10.001)).toBe(10);
    expect(roundMoney(19.999)).toBe(20);
  });
});

describe("computeLineTotal", () => {
  it("computes quantity * unit - discount", () => {
    expect(
      computeLineTotal({ name: "Pachet", quantity: 2, unitPrice: 1000, discount: 100 }),
    ).toBe(1900);
  });

  it("rejects invalid lines", () => {
    expect(() =>
      computeLineTotal({ name: "X", quantity: 0, unitPrice: 10 }),
    ).toThrow("invalid_line_item");
    expect(() =>
      computeLineTotal({ name: "X", quantity: 1, unitPrice: 10, discount: 20 }),
    ).toThrow("invalid_line_total");
  });
});

describe("computeProposalTotals", () => {
  const baseItems = [
    { name: "Foto", quantity: 1, unitPrice: 10000, discount: 0 },
    { name: "Video", quantity: 1, unitPrice: 5000, discount: 500 },
  ];

  it("computes subtotal with multiple items", () => {
    const result = computeProposalTotals({
      items: baseItems,
      discountType: "none",
      taxRate: 0,
    });
    expect(result.subtotal).toBe(14500);
    expect(result.total).toBe(14500);
  });

  it("applies percent discount then tax", () => {
    const result = computeProposalTotals({
      items: baseItems,
      discountType: "percent",
      discountValue: 10,
      taxRate: 19,
    });
    expect(result.discountAmount).toBe(1450);
    expect(result.taxAmount).toBe(2479.5);
    expect(result.total).toBe(15529.5);
  });

  it("applies fixed discount", () => {
    const result = computeProposalTotals({
      items: baseItems,
      discountType: "fixed",
      discountValue: 500,
      taxRate: 0,
    });
    expect(result.discountAmount).toBe(500);
    expect(result.total).toBe(14000);
  });

  it("supports zero VAT", () => {
    const result = computeProposalTotals({
      items: [{ name: "A", quantity: 1, unitPrice: 100, discount: 0 }],
      taxRate: 0,
    });
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(100);
  });

  it("rejects empty items and invalid discount/tax", () => {
    expect(() => computeProposalTotals({ items: [] })).toThrow("items_required");
    expect(() =>
      computeProposalTotals({
        items: baseItems,
        discountType: "percent",
        discountValue: 120,
      }),
    ).toThrow("invalid_discount");
    expect(() =>
      computeProposalTotals({
        items: baseItems,
        taxRate: 150,
      }),
    ).toThrow("invalid_tax");
  });
});
