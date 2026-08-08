import { Activity, Bell, Mail, Server, Webhook } from "lucide-react";
import { getTranslator } from "@/lib/i18n/t";

import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTable } from "@/components/admin/admin-table";
import { getSystemStatusForAdmin } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";
import { requirePlatformPermission } from "@/lib/platform/session";

function Flag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <AdminStatusBadge label={ok ? "OK" : "Neconfigurat"} tone={ok ? "success" : "warning"} />
    </div>
  );
}

export default async function AdminSystemHealthPage() {
  const { t } = await getTranslator();
  const admin = await requirePlatformPermission("system.read");

  let loadError: string | null = null;
  let status: Awaited<ReturnType<typeof getSystemStatusForAdmin>> | null = null;
  try {
    status = await getSystemStatusForAdmin(admin.supabase);
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("admin.healthLoadFailed");
  }

  const lastRunner =
    status?.recentCronRuns.find((run) => run.job === "runner") ?? status?.recentCronRuns[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Health sistem</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.healthHint")}
        </p>
      </div>

      {loadError ? <AdminErrorState message={loadError} /> : null}

      {status ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <AdminMetricCard
              icon={Server}
              label="Ultimul cron"
              value={lastRunner ? formatDateTime(lastRunner.startedAt) : "—"}
              hint={
                lastRunner
                  ? `${lastRunner.success ? "Succes" : "Cu erori"} · ${lastRunner.processed} procesate · ${lastRunner.errors} erori`
                  : t("admin.noRunYet")
              }
            />
            <AdminMetricCard
              icon={Mail}
              label="Email queue"
              value={`${status.emailQueue.pending} pending`}
              hint={`${status.emailQueue.sent24h} trimise / 24h · ${status.emailQueue.failed} failed · ${status.emailQueue.skipped} skipped`}
            />
            <AdminMetricCard
              icon={Bell}
              label="Notificări"
              value={`${status.notifications.unread} necitite`}
              hint={
                status.notifications.lastNotificationsJob
                  ? `Total ${status.notifications.total} · ultimul job ${status.notifications.lastNotificationsJob.job} ${status.notifications.lastNotificationsJob.success ? "OK" : "Fail"}`
                  : `Total ${status.notifications.total}`
              }
            />
            <AdminMetricCard
              icon={Activity}
              label="Automations"
              value={`${status.automationQueue.running} running`}
              hint={`${status.automationQueue.success24h} ok / 24h · ${status.automationQueue.failed24h} failed`}
            />
            <AdminMetricCard
              icon={Webhook}
              label="Stripe webhooks"
              value={status.webhooks.processed24h}
              hint={t("admin.events24h")}
            />
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <Flag ok={status.resendConfigured} label="Resend" />
            <Flag ok={status.stripeConfigured} label="Stripe" />
            <Flag ok={status.storageConfigured} label="Storage / Supabase" />
          </section>

          <section className="surface-card overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-heading text-lg font-medium text-foreground">Joburi recente</h2>
            </div>
            <AdminTable
              rows={status.recentCronRuns}
              empty={
                <p className="px-5 py-8 text-sm text-muted-soft">
                  {t("admin.noCronRuns")}
                </p>
              }
              columns={[
                {
                  key: "job",
                  header: "Job",
                  cell: (run) => <span className="text-foreground">{run.job}</span>,
                },
                {
                  key: "start",
                  header: "Start",
                  cell: (run) => (
                    <span className="text-muted-foreground">{formatDateTime(run.startedAt)}</span>
                  ),
                },
                {
                  key: "duration",
                  header: t("admin.duration"),
                  cell: (run) => (
                    <span className="text-muted-foreground">
                      {run.durationMs != null ? `${run.durationMs} ms` : "—"}
                    </span>
                  ),
                },
                {
                  key: "processed",
                  header: "Procesate",
                  cell: (run) => <span className="text-muted-foreground">{run.processed}</span>,
                },
                {
                  key: "errors",
                  header: "Erori",
                  cell: (run) => <span className="text-muted-foreground">{run.errors}</span>,
                },
                {
                  key: "status",
                  header: "Status",
                  cell: (run) => (
                    <AdminStatusBadge
                      label={run.success ? "OK" : "Fail"}
                      tone={run.success ? "success" : "danger"}
                    />
                  ),
                },
              ]}
            />
          </section>
        </>
      ) : null}
    </div>
  );
}
