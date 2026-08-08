import Link from "next/link";
import { getTranslator } from "@/lib/i18n/t";
import { Building2 } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTable } from "@/components/admin/admin-table";
import { WorkspaceActions } from "@/components/admin/workspace-actions";
import { listWorkspacesForAdmin } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/format";
import { requirePlatformPermission } from "@/lib/platform/session";

function statusToneFor(status: string | null) {
  if (status === "active") return "success" as const;
  if (status === "suspended" || status === "cancelled") return "danger" as const;
  if (status === "past_due") return "warning" as const;
  return "accent" as const;
}

function statusLabelFor(status: string | null, t: (key: string) => string) {
  if (!status) return t("admin.noSubscription");
  const map: Record<string, string> = {
    active: t("status.subscription.active"),
    trialing: t("status.subscription.trialing"),
    past_due: t("status.subscription.past_due"),
    suspended: t("admin.suspended"),
    cancelled: t("status.subscription.canceled"),
    canceled: t("status.subscription.canceled"),
  };
  return map[status] ?? status;
}

export default async function AdminWorkspacesPage() {
  const { t } = await getTranslator();
  const admin = await requirePlatformPermission("workspaces.read");

  let loadError: string | null = null;
  let workspaces: Awaited<ReturnType<typeof listWorkspacesForAdmin>> = [];
  try {
    workspaces = await listWorkspacesForAdmin(admin.supabase);
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("admin.workspacesLoadFailed");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Workspace-uri</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.workspacesHint")}
        </p>
      </div>

      {loadError ? <AdminErrorState message={loadError} /> : null}

      {!loadError && workspaces.length === 0 ? (
        <AdminEmptyState
          icon={Building2}
          title="Niciun workspace"
          description={t("admin.noWorkspacesYet")}
        />
      ) : null}

      {!loadError && workspaces.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <AdminTable
            rows={workspaces}
            columns={[
              {
                key: "workspace",
                header: "Workspace",
                cell: (workspace) => (
                  <div>
                    <Link
                      href={`/admin/workspaces/${workspace.id}`}
                      className="text-foreground hover:text-champagne-soft"
                    >
                      {workspace.name}
                    </Link>
                    <p className="text-xs text-muted-soft">{workspace.slug}</p>
                  </div>
                ),
              },
              {
                key: "members",
                header: "Utilizatori",
                cell: (workspace) => (
                  <span className="text-muted-foreground">{workspace.memberCount}</span>
                ),
              },
              {
                key: "mrr",
                header: "MRR",
                cell: (workspace) => (
                  <span className="text-muted-foreground">
                    {workspace.mrr === 0 ? "—" : formatCurrency(workspace.mrr)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (workspace) => (
                  <AdminStatusBadge
                    label={statusLabelFor(workspace.subscriptionStatus, t)}
                    tone={statusToneFor(workspace.subscriptionStatus)}
                  />
                ),
              },
              {
                key: "created",
                header: "Creat la",
                cell: (workspace) => (
                  <span className="text-muted-soft">{formatDate(workspace.createdAt)}</span>
                ),
              },
              {
                key: "actions",
                header: t("common.actions"),
                cell: (workspace) => (
                  <WorkspaceActions
                    workspaceId={workspace.id}
                    plan={workspace.plan}
                    isSuspended={workspace.subscriptionStatus === "suspended"}
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
