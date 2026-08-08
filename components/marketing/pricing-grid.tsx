"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { PLAN_CATALOG, type PlanId } from "@/lib/billing/plan-catalog";
import {
  planDisplayPrice,
  yearlyPriceFromMonthly,
  yearlySavingsRon,
} from "@/lib/billing/pricing";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type PlanCopy = {
  description: string;
  cta: string;
  features: string[];
};

export function PricingGrid() {
  const { t, tm } = useI18n();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month");

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border border-border p-0.5">
          <button
            type="button"
            onClick={() => setBillingInterval("month")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              billingInterval === "month"
                ? "bg-champagne/15 text-champagne"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("marketing.common.billingIntervalMonthly")}
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("year")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              billingInterval === "year"
                ? "bg-champagne/15 text-champagne"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("marketing.common.billingIntervalYearly")}
          </button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_CATALOG.map((plan) => {
          const copy = tm<PlanCopy>(`marketing.plans.${plan.id as PlanId}`) ?? {
            description: plan.description,
            cta: plan.cta,
            features: plan.features,
          };
          const isFree = plan.priceMonthlyRon === 0;
          const yearlyTotal =
            plan.priceYearlyRon > 0
              ? plan.priceYearlyRon
              : yearlyPriceFromMonthly(plan.priceMonthlyRon);
          const displayPrice = isFree
            ? 0
            : billingInterval === "year"
              ? yearlyTotal
              : planDisplayPrice(plan.priceMonthlyRon, "month");
          const savings = yearlySavingsRon(plan.priceMonthlyRon);

          return (
            <div
              key={plan.id}
              className={cn(
                "surface-card relative flex flex-col p-6",
                plan.highlighted && "border-champagne/40 ring-1 ring-champagne/20",
              )}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 right-6 rounded-full bg-champagne px-3 py-1 text-[0.65rem] font-medium tracking-wide text-primary-foreground">
                  {t("marketing.common.mostPopular")}
                </span>
              ) : null}

              <p className="font-heading text-xl font-medium text-foreground">{plan.name}</p>
              <p className="mt-1.5 min-h-10 text-sm text-muted-foreground">{copy.description}</p>

              <div className="mt-5">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-heading text-3xl font-medium text-champagne">
                    {isFree ? t("marketing.common.free") : formatCurrency(displayPrice)}
                  </span>
                  {!isFree ? (
                    <span className="text-sm text-muted-soft">
                      {billingInterval === "year"
                        ? t("marketing.common.perYear")
                        : t("marketing.common.perMonth")}
                    </span>
                  ) : null}
                </div>
                {!isFree && billingInterval === "year" ? (
                  <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    <p>{t("marketing.common.oneMonthFree")}</p>
                    <p>
                      {t("marketing.common.savePerYear", {
                        amount: formatCurrency(savings),
                      })}
                    </p>
                  </div>
                ) : null}
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {copy.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "mt-6 w-full",
                  plan.highlighted && "bg-champagne text-primary-foreground hover:bg-champagne/90",
                )}
                variant={plan.highlighted ? "default" : "outline"}
                render={<Link href="/register" />}
                nativeButton={false}
              >
                {copy.cta}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
