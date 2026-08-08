import { describe, expect, it } from "vitest";

import {
  assertStripePriceId,
  planDisplayPrice,
  yearlyPriceFromMonthly,
  yearlySavingsRon,
} from "@/lib/billing/pricing";

describe("yearlyPriceFromMonthly", () => {
  it("charges 11 months for Solo/Studio/Agency", () => {
    expect(yearlyPriceFromMonthly(79)).toBe(869);
    expect(yearlyPriceFromMonthly(179)).toBe(1969);
    expect(yearlyPriceFromMonthly(349)).toBe(3839);
  });

  it("returns 0 for non-positive amounts", () => {
    expect(yearlyPriceFromMonthly(0)).toBe(0);
    expect(yearlyPriceFromMonthly(-10)).toBe(0);
  });
});

describe("yearlySavingsRon", () => {
  it("matches the monthly price (one month free)", () => {
    expect(yearlySavingsRon(79)).toBe(79);
    expect(yearlySavingsRon(179)).toBe(179);
    expect(yearlySavingsRon(349)).toBe(349);
  });
});

describe("planDisplayPrice", () => {
  it("returns monthly or yearly based on interval", () => {
    expect(planDisplayPrice(79, "month")).toBe(79);
    expect(planDisplayPrice(79, "year")).toBe(869);
  });
});

describe("assertStripePriceId", () => {
  it("accepts price_ ids", () => {
    expect(assertStripePriceId("price_abc123")).toBe(true);
  });

  it("rejects prod_ ids, empty, and nullish", () => {
    expect(assertStripePriceId("prod_abc123")).toBe(false);
    expect(assertStripePriceId("")).toBe(false);
    expect(assertStripePriceId(null)).toBe(false);
    expect(assertStripePriceId(undefined)).toBe(false);
  });
});
