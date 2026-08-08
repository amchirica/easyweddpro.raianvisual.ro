import Link from "next/link";
import { getTranslator } from "@/lib/i18n/t";
import { Wallet } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTable } from "@/components/admin/admin-table";
import { listSubscriptionsForAdmin } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/format";
import { requirePlatformPermission } from "@/lib/platform/session";

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  solo: "Solo",
  studio: "Studio",
  agency: "Agency",
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "accent"> = {
  active: "success",
  trialing: "accent",
  past_due: "warning",
  suspended: "danger",
  cancelled: "danger",
  inactive: "accent",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Activ",
  trialing: "Trial",
  past_due: "past_due",
  suspended: "Suspendat",
  cancelled: "Anulat",
  inactive: "Free",
};

const INTERVAL_LABEL: Record<string, string> = {
  month: "Lunar",
  year: "Anual",
};

export default async function AdminSubscriptionsPage() {
  const { t } = await getTranslator();
  const admin = await requirePlatformPermission("subscriptions.read");

  let loadError: string | null = null;
  let subscriptions: Awaited<ReturnType<typeof listSubscriptionsForAdmin>> = [];
  try {
    subscriptions = await listSubscriptionsForAdmin(admin.supabase);
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("admin.subsLoadFailed");
  }

  const mrr = subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + s.amount, 0);
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const pastDueCount = subscriptions.filter((s) => s.status === "past_due").length;
  const freeCount = subscriptions.filter(
    (s) => s.isFreeFallback || s.plan === "free",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Abonamente</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.subsPageHint")}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminMetricCard label="MRR activ" value={formatCurrency(mrr)} icon={Wallet} />
        <AdminMetricCard label="Abonamente active" value={activeCount} />
        <AdminMetricCard label="Free" value={freeCount} hint={t("admin.noSubsYet")} />
        <AdminMetricCard label={t("admin.pastDues")} value={pastDueCount} hint={t("admin.needsAttention")} />
      </section>

      {loadError ? <AdminErrorState message={loadError} /> : null}

      {!loadError && subscriptions.length === 0 ? (
        <AdminEmptyState
          icon={Wallet}
          title="Niciun abonament"
          description={t("admin.noSubsYet")}
        />
      ) : null}

      {!loadError && subscriptions.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <AdminTable
            rows={subscriptions}
            columns={[
              {
                key: "workspace",
                header: "Workspace",
                cell: (sub) => (
                  <Link
                    href={
                      sub.isFreeFallback
                        ? `/admin/workspaces/${sub.workspaceId}`
                        : `/admin/subscriptions/${sub.id}`
                    }
                    className="text-foreground hover:text-champagne-soft"
                  >
                    {sub.workspaceName}
                  </Link>
                ),
              },
              {
                key: "plan",
                header: "Plan",
                cell: (sub) => (
                  <span className="text-muted-foreground">
                    {PLAN_LABEL[sub.plan] ?? sub.plan}
                    {sub.isFreeFallback ? " · fără rând Stripe" : ""}
                  </span>
                ),
              },
              {
                key: "interval",
                header: "Interval",
                cell: (sub) => (
                  <span className="text-muted-foreground">
                    {sub.billingInterval
                      ? INTERVAL_LABEL[sub.billingInterval] ?? sub.billingInterval
                      : "—"}
                  </span>
                ),
              },
              {
                key: "amount",
                header: "Valoare",
                cell: (sub) => (
                  <span className="text-muted-foreground">
                    {sub.amount === 0 ? "—" : formatCurrency(sub.amount)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (sub) => (
                  <AdminStatusBadge
                    label={
                      sub.isFreeFallback || sub.plan === "free"
                        ? "Free"
                        : STATUS_LABEL[sub.status] ?? sub.status
                    }
                    tone={
                      sub.isFreeFallback || sub.plan === "free"
                        ? "accent"
                        : STATUS_TONE[sub.status] ?? "accent"
                    }
                  />
                ),
              },
              {
                key: "cancel",
                header: "Cancel la final",
                cell: (sub) => (
                  <span className="text-muted-soft">
                    {sub.cancelAtPeriodEnd ? "Da" : "Nu"}
                  </span>
                ),
              },
              {
                key: "period",
                header: t("admin.periodUntil"),
                cell: (sub) => (
                  <span className="text-muted-soft">
                    {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}
                  </span>
                ),
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
