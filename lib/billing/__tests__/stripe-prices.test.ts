import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getMissingStripePriceEnvKeys,
  getPriceId,
  mapPriceIdToPlan,
} from "@/lib/billing/stripe";

const PRICE_KEYS = [
  "STRIPE_PRICE_SOLO_MONTHLY",
  "STRIPE_PRICE_SOLO_YEARLY",
  "STRIPE_PRICE_STUDIO_MONTHLY",
  "STRIPE_PRICE_STUDIO_YEARLY",
  "STRIPE_PRICE_AGENCY_MONTHLY",
  "STRIPE_PRICE_AGENCY_YEARLY",
] as const;

const saved: Record<string, string | undefined> = {};

function stashEnv() {
  for (const key of PRICE_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
}

function restoreEnv() {
  for (const key of PRICE_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

afterEach(() => {
  restoreEnv();
});

describe("getPriceId", () => {
  it("returns a valid price_ id from env", () => {
    stashEnv();
    process.env.STRIPE_PRICE_SOLO_MONTHLY = "price_solo_month_test";
    expect(getPriceId("solo", "month")).toBe("price_solo_month_test");
  });

  it("returns null when env holds a prod_ id", () => {
    stashEnv();
    process.env.STRIPE_PRICE_SOLO_YEARLY = "prod_not_a_price";
    expect(getPriceId("solo", "year")).toBeNull();
  });
});

describe("getMissingStripePriceEnvKeys", () => {
  it("lists missing or invalid STRIPE_PRICE_* keys", () => {
    stashEnv();
    process.env.STRIPE_PRICE_SOLO_MONTHLY = "price_ok";
    process.env.STRIPE_PRICE_SOLO_YEARLY = "prod_bad";
    const missing = getMissingStripePriceEnvKeys();
    expect(missing).toContain("STRIPE_PRICE_SOLO_YEARLY");
    expect(missing).toContain("STRIPE_PRICE_STUDIO_MONTHLY");
    expect(missing).not.toContain("STRIPE_PRICE_SOLO_MONTHLY");
  });
});

describe("mapPriceIdToPlan", () => {
  it("maps monthly and yearly price ids back to plan + interval", () => {
    stashEnv();
    process.env.STRIPE_PRICE_STUDIO_MONTHLY = "price_studio_m";
    process.env.STRIPE_PRICE_STUDIO_YEARLY = "price_studio_y";
    expect(mapPriceIdToPlan("price_studio_m")).toEqual({ planId: "studio", interval: "month" });
    expect(mapPriceIdToPlan("price_studio_y")).toEqual({ planId: "studio", interval: "year" });
    expect(mapPriceIdToPlan("price_unknown")).toBeNull();
  });
});
