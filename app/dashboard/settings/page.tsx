import type { Metadata } from "next";
import { getTranslator } from "@/lib/i18n/t";

import {
  SettingsPageClient,
  type TransferTargetOption,
  type WorkspaceFormValues,
} from "@/components/settings/settings-page-client";
import { listMembers } from "@/lib/data/team";
import type { WorkspaceRole } from "@/lib/constants";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace, type WorkspaceSettings } from "@/lib/workspace/session";

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: `${t("modules.settings.title")} · EasyWedd Pro` };
}

type WorkspaceNotifications = {
  emailNotifications: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
};

function readNotifications(settings: WorkspaceSettings | null): WorkspaceNotifications {
  const raw = (settings?.notifications as Partial<WorkspaceNotifications> | undefined) ?? {};
  return {
    emailNotifications: raw.emailNotifications ?? true,
    weeklyDigest: raw.weeklyDigest ?? true,
    productUpdates: raw.productUpdates ?? false,
  };
}

export default async function SettingsPage() {
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);
  const isOwner = ctx.role === "owner";

  const workspace = ctx.activeWorkspace;
  const settings = (workspace.settings as WorkspaceSettings | null) ?? null;
  const fiscalData = (workspace.fiscal_data as { cui?: string | null; address?: string | null } | null) ?? null;

  const initialWorkspace: WorkspaceFormValues = {
    name: workspace.name,
    city: workspace.city ?? "",
    country: workspace.country ?? "",
    currency: workspace.currency,
    timezone: workspace.timezone,
    language: (settings?.language as "ro" | "en" | undefined) ?? "ro",
    brandPrimary: workspace.brand_primary ?? "",
    brandAccent: workspace.brand_accent ?? "",
    fiscalCui: fiscalData?.cui ?? "",
    fiscalAddress: fiscalData?.address ?? "",
    defaultProjectPipeline: (settings?.default_project_pipeline as string | undefined) ?? "generic",
    notifications: readNotifications(settings),
  };

  let transferTargets: TransferTargetOption[] = [];
  if (isOwner) {
    try {
      const members = await listMembers(ctx.supabase, workspace.id);
      transferTargets = members
        .filter((member) => member.userId !== ctx.user.id && !member.disabledAt)
        .map((member) => ({
          membershipId: member.membershipId,
          userId: member.userId,
          fullName: member.fullName,
          role: member.role as WorkspaceRole,
        }));
    } catch {
      transferTargets = [];
    }
  }

  return (
    <SettingsPageClient
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      logoUrl={workspace.logo_url}
      initialWorkspace={initialWorkspace}
      initialFullName={ctx.profile?.full_name ?? ""}
      email={ctx.user.email ?? ""}
      canManageWorkspace={permissions.canManageWorkspace}
      isOwner={isOwner}
      transferTargets={transferTargets}
    />
  );
}
