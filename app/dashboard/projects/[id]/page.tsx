import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectDetail, type ProjectDetailData } from "@/components/projects/project-detail";
import { ModuleShell } from "@/components/shared/module-shell";
import { getProjectById, type ProjectDetail as ProjectDetailRow } from "@/lib/data/projects";
import { type ProjectStatus } from "@/lib/constants";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

type ProjectPageParams = { id: string };

function mapProjectRowToDetail(row: ProjectDetailRow): ProjectDetailData {
  return {
    id: row.id,
    name: row.name,
    status: row.status as ProjectStatus,
    pipelineKey: row.pipeline_key,
    eventDate: row.event_date,
    deadline: row.deadline,
    progress: Number(row.progress ?? 0),
    team: row.team ?? [],
    location: row.location,
    notes: row.notes,
    budget: Number(row.budget ?? 0),
    cost: Number(row.cost ?? 0),
    estimatedRevenue: Number(row.estimated_revenue ?? 0),
    currency: row.currency || "RON",
    clientId: row.client_id,
    clientName: row.clientName,
    clientEmail: row.clientEmail,
    clientPhone: row.clientPhone,
    contractId: row.contract_id,
    contractNumber: row.contractNumber,
    contractTitle: row.contractTitle,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Proiect · EasyWedd Pro",
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<ProjectPageParams>;
}) {
  const { id } = await params;
  const projectId = typeof id === "string" ? id.trim() : "";

  if (!projectId) {
    notFound();
  }

  const ctx = await getWorkspaceOrDemo();

  let row: ProjectDetailRow | null = null;
  try {
    row = await getProjectById(ctx.supabase, ctx.workspace.id, projectId);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[projects.detail]", {
        projectId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    notFound();
  }

  if (!row) notFound();

  const permissions = permissionsForRole(ctx.role);
  const project = mapProjectRowToDetail(row);

  return (
    <ModuleShell title={project.name} description={project.clientName ?? "Proiect"}>
      <ProjectDetail
        project={project}
        mode="live"
        canWrite={permissions.canWriteProjects}
        canDelete={permissions.canDeleteProjects}
      />
    </ModuleShell>
  );
}
