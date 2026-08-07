import type { Metadata } from "next";
import { BarChart3, CalendarClock, FileText, Lock, ScrollText, TrendingUp, UserPlus, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchWorkspaceAnalyticsSummary, type WorkspaceAnalyticsSummary } from "@/lib/data/analytics";
import { formatCurrency } from "@/lib/format";
import { getTranslator } from "@/lib/i18n/t";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Analytics · EasyWedd Pro",
};

type AnalyticsPageProps = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function CurrencyBreakdown({
  title,
  map,
  emptyLabel,
}: {
  title: string;
  map: Record<string, number>;
  emptyLabel: string;
}) {
  const entries = Object.entries(map);
  return (
    <div className="surface-card p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-soft">{emptyLabel}</p>
      ) : (
        <div className="mt-3 space-y-1.5">
          {entries.map(([currency, value]) => (
            <div key={currency} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{currency}</span>
              <span className="font-medium text-foreground">{formatCurrency(value, currency)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeadSourcesBreakdown({
  map,
  title,
  emptyLabel,
}: {
  map: Record<string, number>;
  title: string;
  emptyLabel: string;
}) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const max = entries.reduce((acc, [, value]) => Math.max(acc, value), 0);

  return (
    <div className="surface-card p-6">
      <p className="font-heading text-lg font-medium text-foreground">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-soft">{emptyLabel}</p>
      ) : (
        <div className="mt-5 space-y-4">
          {entries.map(([source, count]) => (
            <div key={source}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground">{source}</span>
                <span className="text-muted-foreground">{count}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                <div
                  className="h-full rounded-full bg-champagne"
                  style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function isEmptySummary(summary: WorkspaceAnalyticsSummary): boolean {
  return (
    summary.leadsCreated === 0 &&
    summary.proposalsSent === 0 &&
    summary.contractsCreated === 0 &&
    summary.activeProjects === 0 &&
    summary.overdueTasks === 0 &&
    summary.upcomingEvents === 0 &&
    Object.keys(summary.contractedByCurrency).length === 0 &&
    Object.keys(summary.collectedByCurrency).length === 0
  );
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { t } = await getTranslator();
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);
  const params = await searchParams;

  if (!permissions.canReadAnalytics) {
    return (
      <ModuleShell
        title={t("modules.analytics.title")}
        description={t("modules.analytics.description")}
      >
        <EmptyState
          icon={Lock}
          title={t("modules.analytics.noPermission")}
          description={t("modules.analytics.noPermissionHint")}
        />
      </ModuleShell>
    );
  }

  const from = params.from && DATE_RE.test(params.from) ? params.from : undefined;
  const to = params.to && DATE_RE.test(params.to) ? params.to : undefined;

  let summary: WorkspaceAnalyticsSummary | null = null;
  let loadError: string | null = null;

  try {
    summary = await fetchWorkspaceAnalyticsSummary(ctx.supabase, ctx.activeWorkspace.id, { from, to });
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("common.loadFailed");
  }

  const periodLabel =
    from || to
      ? t("modules.analytics.periodRange", {
          from: from ?? t("modules.analytics.periodStart"),
          to: to ?? t("modules.analytics.periodToday"),
        })
      : t("modules.analytics.periodDefault");

  return (
    <ModuleShell
      title={t("modules.analytics.title")}
      description={t("modules.analytics.description")}
    >
      <div className="space-y-6">
        <form method="get" className="surface-card flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="analytics-from">{t("modules.analytics.from")}</Label>
            <Input id="analytics-from" type="date" name="from" defaultValue={from ?? ""} className="h-9 w-40" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="analytics-to">{t("modules.analytics.to")}</Label>
            <Input id="analytics-to" type="date" name="to" defaultValue={to ?? ""} className="h-9 w-40" />
          </div>
          <Button type="submit" size="sm">
            {t("modules.analytics.filter")}
          </Button>
          {from || to ? (
            <Button type="button" variant="ghost" size="sm" render={<a href="/dashboard/analytics" />} nativeButton={false}>
              {t("modules.analytics.reset")}
            </Button>
          ) : null}
          <p className="ml-auto text-xs text-muted-soft">{periodLabel}</p>
        </form>

        {loadError ? (
          <EmptyState
            icon={BarChart3}
            title={t("modules.analytics.unavailable")}
            description={loadError}
          />
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={t("modules.analytics.newLeads")} value={summary.leadsCreated.toString()} icon={UserPlus} />
              <StatCard label={t("modules.analytics.proposalsSent")} value={summary.proposalsSent.toString()} icon={FileText} />
              <StatCard label={t("modules.analytics.proposalsAccepted")} value={summary.proposalsAccepted.toString()} icon={TrendingUp} />
              <StatCard label={t("modules.analytics.contractsCreated")} value={summary.contractsCreated.toString()} icon={ScrollText} />
              <StatCard label={t("modules.analytics.contractsAccepted")} value={summary.contractsAccepted.toString()} icon={ScrollText} />
              <StatCard label={t("modules.analytics.activeProjects")} value={summary.activeProjects.toString()} icon={BarChart3} />
              <StatCard label={t("modules.analytics.overdueTasks")} value={summary.overdueTasks.toString()} icon={CalendarClock} />
              <StatCard label={t("modules.analytics.upcomingEvents")} value={summary.upcomingEvents.toString()} icon={CalendarClock} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <CurrencyBreakdown
                title={t("modules.analytics.contractedValue")}
                map={summary.contractedByCurrency}
                emptyLabel={t("modules.analytics.noDataPeriod")}
              />
              <CurrencyBreakdown
                title={t("modules.analytics.collected")}
                map={summary.collectedByCurrency}
                emptyLabel={t("modules.analytics.noDataPeriod")}
              />
              <CurrencyBreakdown
                title={t("modules.analytics.outstanding")}
                map={summary.outstandingByCurrency}
                emptyLabel={t("modules.analytics.noDataPeriod")}
              />
            </div>

            <LeadSourcesBreakdown
              map={summary.leadsBySource}
              title={t("modules.analytics.leadsBySource")}
              emptyLabel={t("modules.analytics.noLeadsPeriod")}
            />

            {isEmptySummary(summary) ? (
              <EmptyState
                icon={Wallet}
                title={t("modules.analytics.empty")}
                description={t("modules.analytics.emptyHint")}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </ModuleShell>
  );
}
