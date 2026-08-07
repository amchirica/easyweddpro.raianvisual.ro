import { CircleHelp, MessageSquareWarning } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTable } from "@/components/admin/admin-table";
import { FeedbackActions } from "@/components/admin/feedback-actions";
import { formatDateTime } from "@/lib/format";
import { canPerformPlatformAction } from "@/lib/platform/permissions";
import { requirePlatformPermission } from "@/lib/platform/session";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "accent" | "muted"> = {
  new: "accent",
  triaged: "warning",
  resolved: "success",
  dismissed: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  new: "Nou",
  triaged: "Triage",
  resolved: "Rezolvat",
  dismissed: "Respins",
};

export default async function AdminFeedbackPage() {
  const admin = await requirePlatformPermission("feedback.read");
  const canWrite = canPerformPlatformAction(admin.platformRole, "feedback.write");

  const { data, error } = await admin.supabase
    .from("user_feedback")
    .select(
      "id, type, message, rating, page_url, status, priority, admin_notes, created_at, user_id, workspace_id",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    message: row.message,
    rating: row.rating,
    pageUrl: row.page_url,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
  }));

  const { data: assistantRows } = await admin.supabase
    .from("assistant_events")
    .select("id, surface, module_key, intent, resolved, provider, helpful, latency_ms, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const events = assistantRows ?? [];
  const moduleCounts = new Map<string, number>();
  let unresolved = 0;
  let negative = 0;
  for (const ev of events) {
    const key = ev.module_key ?? "(none)";
    moduleCounts.set(key, (moduleCounts.get(key) ?? 0) + 1);
    if (!ev.resolved) unresolved += 1;
    if (ev.helpful === false) negative += 1;
  }
  const topModules = [...moduleCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-medium text-foreground">Feedback</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Feedback-ul utilizatorilor din `user_feedback`.
          </p>
        </div>

        {error ? <AdminErrorState message={error.message} /> : null}

        {!error && rows.length === 0 ? (
          <AdminEmptyState
            icon={MessageSquareWarning}
            title="Niciun feedback"
            description="Nu există încă înregistrări de feedback."
          />
        ) : null}

        {!error && rows.length > 0 ? (
          <div className="surface-card overflow-hidden">
            <AdminTable
              rows={rows}
              columns={[
                {
                  key: "message",
                  header: "Mesaj",
                  cell: (row) => (
                    <div className="max-w-md">
                      <p className="text-foreground line-clamp-3">{row.message}</p>
                      <p className="mt-1 text-xs text-muted-soft">
                        {row.type}
                        {row.rating != null ? ` · rating ${row.rating}` : ""}
                        {row.pageUrl ? ` · ${row.pageUrl}` : ""}
                      </p>
                    </div>
                  ),
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
                  key: "actions",
                  header: "Acțiuni",
                  cell: (row) =>
                    canWrite ? (
                      <FeedbackActions
                        feedbackId={row.id}
                        currentStatus={row.status}
                        currentPriority={row.priority}
                      />
                    ) : (
                      <span className="text-xs text-muted-soft">—</span>
                    ),
                },
              ]}
            />
          </div>
        ) : null}
      </div>

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <CircleHelp className="mt-1 h-5 w-5 text-champagne" aria-hidden />
          <div>
            <h2 className="font-heading text-2xl font-medium text-foreground">
              Asistent — semnale (metadata)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fără transcript. Module, unresolved, thumbs down — pentru îmbunătățirea UX.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-soft">Evenimente recente</p>
            <p className="mt-1 font-heading text-2xl text-foreground">{events.length}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-soft">Unresolved</p>
            <p className="mt-1 font-heading text-2xl text-foreground">{unresolved}</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-soft">Thumbs down</p>
            <p className="mt-1 font-heading text-2xl text-foreground">{negative}</p>
          </div>
        </div>

        {topModules.length === 0 ? (
          <AdminEmptyState
            icon={CircleHelp}
            title="Nicio activitate asistent"
            description="După ce utilizatorii întreabă, vei vedea modulele care generează confuzie."
          />
        ) : (
          <div className="surface-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-soft">
              Top module
            </p>
            <ul className="mt-3 space-y-2">
              {topModules.map(([key, count]) => (
                <li
                  key={key}
                  className="flex items-center justify-between text-sm text-muted-foreground"
                >
                  <span className="text-foreground">{key}</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
