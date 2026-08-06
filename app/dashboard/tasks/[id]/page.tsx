import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ModuleShell } from "@/components/shared/module-shell";
import { TaskDetail, type TaskDetailData } from "@/components/tasks/task-detail";
import { listClients } from "@/lib/data/clients";
import { getTaskById, listWorkspaceMemberOptions } from "@/lib/data/tasks";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

type TaskPageParams = { id: string };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Task · EasyWedd Pro",
  };
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<TaskPageParams>;
}) {
  const { id } = await params;
  const ctx = await requireWorkspace();

  let taskRow;
  try {
    taskRow = await getTaskById(ctx.supabase, ctx.activeWorkspace.id, id);
  } catch {
    notFound();
  }

  if (!taskRow) notFound();

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

  const memberNameById = new Map(members.map((member) => [member.id, member.name]));
  const clientNameById = new Map(clientRows.map((client) => [client.id, client.name]));
  const projectNameById = new Map((projectRows.data ?? []).map((project) => [project.id, project.name]));

  const permissions = permissionsForRole(ctx.role);
  const canManage =
    permissions.canWriteTasks &&
    (!permissions.isAssigneeOnly || taskRow.assignee_id === ctx.user.id);

  const task: TaskDetailData = {
    id: taskRow.id,
    title: taskRow.title,
    notes: taskRow.notes ?? "",
    status: taskRow.status as TaskDetailData["status"],
    priority: taskRow.priority as TaskDetailData["priority"],
    dueDate: taskRow.due_date,
    assigneeId: taskRow.assignee_id,
    assigneeName: taskRow.assignee_id ? memberNameById.get(taskRow.assignee_id) ?? null : null,
    clientId: taskRow.client_id,
    clientName: taskRow.client_id ? clientNameById.get(taskRow.client_id) ?? null : null,
    projectId: taskRow.project_id,
    projectName: taskRow.project_id ? projectNameById.get(taskRow.project_id) ?? null : null,
    completedAt: taskRow.completed_at,
    createdAt: taskRow.created_at,
    updatedAt: taskRow.updated_at,
  };

  return (
    <ModuleShell title={task.title} description="Detalii task">
      <TaskDetail
        task={task}
        members={members}
        clients={clientRows.map((client) => ({ id: client.id, name: client.name }))}
        projects={(projectRows.data ?? []).map((project) => ({ id: project.id, name: project.name }))}
        currentUserId={ctx.user.id}
        canManage={canManage}
        canDelete={permissions.canDeleteTasks}
        isAssigneeOnly={permissions.isAssigneeOnly}
      />
    </ModuleShell>
  );
}
