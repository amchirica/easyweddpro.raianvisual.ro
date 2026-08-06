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
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Analytics · EasyWedd Pro",
};

type AnalyticsPageProps = {
  searchParams: Promise<{ from?: string; to?: string }>;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function CurrencyBreakdown({ title, map }: { title: string; map: Record<string, number> }) {
  const entries = Object.entries(map);
  return (
    <div className="surface-card p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-soft">Fără date pentru perioada selectată.</p>
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

function LeadSourcesBreakdown({ map }: { map: Record<string, number> }) {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const max = entries.reduce((acc, [, value]) => Math.max(acc, value), 0);

  return (
    <div className="surface-card p-6">
      <p className="font-heading text-lg font-medium text-foreground">Leaduri pe sursă</p>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-muted-soft">Fără leaduri în perioada selectată.</p>
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
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);
  const params = await searchParams;

  if (!permissions.canReadAnalytics) {
    return (
      <ModuleShell
        title="Analytics"
        description="Indicatori de performanță pentru vânzări, venituri și surse de leaduri."
      >
        <EmptyState
          icon={Lock}
          title="Nu ai permisiunea necesară"
          description="Contactează un administrator al workspace-ului pentru acces la analytics."
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
    loadError = error instanceof Error ? error.message : "Nu am putut încărca analytics.";
  }

  return (
    <ModuleShell
      title="Analytics"
      description="Indicatori de performanță pentru vânzări, venituri și surse de leaduri."
    >
      <div className="space-y-6">
        <form method="get" className="surface-card flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="analytics-from">De la</Label>
            <Input id="analytics-from" type="date" name="from" defaultValue={from ?? ""} className="h-9 w-40" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="analytics-to">Până la</Label>
            <Input id="analytics-to" type="date" name="to" defaultValue={to ?? ""} className="h-9 w-40" />
          </div>
          <Button type="submit" size="sm">
            Filtrează
          </Button>
          {from || to ? (
            <Button type="button" variant="ghost" size="sm" render={<a href="/dashboard/analytics" />} nativeButton={false}>
              Resetează
            </Button>
          ) : null}
          <p className="ml-auto text-xs text-muted-soft">
            {from || to ? `Perioadă: ${from ?? "început"} – ${to ?? "azi"}` : "Implicit: ultimele 90 de zile"}
          </p>
        </form>

        {loadError ? (
          <EmptyState
            icon={BarChart3}
            title="Analytics indisponibil"
            description={loadError}
          />
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Leaduri noi" value={summary.leadsCreated.toString()} icon={UserPlus} />
              <StatCard label="Oferte trimise" value={summary.proposalsSent.toString()} icon={FileText} />
              <StatCard label="Oferte acceptate" value={summary.proposalsAccepted.toString()} icon={TrendingUp} />
              <StatCard label="Contracte create" value={summary.contractsCreated.toString()} icon={ScrollText} />
              <StatCard label="Contracte acceptate" value={summary.contractsAccepted.toString()} icon={ScrollText} />
              <StatCard label="Proiecte active" value={summary.activeProjects.toString()} icon={BarChart3} />
              <StatCard label="Task-uri întârziate" value={summary.overdueTasks.toString()} icon={CalendarClock} />
              <StatCard label="Evenimente în 30 zile" value={summary.upcomingEvents.toString()} icon={CalendarClock} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <CurrencyBreakdown title="Valoare contractată (acceptate)" map={summary.contractedByCurrency} />
              <CurrencyBreakdown title="Încasat" map={summary.collectedByCurrency} />
              <CurrencyBreakdown title="Restant de încasat" map={summary.outstandingByCurrency} />
            </div>

            <LeadSourcesBreakdown map={summary.leadsBySource} />

            {isEmptySummary(summary) ? (
              <EmptyState
                icon={Wallet}
                title="Fără date de analytics pentru această perioadă"
                description="Indicatorii vor apărea pe măsură ce adaugi leaduri, oferte, contracte și plăți."
              />
            ) : null}
          </>
        ) : null}
      </div>
    </ModuleShell>
  );
}
