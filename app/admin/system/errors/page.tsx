import { Bug } from "lucide-react";
import { getTranslator } from "@/lib/i18n/t";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTable } from "@/components/admin/admin-table";
import { SystemErrorActions } from "@/components/admin/system-error-actions";
import { formatDateTime } from "@/lib/format";
import { canPerformPlatformAction } from "@/lib/platform/permissions";
import { requirePlatformPermission } from "@/lib/platform/session";

const SEVERITY_TONE: Record<string, "danger" | "warning" | "accent" | "muted"> = {
  critical: "danger",
  error: "danger",
  warning: "warning",
  info: "accent",
};

export default async function AdminSystemErrorsPage() {
  const { t } = await getTranslator();
  const admin = await requirePlatformPermission("system.read");
  const canWrite = canPerformPlatformAction(admin.platformRole, "system.write");

  const { data, error } = await admin.supabase
    .from("system_errors")
    .select(
      "id, severity, module, route, message, occurrence_count, first_seen_at, last_seen_at, resolved_at",
    )
    .is("resolved_at", null)
    .order("last_seen_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    severity: row.severity,
    module: row.module,
    route: row.route,
    message: row.message,
    occurrenceCount: row.occurrence_count,
    lastSeenAt: row.last_seen_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Erori sistem</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Erori deschise din `system_errors` (nerezolvate).
        </p>
      </div>

      {error ? <AdminErrorState message={error.message} /> : null}

      {!error && rows.length === 0 ? (
        <AdminEmptyState
          icon={Bug}
          title={t("admin.noOpenErrors")}
          description={t("admin.noOpenErrorsDesc")}
        />
      ) : null}

      {!error && rows.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <AdminTable
            rows={rows}
            columns={[
              {
                key: "severity",
                header: "Severitate",
                cell: (row) => (
                  <AdminStatusBadge
                    label={row.severity}
                    tone={SEVERITY_TONE[row.severity] ?? "muted"}
                  />
                ),
              },
              {
                key: "message",
                header: "Mesaj",
                cell: (row) => (
                  <div className="max-w-md">
                    <p className="text-foreground line-clamp-2">{row.message}</p>
                    <p className="mt-1 text-xs text-muted-soft">
                      {row.module}
                      {row.route ? ` · ${row.route}` : ""}
                    </p>
                  </div>
                ),
              },
              {
                key: "count",
                header: t("admin.occurrences"),
                cell: (row) => (
                  <span className="text-muted-foreground">{row.occurrenceCount}</span>
                ),
              },
              {
                key: "last",
                header: t("admin.lastSeen"),
                cell: (row) => (
                  <span className="text-muted-soft">{formatDateTime(row.lastSeenAt)}</span>
                ),
              },
              {
                key: "actions",
                header: t("common.actions"),
                cell: (row) =>
                  canWrite ? (
                    <SystemErrorActions errorId={row.id} />
                  ) : (
                    <span className="text-xs text-muted-soft">—</span>
                  ),
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
