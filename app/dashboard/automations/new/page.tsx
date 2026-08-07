import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { AutomationForm } from "@/components/automations/automation-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";
import { getTranslator } from "@/lib/i18n/t";

export const metadata: Metadata = {
  title: "Automatizare nouă · EasyWedd Pro",
};

export default async function NewAutomationPage() {
  const { t } = await getTranslator();
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canManageAutomations) {
    return (
      <ModuleShell title={t("modules.automations.new")} description={t("modules.automations.createDescription")}>
        <EmptyState
          icon={Lock}
          title={t("modules.permissionDenied")}
          description={t("modules.permissionDeniedHint")}
        />
      </ModuleShell>
    );
  }

  return (
    <ModuleShell
      title={t("modules.automations.new")}
      description={t("modules.automations.createDescription")}
    >
      <AutomationForm mode="create" />
    </ModuleShell>
  );
}
