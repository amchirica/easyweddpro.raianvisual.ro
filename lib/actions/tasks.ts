"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { softDeleteRow } from "@/lib/data/soft-delete";
import { taskFormSchema } from "@/lib/validations/tasks";
import { permissionsForRole, requireWorkspaceAction } from "@/lib/workspace/permissions";
import type { WorkspaceContext } from "@/lib/workspace/session";
import type { Database } from "@/types/database";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

/**
 * Collaborators/editors are "assignee only": they may only create tasks assigned
 * to themselves, and may only edit tasks that are currently assigned to them.
 */
function resolveAssigneeForCreate(
  ctx: WorkspaceContext,
  requestedAssigneeId: string | null,
): { assigneeId: string | null } | { error: string } {
  const permissions = permissionsForRole(ctx.role);
  if (!permissions.isAssigneeOnly) {
    return { assigneeId: requestedAssigneeId };
  }
  if (requestedAssigneeId && requestedAssigneeId !== ctx.user.id) {
    return { error: "Poți crea task-uri doar pentru tine." };
  }
  return { assigneeId: ctx.user.id };
}

function canEditExistingTask(ctx: WorkspaceContext, existing: TaskRow): boolean {
  const permissions = permissionsForRole(ctx.role);
  if (!permissions.isAssigneeOnly) return true;
  return existing.assignee_id === ctx.user.id;
}

async function fetchExistingTask(
  ctx: WorkspaceContext,
  taskId: string,
): Promise<TaskRow | null> {
  const { data } = await ctx.supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  return data ?? null;
}

export async function createTaskAction(
  input: unknown,
): Promise<ActionResult<{ task: TaskRow }>> {
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx: WorkspaceContext;
  try {
    ctx = await requireWorkspaceAction("tasks.write");
  } catch {
    return actionError("Nu ai permisiunea de a crea task-uri.");
  }

  const data = parsed.data;
  const resolved = resolveAssigneeForCreate(ctx, data.assigneeId ?? null);
  if ("error" in resolved) return actionError(resolved.error);

  const { data: task, error } = await ctx.supabase
    .from("tasks")
    .insert({
      workspace_id: ctx.activeWorkspace.id,
      title: data.title.trim(),
      notes: emptyToNull(data.notes),
      status: data.status,
      priority: data.priority,
      due_date: emptyToNull(data.dueDate),
      assignee_id: resolved.assigneeId,
      client_id: data.clientId ?? null,
      project_id: data.projectId ?? null,
      calendar_event_id: data.calendarEventId ?? null,
      subtasks: data.subtasks,
      created_by: ctx.user.id,
    })
    .select("*")
    .single();

  if (error || !task) {
    if (process.env.NODE_ENV === "development") {
      console.error("[tasks.create]", error?.message);
    }
    return actionError("Nu am putut crea task-ul.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "task",
    entityId: task.id,
    action: "task.created",
    title: "Task creat",
    description: task.title,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  return actionSuccess("Task creat.", { task });
}

export async function updateTaskAction(
  taskId: string,
  input: unknown,
): Promise<ActionResult<{ task: TaskRow }>> {
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx: WorkspaceContext;
  try {
    ctx = await requireWorkspaceAction("tasks.write");
  } catch {
    return actionError("Nu ai permisiunea de a edita task-uri.");
  }

  const existing = await fetchExistingTask(ctx, taskId);
  if (!existing) return actionError("Task-ul nu a fost găsit.");

  if (!canEditExistingTask(ctx, existing)) {
    return actionError("Poți edita doar task-urile care îți sunt asignate.");
  }

  const data = parsed.data;
  const permissions = permissionsForRole(ctx.role);
  let assigneeId = data.assigneeId ?? null;

  if (permissions.isAssigneeOnly) {
    if (assigneeId && assigneeId !== ctx.user.id) {
      return actionError("Nu poți reasigna acest task altcuiva.");
    }
    assigneeId = ctx.user.id;
  }

  const completedAt =
    data.status === "done" ? existing.completed_at ?? new Date().toISOString() : null;

  const { data: task, error } = await ctx.supabase
    .from("tasks")
    .update({
      title: data.title.trim(),
      notes: emptyToNull(data.notes),
      status: data.status,
      priority: data.priority,
      due_date: emptyToNull(data.dueDate),
      assignee_id: assigneeId,
      client_id: data.clientId ?? null,
      project_id: data.projectId ?? null,
      calendar_event_id: data.calendarEventId ?? null,
      subtasks: data.subtasks,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut actualiza task-ul.");
  if (!task) return actionError("Task-ul nu a fost găsit.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "task",
    entityId: task.id,
    action: "task.updated",
    title: "Task actualizat",
    description: task.title,
  });

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  return actionSuccess("Task actualizat.", { task });
}

async function setTaskStatus(
  taskId: string,
  nextStatus: "done" | "todo",
): Promise<ActionResult<{ task: TaskRow }>> {
  let ctx: WorkspaceContext;
  try {
    ctx = await requireWorkspaceAction("tasks.write");
  } catch {
    return actionError("Nu ai permisiunea de a actualiza task-uri.");
  }

  const existing = await fetchExistingTask(ctx, taskId);
  if (!existing) return actionError("Task-ul nu a fost găsit.");

  if (!canEditExistingTask(ctx, existing)) {
    return actionError("Poți actualiza doar task-urile care îți sunt asignate.");
  }

  const { data: task, error } = await ctx.supabase
    .from("tasks")
    .update({
      status: nextStatus,
      completed_at: nextStatus === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut actualiza task-ul.");
  if (!task) return actionError("Task-ul nu a fost găsit.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "task",
    entityId: task.id,
    action: nextStatus === "done" ? "task.completed" : "task.reopened",
    title: nextStatus === "done" ? "Task finalizat" : "Task reactivat",
    description: task.title,
  });

  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${taskId}`);
  return actionSuccess(
    nextStatus === "done" ? "Task finalizat." : "Task reactivat.",
    { task },
  );
}

export async function completeTaskAction(
  taskId: string,
): Promise<ActionResult<{ task: TaskRow }>> {
  return setTaskStatus(taskId, "done");
}

export async function reopenTaskAction(
  taskId: string,
): Promise<ActionResult<{ task: TaskRow }>> {
  return setTaskStatus(taskId, "todo");
}

export async function softDeleteTaskAction(taskId: string): Promise<ActionResult> {
  let ctx: WorkspaceContext;
  try {
    ctx = await requireWorkspaceAction("tasks.delete");
  } catch {
    return actionError("Nu ai permisiunea de a șterge task-uri.");
  }

  const existing = await fetchExistingTask(ctx, taskId);
  if (!existing) return actionError("Task-ul nu a fost găsit.");

  const result = await softDeleteRow(ctx.supabase, "tasks", ctx.activeWorkspace.id, taskId);
  if (!result.ok) return actionError("Nu am putut șterge task-ul.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "task",
    entityId: taskId,
    action: "task.deleted",
    title: "Task șters",
    description: existing.title,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  return actionSuccess("Task șters.");
}
