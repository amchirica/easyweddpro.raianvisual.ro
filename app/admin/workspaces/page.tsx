import { Building2 } from "lucide-react";

import { WorkspaceActions } from "@/components/admin/workspace-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { listWorkspacesForAdmin } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/format";
import { requirePlatformAdmin } from "@/lib/workspace/session";

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  solo: "Solo",
  studio: "Studio",
  agency: "Agency",
};

function statusToneFor(status: string | null) {
  if (status === "active") return "success" as const;
  if (status === "suspended" || status === "cancelled") return "danger" as const;
  if (status === "past_due") return "warning" as const;
  return "accent" as const;
}

function statusLabelFor(status: string | null) {
  if (!status) return "Fără abonament";
  const map: Record<string, string> = {
    active: "Activ",
    trialing: "Trial",
    past_due: "Restanță",
    suspended: "Suspendat",
    cancelled: "Anulat",
  };
  return map[status] ?? status;
}

export default async function AdminWorkspacesPage() {
  const admin = await requirePlatformAdmin();
  const workspaces = await listWorkspacesForAdmin(admin.supabase);

  return (
    <div>
      <PageHeader
        title="Workspace-uri"
        description="Toate studiourile și agențiile înregistrate pe platformă."
      />

      {workspaces.length === 0 ? (
        <EmptyState icon={Building2} title="Niciun workspace" description="Nu există încă workspace-uri înregistrate." />
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Workspace</th>
                <th className="px-5 py-3 font-medium">Utilizatori</th>
                <th className="px-5 py-3 font-medium">MRR</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Creat la</th>
                <th className="px-5 py-3 font-medium">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((workspace) => (
                <tr key={workspace.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="text-foreground">{workspace.name}</p>
                    <p className="text-xs text-muted-soft">{workspace.slug}</p>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{workspace.memberCount}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {workspace.mrr === 0 ? "—" : formatCurrency(workspace.mrr)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      label={statusLabelFor(workspace.subscriptionStatus)}
                      tone={statusToneFor(workspace.subscriptionStatus)}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-muted-soft">{formatDate(workspace.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <WorkspaceActions
                      workspaceId={workspace.id}
                      plan={workspace.plan}
                      isSuspended={workspace.subscriptionStatus === "suspended"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-xs text-muted-soft">
        Planul afișat este cel din tabelul workspace-uri; MRR se calculează doar pentru abonamente cu status
        &quot;activ&quot;. {PLAN_LABEL.free} nu contribuie la MRR.
      </p>
    </div>
  );
}
