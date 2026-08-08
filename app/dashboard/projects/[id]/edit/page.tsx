import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectForm, type ProjectFormInitialData } from "@/components/projects/project-form";
import { ModuleShell } from "@/components/shared/module-shell";
import { listClients } from "@/lib/data/clients";
import { getProjectById, type ProjectDetail as ProjectDetailRow } from "@/lib/data/projects";
import { type ProjectStatus } from "@/lib/constants";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";
import { getTranslator } from "@/lib/i18n/t";

type ProjectEditPageParams = { id: string };

function mapProjectRowToInitial(row: ProjectDetailRow): ProjectFormInitialData {
  return {
    name: row.name,
    clientId: row.client_id,
    eventDate: row.event_date,
    status: row.status as ProjectStatus,
    pipelineKey: row.pipeline_key,
    deadline: row.deadline,
    progress: Number(row.progress ?? 0),
    team: row.team ?? [],
    location: row.location,
    notes: row.notes,
    budget: Number(row.budget ?? 0),
    cost: Number(row.cost ?? 0),
    estimatedRevenue: Number(row.estimated_revenue ?? 0),
    currency: row.currency || "RON",
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: `${t("modules.projects.editTitle")} · EasyWedd Pro`,
  };
}

export default async function ProjectEditPage({
  params,
}: {
  params: Promise<ProjectEditPageParams>;
}) {
  const { t } = await getTranslator();
  const { id } = await params;
  const projectId = typeof id === "string" ? id.trim() : "";

  if (!projectId) {
    notFound();
  }

  const ctx = await getWorkspaceOrDemo();

  let row: ProjectDetailRow | null = null;
  try {
    row = await getProjectById(ctx.supabase, ctx.workspace.id, projectId);
  } catch {
    notFound();
  }

  if (!row) notFound();

  const permissions = permissionsForRole(ctx.role);
  const clientRows = await listClients(ctx.supabase, ctx.workspace.id, { limit: 200 });
  const clients = clientRows.map((client) => ({ id: client.id, name: client.name }));

  return (
    <ModuleShell
      title={t("modules.projects.editTitle", { name: row.name })}
      description={row.clientName ?? t("modules.projects.title")}
    >
      <ProjectForm
        mode="edit"
        projectId={row.id}
        initial={mapProjectRowToInitial(row)}
        clients={clients}
        currency={row.currency || ctx.workspace.currency}
        canWrite={permissions.canWriteProjects}
      />
    </ModuleShell>
  );
}
