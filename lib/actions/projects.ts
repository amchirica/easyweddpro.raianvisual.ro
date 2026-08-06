"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { archiveRow, restoreSoftDeletedRow, softDeleteRow } from "@/lib/data/soft-delete";
import { DEFAULT_PIPELINE_TEMPLATE_ID } from "@/lib/events/project-pipelines";
import { deriveProjectNameFromContract } from "@/lib/projects/naming";
import { projectFormSchema } from "@/lib/validations/projects";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";
import type { Database } from "@/types/database";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function createProjectAction(
  input: unknown,
): Promise<ActionResult<{ project: ProjectRow }>> {
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("projects.write");
  } catch {
    return actionError("Nu ai permisiunea de a crea proiecte.");
  }
  const data = parsed.data;

  if (data.clientId) {
    const { data: client } = await ctx.supabase
      .from("clients")
      .select("id")
      .eq("id", data.clientId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!client) return actionError("Clientul selectat nu a fost găsit.");
  }

  const { data: project, error } = await ctx.supabase
    .from("projects")
    .insert({
      workspace_id: ctx.activeWorkspace.id,
      client_id: data.clientId ?? null,
      name: data.name.trim(),
      event_date: emptyToNull(data.eventDate),
      status: data.status,
      pipeline_key: data.pipelineKey || DEFAULT_PIPELINE_TEMPLATE_ID,
      deadline: emptyToNull(data.deadline),
      progress: data.progress,
      team: data.team,
      location: emptyToNull(data.location),
      notes: emptyToNull(data.notes),
      budget: data.budget,
      cost: data.cost,
      estimated_revenue: data.estimatedRevenue,
      currency: data.currency,
      created_by: ctx.user.id,
    })
    .select("*")
    .single();

  if (error || !project) {
    if (process.env.NODE_ENV === "development") {
      console.error("[projects.create]", error?.message);
    }
    return actionError("Nu am putut crea proiectul.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "project",
    entityId: project.id,
    action: "project.created",
    title: "Proiect creat",
    description: project.name,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return actionSuccess("Proiect creat.", { project });
}

export async function updateProjectAction(
  projectId: string,
  input: unknown,
): Promise<ActionResult<{ project: ProjectRow }>> {
  const parsed = projectFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("projects.write");
  } catch {
    return actionError("Nu ai permisiunea de a edita proiecte.");
  }
  const data = parsed.data;

  if (data.clientId) {
    const { data: client } = await ctx.supabase
      .from("clients")
      .select("id")
      .eq("id", data.clientId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (!client) return actionError("Clientul selectat nu a fost găsit.");
  }

  const { data: project, error } = await ctx.supabase
    .from("projects")
    .update({
      client_id: data.clientId ?? null,
      name: data.name.trim(),
      event_date: emptyToNull(data.eventDate),
      status: data.status,
      pipeline_key: data.pipelineKey || DEFAULT_PIPELINE_TEMPLATE_ID,
      deadline: emptyToNull(data.deadline),
      progress: data.progress,
      team: data.team,
      location: emptyToNull(data.location),
      notes: emptyToNull(data.notes),
      budget: data.budget,
      cost: data.cost,
      estimated_revenue: data.estimatedRevenue,
      currency: data.currency,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut actualiza proiectul.");
  if (!project) return actionError("Proiectul nu a fost găsit.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "project",
    entityId: project.id,
    action: "project.updated",
    title: "Proiect actualizat",
    description: project.name,
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return actionSuccess("Proiect actualizat.", { project });
}

export async function archiveProjectAction(projectId: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("projects.write");
  } catch {
    return actionError("Nu ai permisiunea de a arhiva proiecte.");
  }

  const { data: existing } = await ctx.supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return actionError("Proiectul nu a fost găsit.");

  const result = await archiveRow(ctx.supabase, "projects", ctx.activeWorkspace.id, projectId);
  if (!result.ok) return actionError("Nu am putut arhiva proiectul.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "project",
    entityId: projectId,
    action: "project.archived",
    title: "Proiect arhivat",
    description: existing.name,
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return actionSuccess("Proiect arhivat.");
}

export async function softDeleteProjectAction(projectId: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("projects.delete");
  } catch {
    return actionError("Nu ai permisiunea de a șterge proiecte.");
  }

  const { data: existing } = await ctx.supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!existing) return actionError("Proiectul nu a fost găsit.");

  const result = await softDeleteRow(ctx.supabase, "projects", ctx.activeWorkspace.id, projectId);
  if (!result.ok) return actionError("Nu am putut șterge proiectul.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "project",
    entityId: projectId,
    action: "project.deleted",
    title: "Proiect șters",
    description: existing.name,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  return actionSuccess("Proiect șters.");
}

export async function restoreProjectAction(projectId: string): Promise<ActionResult> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("projects.write");
  } catch {
    return actionError("Nu ai permisiunea de a restaura proiecte.");
  }

  const { data: existing } = await ctx.supabase
    .from("projects")
    .select("id, name, deleted_at")
    .eq("id", projectId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .maybeSingle();

  if (!existing) return actionError("Proiectul nu a fost găsit.");

  if (existing.deleted_at) {
    const result = await restoreSoftDeletedRow(ctx.supabase, "projects", ctx.activeWorkspace.id, projectId);
    if (!result.ok) return actionError("Nu am putut restaura proiectul.");
  }

  const { error } = await ctx.supabase
    .from("projects")
    .update({ archived_at: null })
    .eq("id", projectId)
    .eq("workspace_id", ctx.activeWorkspace.id);

  if (error) return actionError("Nu am putut restaura proiectul.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "project",
    entityId: projectId,
    action: "project.restored",
    title: "Proiect restaurat",
    description: existing.name,
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  return actionSuccess("Proiect restaurat.");
}

/**
 * Idempotent: if a (non-deleted) project already exists for this contract in
 * the workspace, returns its id instead of creating a duplicate — protected
 * both here and by the unique index on (workspace_id, contract_id).
 */
export async function createProjectFromContractAction(
  contractId: string,
): Promise<ActionResult<{ projectId: string; created: boolean }>> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("projects.write");
  } catch {
    return actionError("Nu ai permisiunea de a crea proiecte.");
  }

  const { data: existingProject } = await ctx.supabase
    .from("projects")
    .select("id")
    .eq("workspace_id", ctx.activeWorkspace.id)
    .eq("contract_id", contractId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingProject) {
    return actionSuccess("Proiectul există deja pentru acest contract.", {
      projectId: existingProject.id,
      created: false,
    });
  }

  const { data: contract } = await ctx.supabase
    .from("contracts")
    .select("id, client_id, title, event_date, event_location, total, currency, status")
    .eq("id", contractId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!contract) return actionError("Contractul nu a fost găsit.");

  let clientName: string | null = null;
  if (contract.client_id) {
    const { data: client } = await ctx.supabase
      .from("clients")
      .select("name")
      .eq("id", contract.client_id)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle();
    clientName = client?.name ?? null;
  }

  const name = deriveProjectNameFromContract({ contractTitle: contract.title, clientName });

  const { data: created, error } = await ctx.supabase
    .from("projects")
    .insert({
      workspace_id: ctx.activeWorkspace.id,
      client_id: contract.client_id,
      contract_id: contract.id,
      name,
      event_date: contract.event_date,
      location: contract.event_location,
      status: "booked",
      pipeline_key: DEFAULT_PIPELINE_TEMPLATE_ID,
      estimated_revenue: Number(contract.total ?? 0),
      currency: contract.currency || "RON",
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !created) {
    if (error?.code === "23505") {
      const { data: raceExisting } = await ctx.supabase
        .from("projects")
        .select("id")
        .eq("workspace_id", ctx.activeWorkspace.id)
        .eq("contract_id", contractId)
        .maybeSingle();
      if (raceExisting) {
        return actionSuccess("Proiectul există deja pentru acest contract.", {
          projectId: raceExisting.id,
          created: false,
        });
      }
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[projects.createFromContract]", error?.message);
    }
    return actionError("Nu am putut crea proiectul din contract.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "project",
    entityId: created.id,
    action: "project.created_from_contract",
    title: "Proiect creat din contract",
    description: name,
    metadata: { contract_id: contractId },
  });

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${created.id}`);
  revalidatePath("/dashboard/contracts");
  revalidatePath(`/dashboard/contracts/${contractId}`);
  return actionSuccess("Proiect creat din contract.", { projectId: created.id, created: true });
}
