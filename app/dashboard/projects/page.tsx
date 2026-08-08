import type { Metadata } from "next";
import { getTranslator } from "@/lib/i18n/t";

import { ProjectsList, type ProjectListItem } from "@/components/projects/projects-list";
import { listProjects, type ProjectListItem as ProjectListRow } from "@/lib/data/projects";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: `${t("modules.projects.title")} · EasyWedd Pro` };
}

function mapProjectRow(row: ProjectListRow): ProjectListItem {
  return {
    id: row.id,
    name: row.name,
    clientName: row.clientName,
    eventDate: row.event_date,
    status: row.status as ProjectListItem["status"],
    pipelineKey: row.pipeline_key,
    budget: Number(row.budget ?? 0),
    estimatedRevenue: Number(row.estimated_revenue ?? 0),
    currency: row.currency || "RON",
    progress: Number(row.progress ?? 0),
    archivedAt: row.archived_at,
  };
}

export default async function ProjectsPage() {
  const { t } = await getTranslator();
  const ctx = await getWorkspaceOrDemo();
  const permissions = permissionsForRole(ctx.role);

  let projects: ProjectListItem[] = [];
  let error: string | null = null;

  try {
    const rows = await listProjects(ctx.supabase, { workspaceId: ctx.workspace.id, limit: 100 });
    projects = rows.map(mapProjectRow);
  } catch (err) {
    error = err instanceof Error ? err.message : t("modules.projects.loadFailed");
  }

  return (
    <ProjectsList
      initialProjects={projects}
      mode="live"
      canWrite={permissions.canWriteProjects}
      error={error}
    />
  );
}
