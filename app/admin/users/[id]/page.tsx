import Link from "next/link";
import { getTranslator } from "@/lib/i18n/t";
import { notFound } from "next/navigation";

import { AdminDetailGrid, AdminDetailPanel } from "@/components/admin/admin-detail-panel";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { UserActions } from "@/components/admin/user-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatDateTime } from "@/lib/format";
import { canPerformPlatformAction } from "@/lib/platform/permissions";
import { requirePlatformPermission } from "@/lib/platform/session";

const STATUS_LABEL: Record<string, string> = {
  active: "Activ",
  invited: "Invitat",
  suspended: "Suspendat",
};

const STATUS_TONE: Record<string, "success" | "accent" | "danger" | "muted"> = {
  active: "success",
  invited: "accent",
  suspended: "danger",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietar",
  admin: "Admin",
  manager: "Manager",
  collaborator: "Colaborator",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = await getTranslator();
  const { id } = await params;
  const admin = await requirePlatformPermission("users.read");
  const canWrite = canPerformPlatformAction(admin.platformRole, "users.write");

  const { data: profile, error } = await admin.supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-medium text-foreground">Utilizator</h1>
        <AdminErrorState message={error.message} />
      </div>
    );
  }
  if (!profile) notFound();

  const { data: members } = await admin.supabase
    .from("workspace_members")
    .select("workspace_id, role, created_at")
    .eq("user_id", id);

  const workspaceIds = [...new Set((members ?? []).map((m) => m.workspace_id))];
  const { data: workspaces } = workspaceIds.length
    ? await admin.supabase.from("workspaces").select("id, name, slug").in("id", workspaceIds)
    : { data: [] as Array<{ id: string; name: string; slug: string }> };
  const workspaceById = new Map((workspaces ?? []).map((w) => [w.id, w]));

  let email: string | null = null;
  try {
    const service = createAdminClient();
    const { data } = await service.auth.admin.getUserById(id);
    email = data.user?.email ?? null;
  } catch {
    email = null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/users" className="text-xs text-muted-soft hover:text-foreground">
            {t("admin.backToUsers")}
          </Link>
          <h1 className="mt-2 font-heading text-3xl font-medium text-foreground">
            {profile.full_name ?? t("admin.noName")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{email ?? "email indisponibil"}</p>
        </div>
        {canWrite ? (
          <UserActions userId={profile.id} accountStatus={profile.account_status} />
        ) : null}
      </div>

      <AdminDetailPanel title={t("admin.profile")} description={t("admin.profileDesc")}>
        <AdminDetailGrid
          items={[
            { label: "ID", value: profile.id },
            { label: "Email", value: email ?? "—" },
            { label: "Nume", value: profile.full_name ?? "—" },
            {
              label: "Status cont",
              value: (
                <AdminStatusBadge
                  label={STATUS_LABEL[profile.account_status] ?? profile.account_status}
                  tone={STATUS_TONE[profile.account_status] ?? "muted"}
                />
              ),
            },
            {
              label: t("admin.platformAdmin"),
              value: profile.is_platform_admin ? "Da" : "Nu",
            },
            {
              label: "Onboarding",
              value: profile.onboarding_completed ? "Completat" : "Incomplet",
            },
            {
              label: "Suspendat la",
              value: profile.suspended_at ? formatDateTime(profile.suspended_at) : "—",
            },
            { label: "Creat la", value: formatDateTime(profile.created_at) },
            { label: "Actualizat la", value: formatDateTime(profile.updated_at) },
          ]}
        />
      </AdminDetailPanel>

      <AdminDetailPanel
        title="Memberships"
        description={t("admin.memberWorkspaces")}
      >
        {(members ?? []).length === 0 ? (
          <p className="text-sm text-muted-soft">Niciun membership.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(members ?? []).map((member) => {
              const ws = workspaceById.get(member.workspace_id);
              return (
                <li
                  key={`${member.workspace_id}-${member.role}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    {ws ? (
                      <Link
                        href={`/admin/workspaces/${ws.id}`}
                        className="text-foreground hover:text-champagne-soft"
                      >
                        {ws.name}
                      </Link>
                    ) : (
                      <span className="text-foreground">{member.workspace_id}</span>
                    )}
                    <p className="text-xs text-muted-soft">
                      {ROLE_LABEL[member.role] ?? member.role}
                      {ws?.slug ? ` · ${ws.slug}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-soft">{formatDate(member.created_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </AdminDetailPanel>
    </div>
  );
}
