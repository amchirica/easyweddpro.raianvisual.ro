import Link from "next/link";
import { Shield } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTable } from "@/components/admin/admin-table";
import { AdminRoleActions } from "@/components/admin/admin-role-actions";
import { formatDateTime } from "@/lib/format";
import { canPerformPlatformAction } from "@/lib/platform/permissions";
import { PLATFORM_ROLE_LABELS, isPlatformRole } from "@/lib/platform/roles";
import { requirePlatformPermission } from "@/lib/platform/session";

export default async function AdminAdminsPage() {
  const admin = await requirePlatformPermission("admins.read");
  const canWrite = canPerformPlatformAction(admin.platformRole, "admins.write");

  const { data, error } = await admin.supabase
    .from("platform_admins")
    .select("user_id, role, disabled_at, notes, created_at, updated_at")
    .order("created_at", { ascending: true });

  const userIds = (data ?? []).map((row) => row.user_id);
  const { data: profiles } = userIds.length
    ? await admin.supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const rows = (data ?? []).map((row) => ({
    id: row.user_id,
    role: row.role,
    disabledAt: row.disabled_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    fullName: profileById.get(row.user_id)?.full_name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Administratori</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Roluri din `platform_admins`. Doar super-admin poate modifica rolurile.
        </p>
      </div>

      {error ? <AdminErrorState message={error.message} /> : null}

      {!error && rows.length === 0 ? (
        <AdminEmptyState
          icon={Shield}
          title="Niciun admin"
          description="Nu există înregistrări în platform_admins."
        />
      ) : null}

      {!error && rows.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <AdminTable
            rows={rows}
            columns={[
              {
                key: "user",
                header: "Utilizator",
                cell: (row) => (
                  <div>
                    <Link
                      href={`/admin/users/${row.id}`}
                      className="text-foreground hover:text-champagne-soft"
                    >
                      {row.fullName ?? row.id.slice(0, 8)}
                    </Link>
                    <p className="text-xs text-muted-soft">{row.id}</p>
                  </div>
                ),
              },
              {
                key: "role",
                header: "Rol",
                cell: (row) => (
                  <AdminStatusBadge
                    label={
                      isPlatformRole(row.role)
                        ? PLATFORM_ROLE_LABELS[row.role]
                        : row.role
                    }
                    tone="accent"
                  />
                ),
              },
              {
                key: "status",
                header: "Status",
                cell: (row) => (
                  <AdminStatusBadge
                    label={row.disabledAt ? "Dezactivat" : "Activ"}
                    tone={row.disabledAt ? "danger" : "success"}
                  />
                ),
              },
              {
                key: "updated",
                header: "Actualizat",
                cell: (row) => (
                  <span className="text-muted-soft">{formatDateTime(row.updatedAt)}</span>
                ),
              },
              {
                key: "actions",
                header: "Acțiuni",
                cell: (row) => (
                  <AdminRoleActions
                    userId={row.id}
                    currentRole={row.role}
                    canWrite={canWrite}
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
