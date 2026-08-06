import Link from "next/link";
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
};

const STATUS_LABEL: Record<string, string> = {
  active: "Activ",
  trialing: "Trial",
  past_due: "Restanță",
  suspended: "Suspendat",
  cancelled: "Anulat",
};

export default async function AdminSubscriptionsPage() {
  const admin = await requirePlatformPermission("subscriptions.read");

  let loadError: string | null = null;
  let subscriptions: Awaited<ReturnType<typeof listSubscriptionsForAdmin>> = [];
  try {
    subscriptions = await listSubscriptionsForAdmin(admin.supabase);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Nu am putut încărca abonamentele.";
  }

  const mrr = subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + s.amount, 0);
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const pastDueCount = subscriptions.filter((s) => s.status === "past_due").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Abonamente</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Facturare la nivel de platformă pentru toate workspace-urile.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <AdminMetricCard label="MRR activ" value={formatCurrency(mrr)} icon={Wallet} />
        <AdminMetricCard label="Abonamente active" value={activeCount} />
        <AdminMetricCard label="Restanțe" value={pastDueCount} hint="Necesită atenție" />
      </section>

      {loadError ? <AdminErrorState message={loadError} /> : null}

      {!loadError && subscriptions.length === 0 ? (
        <AdminEmptyState
          icon={Wallet}
          title="Niciun abonament"
          description="Nu există încă abonamente înregistrate."
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
                    href={`/admin/subscriptions/${sub.id}`}
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
                  <span className="text-muted-foreground">{PLAN_LABEL[sub.plan] ?? sub.plan}</span>
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
                    label={STATUS_LABEL[sub.status] ?? sub.status}
                    tone={STATUS_TONE[sub.status] ?? "accent"}
                  />
                ),
              },
              {
                key: "period",
                header: "Perioadă curentă până la",
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
