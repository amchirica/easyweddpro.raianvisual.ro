"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Pencil, RotateCcw, Trash2 } from "lucide-react";

import { TaskFormDialog, type TaskFormOption } from "@/components/tasks/task-form-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import {
  completeTaskAction,
  reopenTaskAction,
  softDeleteTaskAction,
} from "@/lib/actions/tasks";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/format";

export type TaskDetailData = {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type TaskDetailProps = {
  task: TaskDetailData;
  members: TaskFormOption[];
  clients: TaskFormOption[];
  projects: TaskFormOption[];
  currentUserId: string;
  canManage: boolean;
  canDelete: boolean;
  isAssigneeOnly: boolean;
};

export function TaskDetail({
  task,
  members,
  clients,
  projects,
  currentUserId,
  canManage,
  canDelete,
  isAssigneeOnly,
}: TaskDetailProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleToggleDone() {
    if (pending) return;
    setPending(true);
    const result =
      task.status === "done" ? await reopenTaskAction(task.id) : await completeTaskAction(task.id);
    setPending(false);

    if (result.error) {
      toast(result.error, "error");
      return;
    }

    toast(result.success ?? "Task actualizat.", "success");
    router.refresh();
  }

  async function handleDelete() {
    if (pending) return;
    if (!window.confirm(`Ștergi task-ul „${task.title}”?`)) return;
    setPending(true);
    const result = await softDeleteTaskAction(task.id);
    setPending(false);

    if (result.error) {
      toast(result.error, "error");
      return;
    }

    toast(result.success ?? "Task șters.", "success");
    router.push("/dashboard/tasks");
  }

  return (
    <div className="space-y-6">
      <div className="surface-card space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={TASK_STATUS_LABELS[task.status]} tone="accent" />
              <StatusBadge
                label={TASK_PRIORITY_LABELS[task.priority]}
                tone={
                  task.priority === "urgent"
                    ? "danger"
                    : task.priority === "high"
                      ? "warning"
                      : "neutral"
                }
              />
            </div>
            <h2 className="font-heading text-2xl font-medium text-foreground">{task.title}</h2>
          </div>

          {canManage ? (
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleToggleDone} disabled={pending}>
                {task.status === "done" ? (
                  <>
                    <RotateCcw data-icon="inline-start" />
                    Reactivează
                  </>
                ) : (
                  <>
                    <CheckCircle2 data-icon="inline-start" />
                    Finalizează
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(true)}>
                <Pencil data-icon="inline-start" />
                Editează
              </Button>
              {canDelete ? (
                <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
                  <Trash2 data-icon="inline-start" />
                  Șterge
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Termen</dt>
            <dd className="mt-1 text-foreground">
              {task.dueDate ? formatDate(task.dueDate) : "Fără termen"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Responsabil</dt>
            <dd className="mt-1 text-foreground">{task.assigneeName ?? "Neasignat"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Client</dt>
            <dd className="mt-1 text-foreground">{task.clientName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Proiect</dt>
            <dd className="mt-1 text-foreground">{task.projectName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Creat</dt>
            <dd className="mt-1 text-foreground">{formatDateTime(task.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Finalizat</dt>
            <dd className="mt-1 text-foreground">
              {task.completedAt ? formatDateTime(task.completedAt) : "—"}
            </dd>
          </div>
        </dl>

        {task.notes ? (
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Notițe</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{task.notes}</p>
          </div>
        ) : null}
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="edit"
        initial={{
          id: task.id,
          title: task.title,
          notes: task.notes,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ?? "",
          assigneeId: task.assigneeId,
          clientId: task.clientId,
          projectId: task.projectId,
        }}
        members={members}
        clients={clients}
        projects={projects}
        currentUserId={currentUserId}
        isAssigneeOnly={isAssigneeOnly}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
