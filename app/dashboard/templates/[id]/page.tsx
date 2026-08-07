import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { TemplateForm } from "@/components/templates/template-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { Button } from "@/components/ui/button";
import { getTemplateById } from "@/lib/data/templates";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";
import { getTranslator } from "@/lib/i18n/t";

type TemplatePageParams = { id: string };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Template · EasyWedd Pro" };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<TemplatePageParams>;
}) {
  const { t } = await getTranslator();
  const { id } = await params;
  const ctx = await getWorkspaceOrDemo();

  const template = await getTemplateById(ctx.supabase, ctx.workspace.id, id).catch(() => null);
  if (!template) notFound();

  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canWriteTemplates) {
    return (
      <ModuleShell title={template.name} description="Detalii template.">
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
    <ModuleShell title={template.name} description={t("modules.templates.description")}>
      <TemplateForm mode="edit" initial={template} />
    </ModuleShell>
  );
}
