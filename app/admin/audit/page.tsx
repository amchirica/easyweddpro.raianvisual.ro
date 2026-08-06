import { ScrollText } from "lucide-react";

import { AdminAuditTimeline } from "@/components/admin/admin-audit-timeline";
import { AdminDetailPanel } from "@/components/admin/admin-detail-panel";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { listRecentActivityForAdmin } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";
import { requirePlatformPermission } from "@/lib/platform/session";

export default async function AdminAuditPage() {
  const admin = await requirePlatformPermission("audit.read");

  let platformError: string | null = null;
  let activityError: string | null = null;

  const { data: platformLogs, error: platformErr } = await admin.supabase
    .from("platform_audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  if (platformErr) platformError = platformErr.message;

  const actorIds = [
    ...new Set((platformLogs ?? []).map((row) => row.actor_id).filter(Boolean) as string[]),
  ];
  const { data: actors } = actorIds.length
    ? await admin.supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> };
  const actorById = new Map((actors ?? []).map((a) => [a.id, a.full_name]));

  let activity: Awaited<ReturnType<typeof listRecentActivityForAdmin>> = [];
  try {
    activity = await listRecentActivityForAdmin(admin.supabase, 40);
  } catch (error) {
    activityError = error instanceof Error ? error.message : "Nu am putut încărca activity_logs.";
  }

  const timeline = (platformLogs ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    title: `${row.action}${row.entity_type ? ` · ${row.entity_type}` : ""}`,
    reason: row.reason,
    createdAt: row.created_at,
    actorLabel: row.actor_id ? actorById.get(row.actor_id) ?? row.actor_id.slice(0, 8) : null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Audit platformă</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Jurnalul principal din `platform_audit_logs`, plus activitate recentă din workspace-uri.
        </p>
      </div>

      <AdminDetailPanel title="Platform audit logs">
        {platformError ? <AdminErrorState message={platformError} /> : null}
        {!platformError && timeline.length === 0 ? (
          <AdminEmptyState
            icon={ScrollText}
            title="Fără audit"
            description="Nu există încă înregistrări în platform_audit_logs."
          />
        ) : null}
        {!platformError && timeline.length > 0 ? (
          <AdminAuditTimeline items={timeline} />
        ) : null}
      </AdminDetailPanel>

      <AdminDetailPanel
        title="Activity logs (workspace)"
        description="Secțiune opțională — activitate din toate workspace-urile."
      >
        {activityError ? <AdminErrorState message={activityError} /> : null}
        {!activityError && activity.length === 0 ? (
          <p className="text-sm text-muted-soft">Nicio activitate workspace înregistrată.</p>
        ) : null}
        {!activityError && activity.length > 0 ? (
          <div className="divide-y divide-border">
            {activity.map((item) => (
              <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm text-foreground">{item.title}</p>
                  {item.description ? (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-soft">
                    {item.workspaceName}
                    {item.action ? ` · ${item.action}` : ""}
                  </p>
                </div>
                <p className="whitespace-nowrap text-xs text-muted-soft">
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </AdminDetailPanel>
    </div>
  );
}
