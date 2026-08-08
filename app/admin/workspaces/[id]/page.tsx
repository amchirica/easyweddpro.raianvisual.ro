import Link from "next/link";
import { getTranslator } from "@/lib/i18n/t";
import { notFound } from "next/navigation";
import { FileText, FolderKanban, Handshake, Users, UserSquare2 } from "lucide-react";

import { AdminDetailGrid, AdminDetailPanel } from "@/components/admin/admin-detail-panel";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { WorkspaceAdminActions } from "@/components/admin/workspace-admin-actions";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { PLAN_CATALOG } from "@/lib/billing/plan-catalog";
import { canPerformPlatformAction } from "@/lib/platform/permissions";
import { requirePlatformPermission } from "@/lib/platform/session";

const ROLE_LABEL: Record<string, string> = {
  owner: "Proprietar",
  admin: "Admin",
  manager: "Manager",
  collaborator: "Colaborator",
};

function statusTone(status: string | null) {
  if (status === "active") return "success" as const;
  if (status === "suspended" || status === "cancelled") return "danger" as const;
  if (status === "past_due") return "warning" as const;
  return "accent" as const;
}

function statusLabel(status: string | null, t: (key: string) => string) {
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

export default async function AdminWorkspaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = await getTranslator();
  const { id } = await params;
  const admin = await requirePlatformPermission("workspaces.read");
  const canManage =
    canPerformPlatformAction(admin.platformRole, "subscriptions.write") ||
    canPerformPlatformAction(admin.platformRole, "workspaces.inspect") ||
    canPerformPlatformAction(admin.platformRole, "workspaces.write");

  const { data: workspace, error } = await admin.supabase
    .from("workspaces")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-medium text-foreground">Workspace</h1>
        <AdminErrorState message={error.message} />
      </div>
    );
  }
  if (!workspace) notFound();

  const [
    leadsCount,
    clientsCount,
    proposalsCount,
    contractsCount,
    projectsCount,
    { data: subscription },
    { data: members },
  ] = await Promise.all([
    admin.supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id)
      .is("deleted_at", null),
    admin.supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id)
      .is("deleted_at", null),
    admin.supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id)
      .is("deleted_at", null),
    admin.supabase
      .from("contracts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id)
      .is("deleted_at", null),
    admin.supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", id)
      .is("deleted_at", null),
    admin.supabase.from("subscriptions").select("*").eq("workspace_id", id).maybeSingle(),
    admin.supabase
      .from("workspace_members")
      .select("user_id, role, created_at")
      .eq("workspace_id", id),
  ]);

  const memberIds = (members ?? []).map((m) => m.user_id);
  const { data: profiles } = memberIds.length
    ? await admin.supabase.from("profiles").select("id, full_name, account_status").in("id", memberIds)
    : { data: [] as Array<{ id: string; full_name: string | null; account_status: string }> };
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const planLabel =
    PLAN_CATALOG.find((p) => p.id === (subscription?.plan ?? workspace.plan))?.name ??
    subscription?.plan ??
    workspace.plan;
  const mrr =
    subscription?.status === "active"
      ? PLAN_CATALOG.find((p) => p.id === subscription.plan)?.priceMonthlyRon ?? 0
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/workspaces" className="text-xs text-muted-soft hover:text-foreground">
          {t("admin.backToWorkspaces")}
        </Link>
        <h1 className="mt-2 font-heading text-3xl font-medium text-foreground">{workspace.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{workspace.slug}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <AdminMetricCard icon={UserSquare2} label="Leaduri" value={leadsCount.count ?? 0} />
        <AdminMetricCard icon={Users} label={t("common.clients")} value={clientsCount.count ?? 0} />
        <AdminMetricCard icon={FileText} label={t("nav.proposals")} value={proposalsCount.count ?? 0} />
        <AdminMetricCard icon={Handshake} label={t("nav.contracts")} value={contractsCount.count ?? 0} />
        <AdminMetricCard icon={FolderKanban} label="Proiecte" value={projectsCount.count ?? 0} />
      </section>

      <AdminDetailPanel title="Detalii workspace">
        <AdminDetailGrid
          items={[
            { label: "ID", value: workspace.id },
            { label: "Plan workspace", value: planLabel },
            { label: t("common.city"), value: workspace.city ?? "—" },
            { label: t("admin.country"), value: workspace.country ?? "—" },
            { label: t("common.currency"), value: workspace.currency },
            { label: "Fus orar", value: workspace.timezone },
            { label: "Creat la", value: formatDateTime(workspace.created_at) },
            { label: "Actualizat la", value: formatDateTime(workspace.updated_at) },
          ]}
        />
      </AdminDetailPanel>

      <AdminDetailPanel
        title="Abonament"
        description={t("admin.billingTrialStatus")}
        actions={
          subscription ? (
            <Link
              href={`/admin/subscriptions/${subscription.id}`}
              className="text-xs text-champagne-soft hover:underline"
            >
              Vezi abonamentul
            </Link>
          ) : null
        }
      >
        {subscription ? (
          <AdminDetailGrid
            items={[
              {
                label: "Status",
                value: (
                  <AdminStatusBadge
                    label={statusLabel(subscription.status, t)}
                    tone={statusTone(subscription.status)}
                  />
                ),
              },
              { label: "Plan", value: subscription.plan },
              { label: "MRR", value: mrr === 0 ? "—" : formatCurrency(mrr) },
              {
                label: t("admin.trialUntil"),
                value: subscription.trial_end
                  ? formatDate(subscription.trial_end)
                  : subscription.trial_ends_at
                    ? formatDate(subscription.trial_ends_at)
                    : "—",
              },
              {
                label: t("admin.periodUntil"),
                value: subscription.current_period_end
                  ? formatDate(subscription.current_period_end)
                  : "—",
              },
              {
                label: "Stripe customer",
                value: subscription.stripe_customer_id ?? "—",
              },
            ]}
          />
        ) : (
          <p className="text-sm text-muted-soft">{t("admin.noSubForWorkspace")}</p>
        )}
      </AdminDetailPanel>

      <AdminDetailPanel title="Membri">
        {(members ?? []).length === 0 ? (
          <p className="text-sm text-muted-soft">Niciun membru.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(members ?? []).map((member) => {
              const profile = profileById.get(member.user_id);
              return (
                <li
                  key={member.user_id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                >
                  <div>
                    <Link
                      href={`/admin/users/${member.user_id}`}
                      className="text-foreground hover:text-champagne-soft"
                    >
                      {profile?.full_name ?? member.user_id}
                    </Link>
                    <p className="text-xs text-muted-soft">
                      {ROLE_LABEL[member.role] ?? member.role}
                    </p>
                  </div>
                  <span className="text-xs text-muted-soft">{formatDate(member.created_at)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </AdminDetailPanel>

      {canManage ? (
        <AdminDetailPanel
          title={t("admin.adminActions")}
          description={t("admin.adminActionsDesc")}
        >
          <WorkspaceAdminActions
            workspaceId={workspace.id}
            plan={subscription?.plan ?? workspace.plan}
            isSuspended={subscription?.status === "suspended"}
          />
        </AdminDetailPanel>
      ) : null}
    </div>
  );
}
