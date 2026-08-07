import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { TemplateForm } from "@/components/templates/template-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { Button } from "@/components/ui/button";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";
import { getTranslator } from "@/lib/i18n/t";

export const metadata: Metadata = {
  title: "Template nou · EasyWedd Pro",
};

export default async function NewTemplatePage() {
  const { t } = await getTranslator();
  const ctx = await getWorkspaceOrDemo();
  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canWriteTemplates) {
    return (
      <ModuleShell title={t("modules.templates.new")} description={t("modules.templates.description")}>
        <EmptyState
          icon={Lock}
          title={t("modules.permissionDenied")}
          description={t("modules.permissionDeniedHint")}
          action={
            <Button
              type="button"
              variant="outline"
              render={<Link href="/dashboard/templates" />}
              nativeButton={false}
            >
              {t("modules.backToList")}
            </Button>
          }
        />
      </ModuleShell>
    );
  }

  return (
    <ModuleShell title={t("modules.templates.new")} description={t("modules.templates.description")}>
      <TemplateForm mode="create" />
    </ModuleShell>
  );
}
