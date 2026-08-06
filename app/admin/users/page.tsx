import { Users } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { listUsersForAdmin } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { requirePlatformAdmin } from "@/lib/workspace/session";

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietar",
  admin: "Admin",
  manager: "Manager",
  collaborator: "Colaborator",
};

const STATUS_TONE: Record<string, "success" | "accent" | "danger"> = {
  active: "success",
  invited: "accent",
  suspended: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Activ",
  invited: "Invitat",
  suspended: "Suspendat",
};

export default async function AdminUsersPage() {
  const admin = await requirePlatformAdmin();
  const users = await listUsersForAdmin(admin.supabase);

  return (
    <div>
      <PageHeader
        title="Utilizatori"
        description="Toți utilizatorii înregistrați la nivelul platformei."
      />

      {users.length === 0 ? (
        <EmptyState icon={Users} title="Niciun utilizator" description="Nu există încă utilizatori înregistrați." />
      ) : (
        <div className="surface-card overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Utilizator</th>
                <th className="px-5 py-3 font-medium">Workspace-uri</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actualizat</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="text-foreground">{user.fullName ?? "Fără nume"}</p>
                    <p className="text-xs text-muted-soft">{user.email ?? "email indisponibil"}</p>
                    {user.isPlatformAdmin ? (
                      <StatusBadge label="Admin platformă" tone="accent" className="mt-1" />
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {user.memberships.length === 0 ? (
                      <span className="text-muted-soft">Fără workspace</span>
                    ) : (
                      <div className="space-y-1">
                        {user.memberships.map((membership) => (
                          <div key={membership.workspaceId} className="text-xs">
                            {membership.workspaceName}{" "}
                            <span className="text-muted-soft">({ROLE_LABEL[membership.role] ?? membership.role})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      label={STATUS_LABEL[user.accountStatus] ?? user.accountStatus}
                      tone={STATUS_TONE[user.accountStatus] ?? "accent"}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-muted-soft">{formatDate(user.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
