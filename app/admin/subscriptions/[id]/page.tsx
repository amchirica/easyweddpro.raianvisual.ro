import Link from "next/link";
import { getTranslator } from "@/lib/i18n/t";
import { notFound } from "next/navigation";

import { AdminDetailGrid, AdminDetailPanel } from "@/components/admin/admin-detail-panel";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { PLAN_CATALOG } from "@/lib/billing/plan-catalog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { requirePlatformPermission } from "@/lib/platform/session";

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
  past_due: "past_due",
  suspended: "Suspendat",
  cancelled: "Anulat",
};

export default async function AdminSubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = await getTranslator();
  const { id } = await params;
  const admin = await requirePlatformPermission("subscriptions.read");

  const { data: sub, error } = await admin.supabase
    .from("subscriptions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-medium text-foreground">Abonament</h1>
        <AdminErrorState message={error.message} />
      </div>
    );
  }
  if (!sub) notFound();

  const { data: workspace } = await admin.supabase
    .from("workspaces")
    .select("id, name, slug")
    .eq("id", sub.workspace_id)
    .maybeSingle();

  const amount = PLAN_CATALOG.find((p) => p.id === sub.plan)?.priceMonthlyRon ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/subscriptions" className="text-xs text-muted-soft hover:text-foreground">
          {t("admin.backToSubscriptions")}
        </Link>
        <h1 className="mt-2 font-heading text-3xl font-medium text-foreground">
          {workspace?.name ?? "Abonament"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">ID: {sub.id}</p>
      </div>

      <AdminDetailPanel title="Detalii abonament">
        <AdminDetailGrid
          items={[
            {
              label: "Workspace",
              value: workspace ? (
                <Link
                  href={`/admin/workspaces/${workspace.id}`}
                  className="text-champagne-soft hover:underline"
                >
                  {workspace.name}
                </Link>
              ) : (
                sub.workspace_id
              ),
            },
            { label: "Plan", value: sub.plan === "free" ? "Free" : sub.plan },
            {
              label: "Status",
              value: (
                <AdminStatusBadge
                  label={STATUS_LABEL[sub.status] ?? sub.status}
                  tone={STATUS_TONE[sub.status] ?? "accent"}
                />
              ),
            },
            {
              label: t("admin.monthlyValue"),
              value: amount === 0 ? "—" : formatCurrency(amount),
            },
            { label: "Interval facturare", value: sub.billing_interval ?? "—" },
            {
              label: t("admin.trialUntil"),
              value: sub.trial_end
                ? formatDateTime(sub.trial_end)
                : sub.trial_ends_at
                  ? formatDateTime(sub.trial_ends_at)
                  : "—",
            },
            {
              label: t("admin.periodStart"),
              value: sub.current_period_start
                ? formatDateTime(sub.current_period_start)
                : "—",
            },
            {
              label: t("admin.periodEnd"),
              value: sub.current_period_end ? formatDateTime(sub.current_period_end) : "—",
            },
            {
              label: t("admin.cancelAtPeriodEnd"),
              value: sub.cancel_at_period_end ? "Da" : "Nu",
            },
            { label: "Stripe customer", value: sub.stripe_customer_id ?? "—" },
            { label: "Stripe subscription", value: sub.stripe_subscription_id ?? "—" },
            { label: "Stripe price", value: sub.stripe_price_id ?? "—" },
            { label: "Creat la", value: formatDateTime(sub.created_at) },
            { label: "Actualizat la", value: formatDateTime(sub.updated_at) },
          ]}
        />
      </AdminDetailPanel>
    </div>
  );
}
