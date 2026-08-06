import { MessageSquareWarning } from "lucide-react";

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

  return (
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
  );
}
