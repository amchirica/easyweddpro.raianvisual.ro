import { Check, Layers } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { PLAN_CATALOG } from "@/lib/billing/plan-catalog";
import { formatCurrency } from "@/lib/format";
import { requirePlatformAdmin } from "@/lib/workspace/session";

export default async function AdminPlansPage() {
  await requirePlatformAdmin();

  return (
    <div>
      <PageHeader
        title="Planuri"
        description="Catalogul de planuri disponibile pe platformă (definit în cod, doar citire)."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLAN_CATALOG.map((plan) => (
          <div key={plan.id} className="surface-card flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                <Layers className="h-4 w-4" aria-hidden />
              </div>
              {plan.highlighted ? <StatusBadge label="Popular" tone="accent" /> : null}
            </div>
            <div>
              <p className="font-heading text-lg font-medium text-foreground">{plan.name}</p>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </div>
            <p className="font-heading text-2xl font-medium text-foreground">
              {plan.priceMonthlyRon === 0 ? "Gratuit" : formatCurrency(plan.priceMonthlyRon)}
              {plan.priceMonthlyRon > 0 ? <span className="text-sm text-muted-soft"> /lună</span> : null}
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-auto border-t border-border pt-3 text-xs text-muted-soft">
              {plan.limits.users} utilizator{plan.limits.users > 1 ? "i" : ""} ·{" "}
              {plan.limits.automations ? "Automatizări" : "Fără automatizări"} ·{" "}
              {plan.limits.analytics ? "Analytics" : "Fără analytics"}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-soft">
        Nu există încă un tabel `plans` — catalogul e definit în `lib/billing/plan-catalog.ts`. Schimbarea planului
        unui workspace se face din pagina Workspace-uri.
      </p>
    </div>
  );
}
