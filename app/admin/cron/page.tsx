import { Timer } from "lucide-react";
import { getTranslator } from "@/lib/i18n/t";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTable } from "@/components/admin/admin-table";
import { CronRunNowButton } from "@/components/admin/cron-run-now";
import { formatDateTime } from "@/lib/format";
import { canPerformPlatformAction } from "@/lib/platform/permissions";
import { requirePlatformPermission } from "@/lib/platform/session";

export default async function AdminCronPage() {
  const { t } = await getTranslator();
  const admin = await requirePlatformPermission("cron.read");
  const canRun = canPerformPlatformAction(admin.platformRole, "cron.run");

  const { data, error } = await admin.supabase
    .from("cron_runs")
    .select("id, job, started_at, finished_at, duration_ms, success, processed, errors")
    .eq("job", "runner")
    .order("started_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    startedAt: row.started_at,
    durationMs: row.duration_ms,
    success: row.success,
    processed: row.processed,
    errors: row.errors,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-medium text-foreground">Cron</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Istoricul rularilor pentru job-ul `runner`.
          </p>
        </div>
        {canRun ? <CronRunNowButton /> : null}
      </div>

      {error ? <AdminErrorState message={error.message} /> : null}

      {!error && rows.length === 0 ? (
        <AdminEmptyState
          icon={Timer}
          title="Nicio rulare"
          description={t("admin.noCronExecutions")}
        />
      ) : null}

      {!error && rows.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <AdminTable
            rows={rows}
            columns={[
              {
                key: "started",
                header: "Start",
                cell: (row) => (
                  <span className="text-foreground">{formatDateTime(row.startedAt)}</span>
                ),
              },
              {
                key: "duration",
                header: t("admin.duration"),
                cell: (row) => (
                  <span className="text-muted-foreground">
                    {row.durationMs != null ? `${row.durationMs} ms` : "—"}
                  </span>
                ),
              },
              {
                key: "processed",
                header: "Procesate",
                cell: (row) => <span className="text-muted-foreground">{row.processed}</span>,
              },
              {
                key: "errors",
                header: "Erori",
                cell: (row) => <span className="text-muted-foreground">{row.errors}</span>,
              },
              {
                key: "status",
                header: "Status",
                cell: (row) => (
                  <AdminStatusBadge
                    label={row.success ? "OK" : "Fail"}
                    tone={row.success ? "success" : "danger"}
                  />
                ),
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
