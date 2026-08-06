import Link from "next/link";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PLAN_CATALOG } from "@/lib/billing/plan-catalog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PricingGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {PLAN_CATALOG.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "surface-card relative flex flex-col p-6",
            plan.highlighted && "border-champagne/40 ring-1 ring-champagne/20",
          )}
        >
          {plan.highlighted ? (
            <span className="absolute -top-3 right-6 rounded-full bg-champagne px-3 py-1 text-[0.65rem] font-medium tracking-wide text-primary-foreground">
              Cel mai popular
            </span>
          ) : null}

          <p className="font-heading text-xl font-medium text-foreground">{plan.name}</p>
          <p className="mt-1.5 min-h-10 text-sm text-muted-foreground">{plan.description}</p>

          <div className="mt-5 flex items-baseline gap-1.5">
            <span className="font-heading text-3xl font-medium text-champagne">
              {plan.priceMonthlyRon === 0 ? "Gratuit" : formatCurrency(plan.priceMonthlyRon)}
            </span>
            {plan.priceMonthlyRon > 0 ? (
              <span className="text-sm text-muted-soft">/lună</span>
            ) : null}
          </div>

          <ul className="mt-6 flex-1 space-y-2.5">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            className={cn("mt-6 w-full", plan.highlighted && "bg-champagne text-primary-foreground hover:bg-champagne/90")}
            variant={plan.highlighted ? "default" : "outline"}
            render={<Link href="/register" />} nativeButton={false}
          >
            {plan.cta}
          </Button>
        </div>
      ))}
    </div>
  );
}
