import { Mail } from "lucide-react";
import { getTranslator } from "@/lib/i18n/t";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTable } from "@/components/admin/admin-table";
import { formatDateTime } from "@/lib/format";
import { requirePlatformPermission } from "@/lib/platform/session";

function maskRecipient(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const prefix = (local ?? "").slice(0, 2);
  return `${prefix}***@${domain}`;
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "accent" | "muted"> = {
  sent: "success",
  pending: "accent",
  failed: "danger",
  skipped: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  sent: "Trimis",
  pending: "pending",
  failed: "failed",
  skipped: "skipped",
};

export default async function AdminEmailDeliveriesPage() {
  const { t } = await getTranslator();
  const admin = await requirePlatformPermission("emails.read");

  const { data, error } = await admin.supabase
    .from("email_deliveries")
    .select("id, recipient, template, status, sent_at, failed_at, created_at, error_code")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    recipient: maskRecipient(row.recipient),
    template: row.template,
    status: row.status,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    errorCode: row.error_code,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Email deliveries</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.deliveriesHint")}
        </p>
      </div>

      {error ? <AdminErrorState message={error.message} /> : null}

      {!error && rows.length === 0 ? (
        <AdminEmptyState
          icon={Mail}
          title="Nicio livrare"
          description={t("admin.noDeliveries")}
        />
      ) : null}

      {!error && rows.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <AdminTable
            rows={rows}
            columns={[
              {
                key: "recipient",
                header: "Destinatar",
                cell: (row) => <span className="text-foreground">{row.recipient}</span>,
              },
              {
                key: "template",
                header: "Template",
                cell: (row) => <code className="text-xs text-muted-foreground">{row.template}</code>,
              },
              {
                key: "status",
                header: "Status",
                cell: (row) => (
                  <AdminStatusBadge
                    label={STATUS_LABEL[row.status] ?? row.status}
                    tone={STATUS_TONE[row.status] ?? "muted"}
                  />
                ),
              },
              {
                key: "created",
                header: "Creat",
                cell: (row) => (
                  <span className="text-muted-soft">{formatDateTime(row.createdAt)}</span>
                ),
              },
              {
                key: "sent",
                header: "Trimis",
                cell: (row) => (
                  <span className="text-muted-soft">
                    {row.sentAt ? formatDateTime(row.sentAt) : "—"}
                  </span>
                ),
              },
              {
                key: "error",
                header: "Eroare",
                cell: (row) => (
                  <span className="text-xs text-muted-soft">{row.errorCode ?? "—"}</span>
                ),
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
