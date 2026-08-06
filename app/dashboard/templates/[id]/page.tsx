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

type TemplatePageParams = { id: string };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Template · EasyWedd Pro" };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<TemplatePageParams>;
}) {
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
          title="Nu ai permisiunea necesară"
          description="Contactează un administrator al workspace-ului pentru acces la editarea template-urilor."
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
    <ModuleShell title={template.name} description="Editează template-ul și previzualizează conținutul.">
      <TemplateForm mode="edit" initial={template} />
    </ModuleShell>
  );
}
