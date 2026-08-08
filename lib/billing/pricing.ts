import type { PlanId } from "@/lib/billing/plan-catalog";

/** Annual = monthly × 11 (12 months access, pay equivalent of 11). */
export const YEARLY_MONTHS_CHARGED = 11;

export function yearlyPriceFromMonthly(monthlyRon: number): number {
  if (!Number.isFinite(monthlyRon) || monthlyRon <= 0) return 0;
  return Math.round(monthlyRon * YEARLY_MONTHS_CHARGED);
}

/** Savings vs paying monthly for 12 months (= one month free). */
export function yearlySavingsRon(monthlyRon: number): number {
  if (!Number.isFinite(monthlyRon) || monthlyRon <= 0) return 0;
  return Math.round(monthlyRon);
}

export function planDisplayPrice(
  monthlyRon: number,
  interval: "month" | "year",
): number {
  return interval === "year" ? yearlyPriceFromMonthly(monthlyRon) : monthlyRon;
}

export const PAID_PLAN_MONTHLY_RON: Record<Exclude<PlanId, "free">, number> = {
  solo: 79,
  studio: 179,
  agency: 349,
};

export function assertStripePriceId(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith("price_"));
}
