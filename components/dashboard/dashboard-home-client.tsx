"use client";

import Link from "next/link";
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

import { useI18n } from "@/components/providers/i18n-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { LEAD_STATUSES } from "@/lib/constants";
import type { ActivityViewModel } from "@/lib/crm/mappers";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";

const ACTIVITY_ICON: Record<string, typeof Activity> = {
  lead: UserPlus,
  proposal: FileCheck2,
  payment: Wallet,
  contract: FileCheck2,
  task: CheckSquare,
  client: Contact,
};

export type DashboardHomeStats = {
  newLeadsThisMonth: number;
  activeLeads: number;
  conversionRate: number;
  clientsCount: number;
  pipelineValue: number;
  dueFollowUps: number;
  pipelineByStatus: Array<{ status: string; count: number; value: number }>;
  leadSources: Array<{ source: string; count: number }>;
  recentActivity: ActivityViewModel[];
};

export function DashboardHomeClient({
  stats,
  currency,
}: {
  stats: DashboardHomeStats;
  currency: string;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-medium tracking-tight text-foreground md:text-4xl">
            {t("dashboard.title")}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
            {t("dashboard.overview")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" render={<Link href="/dashboard/clients" />} nativeButton={false}>
            {t("dashboard.viewClients")}
          </Button>
          <Button render={<Link href="/dashboard/leads" />} nativeButton={false}>
            <UserPlus data-icon="inline-start" />
            {t("dashboard.createLead")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label={t("dashboard.newLeads")}
          value={String(stats.newLeadsThisMonth)}
          hint={t("dashboard.hintThisMonth")}
          icon={UserPlus}
        />
        <StatCard
          label={t("dashboard.activeLeads")}
          value={String(stats.activeLeads)}
          hint={t("dashboard.hintInPipeline")}
          icon={TrendingUp}
        />
        <StatCard
          label={t("dashboard.conversionRate")}
          value={formatPercent(stats.conversionRate)}
          hint={t("dashboard.hintWonVsClosed")}
          icon={TrendingUp}
        />
        <StatCard
          label={t("dashboard.pipelineValue")}
          value={formatCurrency(stats.pipelineValue, currency)}
          hint={t("dashboard.hintActiveLeads")}
          icon={Wallet}
        />
        <StatCard
          label={t("dashboard.clients")}
          value={String(stats.clientsCount)}
          hint={t("dashboard.hintActiveTotal")}
          icon={Contact}
        />
        <StatCard
          label={t("dashboard.overdueFollowUps")}
          value={String(stats.dueFollowUps)}
          hint={t("dashboard.hintNeedsFollowUp")}
          icon={AlertTriangle}
        />
      </div>

      <section className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium text-foreground">
            {t("dashboard.leadsPipeline")}
          </h2>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/leads" />} nativeButton={false}>
            {t("dashboard.viewAll")}
            <ArrowUpRight data-icon="inline-end" />
          </Button>
        </div>
        {stats.pipelineByStatus.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title={t("dashboard.noLeadsYet")}
            description={t("dashboard.noLeadsYetHint")}
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
                  <p className="text-xs text-muted-foreground">{t(`status.lead.${status}`)}</p>
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
              {t("dashboard.leadSources")}
            </h2>
            {stats.leadSources.length === 0 ? (
              <EmptyState icon={TrendingUp} title={t("dashboard.noSourceData")} />
            ) : (
              <div className="space-y-3">
                {stats.leadSources.map((source) => {
                  const maxCount = Math.max(...stats.leadSources.map((s) => s.count), 1);
                  return (
                    <div key={source.source} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate text-sm text-muted-foreground">
                        {source.source}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
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
              {t("dashboard.modulesConnecting")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("dashboard.modulesConnectingHint")}</p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="surface-card p-5">
            <h2 className="mb-4 font-heading text-lg font-medium text-foreground">
              {t("dashboard.recentActivity")}
            </h2>
            {stats.recentActivity.length === 0 ? (
              <EmptyState icon={Activity} title={t("dashboard.noActivity")} />
            ) : (
              <ul className="space-y-4">
                {stats.recentActivity.map((item) => {
                  const Icon = ACTIVITY_ICON[item.type] ?? Activity;
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background/40 text-champagne">
                        <Icon className="h-3.5 w-3.5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground">{item.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
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
