import Link from "next/link";
import { getTranslator } from "@/lib/i18n/t";
import { Users } from "lucide-react";

import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminFilters } from "@/components/admin/admin-filters";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminTable } from "@/components/admin/admin-table";
import { listUsersForAdmin } from "@/lib/data/admin";
import { formatDate } from "@/lib/format";
import { requirePlatformPermission } from "@/lib/platform/session";

const STATUS_TONE: Record<string, "success" | "accent" | "danger" | "muted"> = {
  active: "success",
  invited: "accent",
  suspended: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Activ",
  invited: "Invitat",
  suspended: "Suspendat",
};

type SearchParams = Promise<{ q?: string; status?: string }>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { t } = await getTranslator();
  const admin = await requirePlatformPermission("users.read");
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const status = (params.status ?? "").trim();

  let loadError: string | null = null;
  let users: Awaited<ReturnType<typeof listUsersForAdmin>> = [];
  try {
    users = await listUsersForAdmin(admin.supabase);
  } catch (error) {
    loadError = error instanceof Error ? error.message : t("admin.usersLoadFailed");
  }

  const filtered = users.filter((user) => {
    if (status && user.accountStatus !== status) return false;
    if (!q) return true;
    const haystack = `${user.fullName ?? ""} ${user.email ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Utilizatori</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("admin.usersHint")}
        </p>
      </div>

      <AdminFilters
        fields={[
          {
            name: "q",
            label: t("admin.search"),
            type: "search",
            defaultValue: params.q ?? "",
            placeholder: "Nume sau email…",
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            defaultValue: status,
            options: [
              { value: "", label: "Toate" },
              { value: "active", label: "Activ" },
              { value: "invited", label: "Invitat" },
              { value: "suspended", label: "Suspendat" },
            ],
          },
        ]}
      />

      {loadError ? <AdminErrorState message={loadError} /> : null}

      {!loadError && filtered.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="Niciun utilizator"
          description={
            q || status
              ? "Niciun rezultat pentru filtrele selectate."
              : t("admin.noUsersYet")
          }
        />
      ) : null}

      {!loadError && filtered.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <AdminTable
            rows={filtered}
            columns={[
              {
                key: "user",
                header: "Utilizator",
                cell: (user) => (
                  <div>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-foreground hover:text-champagne-soft"
                    >
                      {user.fullName ?? t("admin.noName")}
                    </Link>
                    <p className="text-xs text-muted-soft">{user.email ?? "email indisponibil"}</p>
                    {user.isPlatformAdmin ? (
                      <span className="mt-1 inline-block">
                        <AdminStatusBadge label={t("admin.platformAdmin")} tone="accent" />
                      </span>
                    ) : null}
                  </div>
                ),
              },
              {
                key: "workspaces",
                header: "Workspace-uri",
                cell: (user) =>
                  user.memberships.length === 0 ? (
                    <span className="text-muted-soft">{t("admin.noWorkspace")}</span>
                  ) : (
                    <span className="text-muted-foreground">{user.memberships.length}</span>
                  ),
              },
              {
                key: "status",
                header: "Status",
                cell: (user) => (
                  <AdminStatusBadge
                    label={STATUS_LABEL[user.accountStatus] ?? user.accountStatus}
                    tone={STATUS_TONE[user.accountStatus] ?? "muted"}
                  />
                ),
              },
              {
                key: "updated",
                header: "Actualizat",
                cell: (user) => (
                  <span className="text-muted-soft">{formatDate(user.updatedAt)}</span>
                ),
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
