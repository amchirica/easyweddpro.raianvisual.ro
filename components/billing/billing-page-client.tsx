"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Contact,
  CreditCard,
  FileText,
  Layers,
  ScrollText,
  Users,
} from "lucide-react";

import { ModuleShell } from "@/components/shared/module-shell";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import {
  createBillingPortalSessionAction,
  createCheckoutSessionAction,
} from "@/lib/actions/billing";
import type { PlanDefinition, PlanId, PlanLimits, WorkspaceUsage } from "@/lib/billing/plans";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type SubscriptionSummary = {
  status: string;
  currentPeriodEnd: string | null;
  currentPeriodStart: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  billingInterval: "month" | "year" | null;
  hasStripeCustomer: boolean;
};

type BillingPageClientProps = {
  canManageBilling: boolean;
  isStripeConfigured: boolean;
  plans: PlanDefinition[];
  usage: WorkspaceUsage;
  limits: PlanLimits;
  subscription: SubscriptionSummary;
};

const STATUS_LABELS: Record<string, { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" }> = {
  active: { label: "Activ", tone: "success" },
  trialing: { label: "Perioadă de probă", tone: "accent" },
  past_due: { label: "Plată întârziată", tone: "warning" },
  canceled: { label: "Anulat", tone: "danger" },
  incomplete: { label: "Incomplet", tone: "danger" },
  incomplete_expired: { label: "Incomplet expirat", tone: "danger" },
  unpaid: { label: "Neplătit", tone: "danger" },
  inactive: { label: "Inactiv", tone: "neutral" },
};

function statusMeta(status: string) {
  return STATUS_LABELS[status] ?? { label: status, tone: "neutral" as const };
}

function limitLabel(current: number, limit: number | null): string {
  return limit == null ? `${current} · nelimitat` : `${current} / ${limit}`;
}

export function BillingPageClient({
  canManageBilling,
  isStripeConfigured,
  plans,
  usage,
  limits,
  subscription,
}: BillingPageClientProps) {
  const { toast } = useToast();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    subscription.billingInterval ?? "month",
  );
  const [checkoutBusyPlan, setCheckoutBusyPlan] = useState<PlanId | null>(null);
  const [portalBusy, setPortalBusy] = useState(false);

  const currentPlan = plans.find((plan) => plan.id === usage.plan) ?? plans[0];
  const status = statusMeta(subscription.status);

  async function handleUpgrade(planId: PlanId) {
    if (planId === "free" || !canManageBilling) return;
    setCheckoutBusyPlan(planId);
    const result = await createCheckoutSessionAction({ planId, interval: billingInterval });
    setCheckoutBusyPlan(null);
    if (result?.error || !result?.data?.url) {
      toast(result?.error ?? "Nu am putut iniția plata.", "error");
      return;
    }
    window.location.assign(result.data.url);
  }

  async function handlePortal() {
    if (!canManageBilling) return;
    setPortalBusy(true);
    const result = await createBillingPortalSessionAction();
    setPortalBusy(false);
    if (result?.error || !result?.data?.url) {
      toast(result?.error ?? "Nu am putut deschide portalul de facturare.", "error");
      return;
    }
    window.location.assign(result.data.url);
  }

  return (
    <ModuleShell
      title="Facturare"
      description="Planul curent, utilizarea workspace-ului și abonamentul Stripe."
    >
      <div className="space-y-8">
        {!isStripeConfigured ? (
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Facturarea prin Stripe nu este configurată încă pe acest mediu. Upgrade-urile și portalul de
              facturare vor fi disponibile după configurare.
            </p>
          </div>
        ) : null}

        <div className="surface-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="font-heading text-2xl font-medium text-foreground">{currentPlan.name}</p>
              <StatusBadge label={status.label} tone={status.tone} />
            </div>
            <p className="text-sm text-muted-foreground">{currentPlan.description}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-soft">
              {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd ? (
                <span className="flex items-center gap-1.5 text-warning">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                  Se anulează pe {formatDate(subscription.currentPeriodEnd)}
                </span>
              ) : subscription.currentPeriodEnd ? (
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden />
                  Se reînnoiește pe {formatDate(subscription.currentPeriodEnd)}
                </span>
              ) : null}
              {subscription.status === "trialing" && subscription.trialEnd ? (
                <span>Perioada de probă expiră pe {formatDate(subscription.trialEnd)}</span>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handlePortal}
            disabled={!canManageBilling || !isStripeConfigured || !subscription.hasStripeCustomer || portalBusy}
            title={
              !subscription.hasStripeCustomer
                ? "Alege mai întâi un plan plătit pentru a activa facturarea."
                : undefined
            }
          >
            <CreditCard data-icon="inline-start" />
            {portalBusy ? "Se deschide…" : "Gestionează facturarea"}
          </Button>
        </div>

        <div>
          <h2 className="mb-3 font-heading text-lg font-medium text-foreground">Utilizare curentă</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Leaduri active"
              value={limitLabel(usage.activeLeads, limits.activeLeads)}
              icon={Users}
            />
            <StatCard label="Clienți" value={limitLabel(usage.clients, limits.clients)} icon={Contact} />
            <StatCard label="Utilizatori" value={limitLabel(usage.users, limits.users)} icon={Layers} />
            <StatCard
              label="Oferte active"
              value={limitLabel(usage.activeProposals, limits.activeProposals)}
              icon={FileText}
            />
            <StatCard
              label="Contracte active"
              value={limitLabel(usage.activeContracts, limits.activeContracts)}
              icon={ScrollText}
            />
          </div>
        </div>

        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-lg font-medium text-foreground">Planuri</h2>
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
                Lunar
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
                Anual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => {
              const isCurrent = plan.id === usage.plan;
              const isFree = plan.id === "free";
              return (
                <div
                  key={plan.id}
                  className={cn(
                    "surface-card flex flex-col gap-4 p-5",
                    isCurrent && "border-champagne/40",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background/40 text-champagne">
                      <Layers className="h-4 w-4" aria-hidden />
                    </div>
                    {isCurrent ? (
                      <StatusBadge label="Plan curent" tone="accent" />
                    ) : plan.highlighted ? (
                      <StatusBadge label="Popular" tone="accent" />
                    ) : null}
                  </div>
                  <div>
                    <p className="font-heading text-lg font-medium text-foreground">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <p className="font-heading text-2xl font-medium text-foreground">
                    {plan.priceMonthlyRon === 0 ? "Gratuit" : formatCurrency(plan.priceMonthlyRon)}
                    {plan.priceMonthlyRon > 0 ? (
                      <span className="text-sm text-muted-soft"> /lună</span>
                    ) : null}
                  </p>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto">
                    {isFree ? (
                      <Button type="button" variant="outline" disabled className="w-full justify-center">
                        {isCurrent ? "Plan curent" : "Plan de bază"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant={isCurrent ? "outline" : "default"}
                        className="w-full justify-center"
                        disabled={
                          isCurrent ||
                          !canManageBilling ||
                          !isStripeConfigured ||
                          checkoutBusyPlan === plan.id
                        }
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {isCurrent
                          ? "Plan curent"
                          : checkoutBusyPlan === plan.id
                            ? "Se redirecționează…"
                            : plan.cta}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {!canManageBilling ? (
            <p className="mt-4 text-xs text-muted-soft">
              Doar proprietarul sau administratorul workspace-ului poate schimba planul de facturare.
            </p>
          ) : null}
        </div>
      </div>
    </ModuleShell>
  );
}
