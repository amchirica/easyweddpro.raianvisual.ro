import Link from "next/link";
import { getTranslator } from "@/lib/i18n/t";
import { Check, Layers } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { formatCurrency } from "@/lib/format";
import { listAdminPlans } from "@/lib/platform/plans";
import { requirePlatformPermission } from "@/lib/platform/session";

export default async function AdminPlansPage() {
  const { t } = await getTranslator();
  const admin = await requirePlatformPermission("plans.read");

  let loadError: string | null = null;
  let plans: Awaited<ReturnType<typeof listAdminPlans>> = [];
  try {
    plans = await listAdminPlans(admin.supabase);
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("admin.plansLoadFailed");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Planuri</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Catalogul de planuri din baza de date (cu fallback pe catalogul din cod).
        </p>
      </div>

      {loadError ? <AdminErrorState message={loadError} /> : null}

      {!loadError && plans.length === 0 ? (
        <AdminEmptyState
          icon={Layers}
          title="Niciun plan"
          description={t("admin.noPlans")}
        />
      ) : null}

      {!loadError && plans.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Link
              key={plan.id}
              href={`/admin/plans/${plan.id}`}
              className="surface-card flex flex-col gap-4 p-5 transition-colors hover:border-champagne/30"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                  <Layers className="h-4 w-4" aria-hidden />
                </div>
                <div className="flex flex-wrap gap-1">
                  {plan.highlighted ? <AdminStatusBadge label="Popular" tone="accent" /> : null}
                  {!plan.visible ? <AdminStatusBadge label="Ascuns" tone="muted" /> : null}
                  {!plan.active ? <AdminStatusBadge label="Inactiv" tone="danger" /> : null}
                </div>
              </div>
              <div>
                <p className="font-heading text-lg font-medium text-foreground">{plan.name}</p>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>
              <div>
                <p className="font-heading text-2xl font-medium text-foreground">
                  {plan.priceMonthlyRon === 0 ? "Gratuit" : formatCurrency(plan.priceMonthlyRon)}
                  {plan.priceMonthlyRon > 0 ? (
                    <span className="text-sm text-muted-soft">{t("admin.perMonth")}</span>
                  ) : null}
                </p>
                {plan.priceMonthlyRon > 0 && plan.priceYearly != null ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatCurrency(plan.priceYearly)}/an · 1 lună gratuită
                  </p>
                ) : null}
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {plan.features.slice(0, 5).map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
              <p className="mt-auto text-xs text-muted-soft">
                {t("admin.planSource", { source: plan.source === "db" ? t("admin.planSourceDb") : t("admin.planSourceCode"), version: plan.version })}
              </p>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
