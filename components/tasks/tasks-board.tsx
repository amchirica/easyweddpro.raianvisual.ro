"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Plus, Search, Trash2 } from "lucide-react";

import { TaskFormDialog, type TaskFormOption } from "@/components/tasks/task-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  completeTaskAction,
  reopenTaskAction,
  softDeleteTaskAction,
} from "@/lib/actions/tasks";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TaskListItem = {
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
};

const PRIORITY_TONE: Record<TaskPriority, "neutral" | "accent" | "warning" | "danger"> = {
  low: "neutral",
  normal: "accent",
  high: "warning",
  urgent: "danger",
};

const QUICK_FILTERS = [
  { id: "all", label: "Toate" },
  { id: "mine", label: "Ale mele" },
  { id: "unassigned", label: "Neasignate" },
  { id: "overdue", label: "Întârziate" },
  { id: "dueToday", label: "Astăzi" },
] as const;

type QuickFilter = (typeof QUICK_FILTERS)[number]["id"];

function isOverdue(task: TaskListItem, today: string): boolean {
  if (!task.dueDate) return false;
  if (task.status === "done" || task.status === "cancelled") return false;
  return task.dueDate < today;
}

function isDueToday(task: TaskListItem, today: string): boolean {
  if (!task.dueDate) return false;
  return task.dueDate === today;
}

type TasksBoardProps = {
  initialTasks: TaskListItem[];
  members: TaskFormOption[];
  clients: TaskFormOption[];
  projects: TaskFormOption[];
  currentUserId: string;
  canWrite: boolean;
  canDelete: boolean;
  isAssigneeOnly: boolean;
  error?: string | null;
};

