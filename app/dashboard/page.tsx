import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckSquare,
  Contact,
  FileCheck2,
  TrendingUp,
  UserPlus,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { mapActivityRow } from "@/lib/crm/mappers";
import { getDashboardStats as getLiveDashboardStats } from "@/lib/data/dashboard";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Dashboard · EasyWedd Pro",
};

const ACTIVITY_ICON: Record<string, typeof Activity> = {
  lead: UserPlus,
  proposal: FileCheck2,
  payment: Wallet,
  contract: FileCheck2,
  task: CheckSquare,
  client: Contact,
};

type LiveWorkspaceCtx = Extract<Awaited<ReturnType<typeof getWorkspaceOrDemo>>, { mode: "live" }>;

export default async function DashboardPage() {
  const ctx = await getWorkspaceOrDemo();
  return (
    <LiveDashboard
      supabase={ctx.supabase}
      workspaceId={ctx.workspace.id}
      currency={ctx.workspace.currency}
    />
  );
}

async function LiveDashboard({
  supabase,
  workspaceId,
  currency,
}: {
  supabase: LiveWorkspaceCtx["supabase"];
  workspaceId: string;
  currency: string;
}) {
  const stats = await getLiveDashboardStats(supabase, workspaceId);
  const recentActivity = stats.recentActivity.map(mapActivityRow);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            Dashboard
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            Privire de ansamblu asupra afacerii tale — leaduri, clienți și pipeline.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" render={<Link href="/dashboard/clients" />} nativeButton={false}>
            Vezi clienți
          </Button>
          <Button render={<Link href="/dashboard/leads" />} nativeButton={false}>
            <UserPlus data-icon="inline-start" />
            Lead nou
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Leaduri noi"
          value={String(stats.newLeadsThisMonth)}
          hint="Luna curentă"
          icon={UserPlus}
        />
        <StatCard
          label="Leaduri active"
          value={String(stats.activeLeads)}
          hint="În pipeline"
          icon={TrendingUp}
        />
        <StatCard
          label="Rata de conversie"
          value={formatPercent(stats.conversionRate)}
          hint="Leaduri câștigate vs. închise"
          icon={TrendingUp}
        />
        <StatCard
          label="Valoare pipeline"
          value={formatCurrency(stats.pipelineValue, currency)}
          hint="Leaduri active"
          icon={Wallet}
        />
        <StatCard
          label="Clienți"
          value={String(stats.clientsCount)}
          hint="Total activi"
          icon={Contact}
        />
        <StatCard
          label="Follow-up-uri restante"
          value={String(stats.dueFollowUps)}
          hint="Necesită urmărire"
          icon={AlertTriangle}
        />
      </div>

      <section className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium text-foreground">Pipeline leaduri</h2>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/leads" />} nativeButton={false}>
            Vezi toate
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        </div>
        {stats.pipelineByStatus.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="Niciun lead încă"
            description="Adaugă primul lead pentru a vedea pipeline-ul aici."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {LEAD_STATUSES.map((status) => {
              const entry = stats.pipelineByStatus.find((item) => item.status === status);
              return (
                <div
                  key={status}
                  className="rounded-xl border border-border bg-background/40 p-3 transition-colors hover:border-champagne/25"
                >
                  <p className="text-xs text-muted-foreground">{LEAD_STATUS_LABELS[status]}</p>
                  <p className="mt-1 font-heading text-xl font-medium text-foreground">
                    {entry?.count ?? 0}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-soft">
                    {formatCurrency(entry?.value ?? 0, currency)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="surface-card p-5">
            <h2 className="mb-5 font-heading text-lg font-medium text-foreground">
              Surse de leaduri
            </h2>
            {stats.leadSources.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Fără date de sursă încă" />
            ) : (
              <div className="space-y-3">
                {stats.leadSources.map((source) => {
                  const maxCount = Math.max(...stats.leadSources.map((s) => s.count), 1);
                  return (
                    <div key={source.source} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate text-sm text-muted-foreground">
                        {source.source}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-champagne"
                          style={{ width: `${(source.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-sm text-foreground">
                        {source.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="surface-card p-5">
            <h2 className="mb-2 font-heading text-lg font-medium text-foreground">
              Module în curs de conectare
            </h2>
            <p className="text-sm text-muted-foreground">
              Contracte, plăți, proiecte, calendar și task-uri nu sunt încă legate de date reale —
              vor apărea aici pe măsură ce sunt activate pentru workspace-ul tău.
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card p-5">
            <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
              Activitate recentă
            </h2>
            {recentActivity.length === 0 ? (
              <EmptyState icon={Activity} title="Fără activitate" />
            ) : (
              <ul className="space-y-4">
                {recentActivity.map((item) => {
                  const Icon = ACTIVITY_ICON[item.type] ?? Activity;
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background/40 text-champagne">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{item.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-soft">
                          {formatDate(item.at, {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
