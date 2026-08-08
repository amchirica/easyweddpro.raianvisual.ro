import "server-only";

import Stripe from "stripe";

import type { PlanId } from "@/lib/billing/plan-catalog";
import { assertStripePriceId } from "@/lib/billing/pricing";

export type BillingInterval = "month" | "year";
export type PaidPlanId = Exclude<PlanId, "free">;

let stripeSingleton: Stripe | null = null;

/** True when the secret key is set — the minimum requirement to call the Stripe API. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Returns the shared Stripe client. Throws if STRIPE_SECRET_KEY is missing — callers must check isStripeConfigured() first. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY nu este configurat.");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

export function getStripeWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

type PriceEnvKey =
  | "STRIPE_PRICE_SOLO_MONTHLY"
  | "STRIPE_PRICE_SOLO_YEARLY"
  | "STRIPE_PRICE_STUDIO_MONTHLY"
  | "STRIPE_PRICE_STUDIO_YEARLY"
  | "STRIPE_PRICE_AGENCY_MONTHLY"
  | "STRIPE_PRICE_AGENCY_YEARLY";

const PRICE_ENV_MAP: Record<PaidPlanId, Record<BillingInterval, PriceEnvKey>> = {
  solo: { month: "STRIPE_PRICE_SOLO_MONTHLY", year: "STRIPE_PRICE_SOLO_YEARLY" },
  studio: { month: "STRIPE_PRICE_STUDIO_MONTHLY", year: "STRIPE_PRICE_STUDIO_YEARLY" },
  agency: { month: "STRIPE_PRICE_AGENCY_MONTHLY", year: "STRIPE_PRICE_AGENCY_YEARLY" },
};

/**
 * Reads the configured Stripe price id for a paid plan + billing interval from env.
 * Only accepts `price_...` IDs (never `prod_...` product IDs).
 */
export function getPriceId(planId: PaidPlanId, interval: BillingInterval): string | null {
  const envKey = PRICE_ENV_MAP[planId]?.[interval];
  if (!envKey) return null;
  const value = process.env[envKey]?.trim() || null;
  if (!value) return null;
  if (!assertStripePriceId(value)) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[stripe] ${envKey} must be a price_... id, got: ${value.slice(0, 12)}…`);
    }
    return null;
  }
  return value;
}

/** Reports which STRIPE_PRICE_* env vars are missing or invalid (prod_ rejected). */
export function getMissingStripePriceEnvKeys(): string[] {
  const missing: string[] = [];
  (Object.keys(PRICE_ENV_MAP) as PaidPlanId[]).forEach((planId) => {
    (["month", "year"] as BillingInterval[]).forEach((interval) => {
      const envKey = PRICE_ENV_MAP[planId][interval];
      const raw = process.env[envKey]?.trim();
      if (!raw || !assertStripePriceId(raw)) missing.push(envKey);
    });
  });
  return missing;
}

export type PricedPlan = { planId: PaidPlanId; interval: BillingInterval };

/** Builds a price-id -> plan/interval lookup from env, skipping any prices that are not configured. */
export function getPriceCatalog(): Map<string, PricedPlan> {
  const map = new Map<string, PricedPlan>();
  (Object.keys(PRICE_ENV_MAP) as PaidPlanId[]).forEach((planId) => {
    (["month", "year"] as BillingInterval[]).forEach((interval) => {
      const priceId = getPriceId(planId, interval);
      if (priceId) map.set(priceId, { planId, interval });
    });
  });
  return map;
}

/** Maps a Stripe price id back to our internal plan + interval. Returns null for unknown/legacy prices. */
export function mapPriceIdToPlan(priceId: string | null | undefined): PricedPlan | null {
  if (!priceId) return null;
  return getPriceCatalog().get(priceId) ?? null;
}
