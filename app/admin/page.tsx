import { Building2, TrendingUp, Users, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getPlatformStats, listWorkspacesForAdmin } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/format";
import { requirePlatformAdmin } from "@/lib/workspace/session";

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  solo: "Solo",
  studio: "Studio",
  agency: "Agency",
};

function statusToneFor(status: string | null) {
  if (status === "active") return "success" as const;
  if (status === "suspended" || status === "cancelled") return "danger" as const;
  if (status === "past_due") return "warning" as const;
  return "accent" as const;
}

function statusLabelFor(status: string | null) {
  if (!status) return "Fără abonament";
  const map: Record<string, string> = {
    active: "Activ",
    trialing: "Trial",
    past_due: "Restanță",
    suspended: "Suspendat",
    cancelled: "Anulat",
  };
  return map[status] ?? status;
}

export default async function AdminOverviewPage() {
  const admin = await requirePlatformAdmin();
  const [stats, workspaces] = await Promise.all([
    getPlatformStats(admin.supabase),
    listWorkspacesForAdmin(admin.supabase, 6),
  ]);

  return (
    <div>
      <PageHeader
        title="Prezentare platformă"
        description="Metrici agregate la nivel de platformă EasyWedd Pro, calculate din date reale."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Workspace-uri"
          value={stats.workspaceCount.toString()}
          hint="Total înregistrate"
          icon={Building2}
        />
        <StatCard
          label="Utilizatori"
          value={stats.activeUserCount.toString()}
          hint="La nivelul întregii platforme"
          icon={Users}
        />
        <StatCard label="MRR" value={formatCurrency(stats.mrr)} hint="Abonamente active" icon={Wallet} />
        <StatCard
          label="Rată de churn"
          value={`${stats.churnRatePercent.toFixed(1)}%`}
          hint="Suspendate + anulate"
          icon={TrendingUp}
        />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-5">
        <div className="surface-card p-6 lg:col-span-2">
          <p className="font-heading text-lg font-medium text-foreground">Distribuție planuri</p>
          <div className="mt-5 space-y-4">
            {stats.planDistribution.map((item) => (
              <div key={item.planId}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{PLAN_LABEL[item.planId] ?? item.planId}</span>
                  <span className="text-muted-foreground">{item.count} workspace-uri</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                  <div className="h-full rounded-full bg-champagne" style={{ width: `${item.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-6 lg:col-span-3">
          <p className="font-heading text-lg font-medium text-foreground">Workspace-uri recente</p>
          {workspaces.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon={Building2} title="Niciun workspace" description="Nu există încă workspace-uri înregistrate." />
            </div>
          ) : (
            <div className="mt-5 space-y-2.5">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-elevated/60 p-3.5"
                >
                  <div>
                    <p className="text-sm text-foreground">{workspace.name}</p>
                    <p className="text-xs text-muted-soft">
                      {PLAN_LABEL[workspace.plan] ?? workspace.plan} · {formatDate(workspace.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    label={statusLabelFor(workspace.subscriptionStatus)}
                    tone={statusToneFor(workspace.subscriptionStatus)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
