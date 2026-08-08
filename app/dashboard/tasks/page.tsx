import type { Metadata } from "next";
import { getTranslator } from "@/lib/i18n/t";

import { TasksBoard, type TaskListItem } from "@/components/tasks/tasks-board";
import { listClients } from "@/lib/data/clients";
import { listTasks, listWorkspaceMemberOptions, type TaskRow } from "@/lib/data/tasks";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: `${t("modules.tasks.title")} · EasyWedd Pro` };
}

function mapTaskRow(row: TaskRow, names: Map<string, string>, clientNames: Map<string, string>): TaskListItem {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? "",
    status: row.status as TaskListItem["status"],
    priority: row.priority as TaskListItem["priority"],
    dueDate: row.due_date,
    assigneeId: row.assignee_id,
    assigneeName: row.assignee_id ? names.get(row.assignee_id) ?? null : null,
    clientId: row.client_id,
    clientName: row.client_id ? clientNames.get(row.client_id) ?? null : null,
    projectId: row.project_id,
  };
}

export default async function TasksPage() {
  const { t } = await getTranslator();
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);

  let tasks: TaskListItem[] = [];
  let error: string | null = null;
  const members = await listWorkspaceMemberOptions(ctx.supabase, ctx.activeWorkspace.id);

  const [clientRows, projectRows] = await Promise.all([
    listClients(ctx.supabase, ctx.activeWorkspace.id, { limit: 200 }),
    ctx.supabase
      .from("projects")
      .select("id, name")
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(200),
  ]);

  const clientNameById = new Map(clientRows.map((client) => [client.id, client.name]));
  const clients = clientRows.map((client) => ({ id: client.id, name: client.name }));
  const projects = (projectRows.data ?? []).map((project) => ({ id: project.id, name: project.name }));
  const memberNameById = new Map(members.map((member) => [member.id, member.name]));

  try {
    const rows = await listTasks(ctx.supabase, ctx.activeWorkspace.id);
    tasks = rows.map((row) => mapTaskRow(row, memberNameById, clientNameById));
  } catch (err) {
    error = err instanceof Error ? err.message : t("modules.tasks.loadFailed");
  }

  return (
    <TasksBoard
      initialTasks={tasks}
      members={members}
      clients={clients}
      projects={projects}
      currentUserId={ctx.user.id}
      canWrite={permissions.canWriteTasks}
      canDelete={permissions.canDeleteTasks}
      isAssigneeOnly={permissions.isAssigneeOnly}
      error={error}
    />
  );
}
