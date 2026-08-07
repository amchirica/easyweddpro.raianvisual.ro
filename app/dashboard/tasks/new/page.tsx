import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { NewTaskDialogPage } from "@/components/tasks/new-task-dialog-page";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { Button } from "@/components/ui/button";
import { listClients } from "@/lib/data/clients";
import { listWorkspaceMemberOptions } from "@/lib/data/tasks";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";
import { getTranslator } from "@/lib/i18n/t";

export const metadata: Metadata = {
  title: "Task nou · EasyWedd Pro",
};

export default async function NewTaskPage() {
  const { t } = await getTranslator();
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canWriteTasks) {
    return (
      <ModuleShell title={t("modules.tasks.new")} description={t("modules.tasks.description")}>
        <EmptyState
          icon={Lock}
          title={t("modules.permissionDenied")}
          description={t("modules.permissionDeniedHint")}
          action={
            <Button type="button" variant="outline" render={<Link href="/dashboard/tasks" />} nativeButton={false}>
              {t("modules.backToList")}
            </Button>
          }
        />
      </ModuleShell>
    );
  }

  const [members, clientRows, projectRows] = await Promise.all([
    listWorkspaceMemberOptions(ctx.supabase, ctx.activeWorkspace.id),
    listClients(ctx.supabase, ctx.activeWorkspace.id, { limit: 200 }),
    ctx.supabase
      .from("projects")
      .select("id, name")
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(200),
  ]);

  const clients = clientRows.map((client) => ({ id: client.id, name: client.name }));
  const projects = (projectRows.data ?? []).map((project) => ({ id: project.id, name: project.name }));

  return (
    <ModuleShell title={t("modules.tasks.new")} description={t("modules.tasks.description")}>
      <NewTaskDialogPage
        members={members}
        clients={clients}
        projects={projects}
        currentUserId={ctx.user.id}
        isAssigneeOnly={permissions.isAssigneeOnly}
      />
    </ModuleShell>
  );
}
