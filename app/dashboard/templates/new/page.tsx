import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { TemplateForm } from "@/components/templates/template-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { Button } from "@/components/ui/button";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Template nou · EasyWedd Pro",
};

export default async function NewTemplatePage() {
  const ctx = await getWorkspaceOrDemo();
  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canWriteTemplates) {
    return (
      <ModuleShell title="Template nou" description="Creează un template reutilizabil pentru workspace.">
        <EmptyState
          icon={Lock}
          title="Nu ai permisiunea necesară"
          description="Contactează un administrator al workspace-ului pentru acces la crearea template-urilor."
          action={
            <Button
              type="button"
              variant="outline"
              render={<Link href="/dashboard/templates" />}
              nativeButton={false}
            >
              Înapoi la template-uri
            </Button>
          }
        />
      </ModuleShell>
    );
  }

  return (
    <ModuleShell title="Template nou" description="Creează un template reutilizabil pentru workspace.">
      <TemplateForm mode="create" />
    </ModuleShell>
  );
}
