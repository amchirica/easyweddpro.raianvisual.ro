import { Webhook } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminTable } from "@/components/admin/admin-table";
import { formatDateTime } from "@/lib/format";
import { requirePlatformPermission } from "@/lib/platform/session";

export default async function AdminWebhooksPage() {
  const admin = await requirePlatformPermission("webhooks.read");

  const { data, error } = await admin.supabase
    .from("stripe_webhook_events")
    .select("id, type, processed_at")
    .order("processed_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    processedAt: row.processed_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Webhook-uri Stripe</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Evenimente procesate din `stripe_webhook_events`. Nu se afișează secrete sau payload-uri complete.
        </p>
      </div>

      {error ? <AdminErrorState message={error.message} /> : null}

      {!error && rows.length === 0 ? (
        <AdminEmptyState
          icon={Webhook}
          title="Niciun eveniment"
          description="Nu există încă evenimente Stripe procesate."
        />
      ) : null}

      {!error && rows.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <AdminTable
            rows={rows}
            columns={[
              {
                key: "id",
                header: "Event ID",
                cell: (row) => (
                  <code className="break-all text-xs text-foreground">{row.id}</code>
                ),
              },
              {
                key: "type",
                header: "Tip",
                cell: (row) => <span className="text-muted-foreground">{row.type}</span>,
              },
              {
                key: "processed",
                header: "Procesat la",
                cell: (row) => (
                  <span className="text-muted-soft">{formatDateTime(row.processedAt)}</span>
                ),
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
