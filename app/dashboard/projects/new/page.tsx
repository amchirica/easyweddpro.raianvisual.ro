import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { ProjectForm } from "@/components/projects/project-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { Button } from "@/components/ui/button";
import { listClients } from "@/lib/data/clients";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";
import { getTranslator } from "@/lib/i18n/t";

export const metadata: Metadata = {
  title: "Proiect nou · EasyWedd Pro",
};

type NewProjectPageProps = {
  searchParams: Promise<{ clientId?: string }>;
};

export default async function NewProjectPage({ searchParams }: NewProjectPageProps) {
  const { t } = await getTranslator();
  const { clientId } = await searchParams;
  const ctx = await getWorkspaceOrDemo();
  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canWriteProjects) {
    return (
      <ModuleShell title={t("modules.projects.new")} description={t("modules.projects.description")}>
        <EmptyState
          icon={Lock}
          title={t("modules.permissionDenied")}
          description={t("modules.permissionDeniedHint")}
          action={
            <Button type="button" variant="outline" render={<Link href="/dashboard/projects" />} nativeButton={false}>
              {t("modules.backToList")}
            </Button>
          }
        />
      </ModuleShell>
    );
  }

  const clientRows = await listClients(ctx.supabase, ctx.workspace.id, { limit: 200 });
  const clients = clientRows.map((client) => ({ id: client.id, name: client.name }));

  return (
    <ModuleShell title={t("modules.projects.new")} description={t("modules.projects.description")}>
      <ProjectForm
        mode="create"
        clients={clients}
        defaultClientId={clientId ?? null}
        currency={ctx.workspace.currency}
        canWrite={permissions.canWriteProjects}
      />
    </ModuleShell>
  );
}
