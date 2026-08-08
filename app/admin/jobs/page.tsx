import { Activity } from "lucide-react";
import { getTranslator } from "@/lib/i18n/t";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTable } from "@/components/admin/admin-table";
import { formatDateTime } from "@/lib/format";
import { requirePlatformPermission } from "@/lib/platform/session";

export default async function AdminJobsPage() {
  const { t } = await getTranslator();
  const admin = await requirePlatformPermission("cron.read");

  const { data, error } = await admin.supabase
    .from("cron_runs")
    .select("id, job, started_at, finished_at, duration_ms, success, processed, errors")
    .order("started_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    job: row.job,
    startedAt: row.started_at,
    durationMs: row.duration_ms,
    success: row.success,
    processed: row.processed,
    errors: row.errors,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Jobs</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ultimele rulare din `cron_runs` pentru toate joburile.
        </p>
      </div>

      {error ? <AdminErrorState message={error.message} /> : null}

      {!error && rows.length === 0 ? (
        <AdminEmptyState
          icon={Activity}
          title="Niciun job"
          description={t("admin.noJobExecutions")}
        />
      ) : null}

      {!error && rows.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <AdminTable
            rows={rows}
            columns={[
              {
                key: "job",
                header: "Job",
                cell: (row) => <span className="text-foreground">{row.job}</span>,
              },
              {
                key: "started",
                header: "Start",
                cell: (row) => (
                  <span className="text-muted-foreground">{formatDateTime(row.startedAt)}</span>
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