export function TasksBoard({
  initialTasks,
  members,
  clients,
  projects,
  currentUserId,
  canWrite,
  canDelete,
  isAssigneeOnly,
  error,
}: TasksBoardProps) {
  const [tasks, setTasks] = useState<TaskListItem[]>(initialTasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskListItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Keep optimistic board state in sync when the server payload changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from RSC props
    setTasks(initialTasks);
  }, [initialTasks]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) return false;
      if (quickFilter === "mine" && task.assigneeId !== currentUserId) return false;
      if (quickFilter === "unassigned" && task.assigneeId) return false;
      if (quickFilter === "overdue" && !isOverdue(task, today)) return false;
      if (quickFilter === "dueToday" && !isDueToday(task, today)) return false;
      if (!query) return true;
      const haystack =
        `${task.title} ${task.notes} ${task.assigneeName ?? ""} ${task.clientName ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [tasks, search, statusFilter, quickFilter, currentUserId, today]);

  const columns = useMemo(
    () =>
      TASK_STATUSES.map((status) => ({
        status,
        label: TASK_STATUS_LABELS[status],
        tasks: filtered.filter((task) => task.status === status),
      })),
    [filtered],
  );

  function canManage(task: TaskListItem): boolean {
    if (!canWrite) return false;
    if (!isAssigneeOnly) return true;
    return task.assigneeId === currentUserId;
  }

  async function handleToggleDone(task: TaskListItem, done: boolean) {
    if (pendingId) return;
    setPendingId(task.id);
    const result = done ? await completeTaskAction(task.id) : await reopenTaskAction(task.id);
    setPendingId(null);

    if (result.error || !result.data) {
      toast(result.error ?? "Nu am putut actualiza task-ul.", "error");
      return;
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? { ...item, status: result.data!.task.status as TaskStatus } : item,
      ),
    );
    toast(result.success ?? "Task actualizat.", "success");
  }

  async function handleDelete(task: TaskListItem) {
    if (pendingId) return;
    if (!window.confirm(`Ștergi task-ul „${task.title}”?`)) return;
    setPendingId(task.id);
    const result = await softDeleteTaskAction(task.id);
    setPendingId(null);

    if (result.error) {
      toast(result.error, "error");
      return;
    }

    setTasks((current) => current.filter((item) => item.id !== task.id));
    toast(result.success ?? "Task șters.", "success");
  }

  function openCreateDialog() {
    setEditingTask(null);
    setDialogOpen(true);
  }

  function openEditDialog(task: TaskListItem) {
    setEditingTask(task);
    setDialogOpen(true);
  }

  return (
    <ModuleShell
      title="Task-uri"
      description="Task-urile echipei, organizate pe stadiu de progres."
      actions={
        canWrite ? (
          <Button type="button" onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            Task nou
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-5">
        {error ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block max-w-sm flex-1">
            <span className="sr-only">Căutare task-uri</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Caută după titlu, notițe, responsabil…"
              className="h-9 pl-9"
            />
          </label>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter((value as TaskStatus | "all") ?? "all")}
          >
            <SelectTrigger className="h-9 w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate statusurile</SelectItem>
              {TASK_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {TASK_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setQuickFilter(filter.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                quickFilter === filter.id
                  ? "border-champagne/40 bg-champagne/10 text-champagne-soft"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title={tasks.length === 0 ? "Niciun task" : "Niciun task găsit"}
            description={
              tasks.length === 0
                ? "Adaugă primul task pentru echipa ta."
                : "Încearcă alți termeni de căutare sau alt filtru."
            }
            action={
              tasks.length === 0 && canWrite ? (
                <Button type="button" onClick={openCreateDialog}>
                  <Plus data-icon="inline-start" />
                  Task nou
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            {columns.map((column) => (
              <div key={column.status} className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2">
                  <p className="text-sm font-medium text-foreground">{column.label}</p>
                  <span className="text-xs text-muted-foreground">{column.tasks.length}</span>
                </div>

                <div className="space-y-3">
                  {column.tasks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-soft">
                      Niciun task
                    </div>
                  ) : (
                    column.tasks.map((task) => {
                      const manageable = canManage(task);
                      const overdue = isOverdue(task, today);
                      return (
                        <div key={task.id} className="surface-card space-y-2 p-4">
                          <div className="flex items-start gap-2.5">
                            <Checkbox
                              checked={task.status === "done"}
                              onCheckedChange={(checked) => handleToggleDone(task, checked === true)}
                              disabled={!manageable || pendingId === task.id}
                              className="mt-0.5"
                              aria-label={`Marchează „${task.title}” ca finalizat`}
                            />
                            <Link
                              href={`/dashboard/tasks/${task.id}`}
                              className={cn(
                                "text-sm text-foreground hover:text-champagne-soft",
                                task.status === "done" && "text-muted-foreground line-through",
                              )}
                            >
                              {task.title}
                            </Link>
                          </div>
                          {task.clientName ? (
                            <p className="pl-7 text-xs text-muted-foreground">{task.clientName}</p>
                          ) : null}
                          <div className="flex items-center justify-between pl-7">
                            {task.dueDate ? (
                              <span
                                className={cn(
                                  "text-xs",
                                  overdue ? "text-destructive" : "text-muted-soft",
                                )}
                              >
                                {formatDate(task.dueDate)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-soft">Fără termen</span>
                            )}
                            <StatusBadge
                              label={TASK_PRIORITY_LABELS[task.priority]}
                              tone={PRIORITY_TONE[task.priority]}
                            />
                          </div>
                          <div className="flex items-center justify-between pl-7">
                            <p className="text-xs text-muted-soft">
                              {task.assigneeName ?? "Neasignat"}
                            </p>
                            {manageable ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditDialog(task)}
                                  className="text-xs text-champagne hover:text-champagne-soft"
                                >
                                  Editează
                                </button>
                                {canDelete ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(task)}
                                    disabled={pendingId === task.id}
                                    className="text-muted-foreground hover:text-destructive"
                                    aria-label={`Șterge task-ul ${task.title}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={editingTask ? "edit" : "create"}
        initial={
          editingTask
            ? {
                id: editingTask.id,
                title: editingTask.title,
                notes: editingTask.notes,
                status: editingTask.status,
                priority: editingTask.priority,
                dueDate: editingTask.dueDate ?? "",
                assigneeId: editingTask.assigneeId,
                clientId: editingTask.clientId,
                projectId: editingTask.projectId,
              }
            : undefined
        }
        members={members}
        clients={clients}
        projects={projects}
        currentUserId={currentUserId}
        isAssigneeOnly={isAssigneeOnly}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </ModuleShell>
  );
}
