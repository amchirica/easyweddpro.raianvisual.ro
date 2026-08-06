"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTaskAction, updateTaskAction } from "@/lib/actions/tasks";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/constants";
import { taskFormSchema } from "@/lib/validations/tasks";

export type TaskFormOption = { id: string; name: string };

export type TaskFormInitial = {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string | null;
  clientId: string | null;
  projectId: string | null;
};

type TaskFormState = {
  title: string;
  notes: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assigneeId: string;
  clientId: string;
  projectId: string;
};

function emptyForm(defaultAssigneeId?: string): TaskFormState {
  return {
    title: "",
    notes: "",
    status: "todo",
    priority: "normal",
    dueDate: "",
    assigneeId: defaultAssigneeId ?? "",
    clientId: "",
    projectId: "",
  };
}

function formFromInitial(initial: TaskFormInitial): TaskFormState {
  return {
    title: initial.title,
    notes: initial.notes,
    status: initial.status,
    priority: initial.priority,
    dueDate: initial.dueDate,
    assigneeId: initial.assigneeId ?? "",
    clientId: initial.clientId ?? "",
    projectId: initial.projectId ?? "",
  };
}

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: TaskFormInitial;
  members: TaskFormOption[];
  clients: TaskFormOption[];
  projects: TaskFormOption[];
  currentUserId: string;
  /** Collaborators/editors can only manage tasks assigned to themselves. */
  isAssigneeOnly: boolean;
  onSuccess?: () => void;
};

export function TaskFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  members,
  clients,
  projects,
  currentUserId,
  isAssigneeOnly,
  onSuccess,
}: TaskFormDialogProps) {
  const [form, setForm] = useState<TaskFormState>(() =>
    initial ? formFromInitial(initial) : emptyForm(isAssigneeOnly ? currentUserId : undefined),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional open-only reset
    setForm(
      initial ? formFromInitial(initial) : emptyForm(isAssigneeOnly ? currentUserId : undefined),
    );
    setFieldErrors({});
    setFormError(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- intentional open-only reset

  function updateField<K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const payload = {
      title: form.title,
      notes: form.notes,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate,
      assigneeId: form.assigneeId || null,
      clientId: form.clientId || null,
      projectId: form.projectId || null,
      calendarEventId: null,
      subtasks: [],
    };

    const parsed = taskFormSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setFormError("Verifică datele completate.");
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    const result =
      mode === "create"
        ? await createTaskAction(parsed.data)
        : await updateTaskAction(initial?.id ?? "", parsed.data);

    setSubmitting(false);

    if (result?.error || !result?.data) {
      setFormError(result?.error ?? "Nu am putut salva task-ul.");
      return;
    }

    toast(result.success ?? (mode === "create" ? "Task creat." : "Task actualizat."), "success");
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Task nou" : "Editează task"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adaugă un task nou pentru echipa ta."
              : "Actualizează detaliile acestui task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Titlu</Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Ex: Trimite contractul spre semnare"
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title ? (
              <p className="text-xs text-destructive">{fieldErrors.title}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => updateField("status", (value as TaskStatus) ?? "todo")}
              >
                <SelectTrigger id="task-status" className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {TASK_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-priority">Prioritate</Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  updateField("priority", (value as TaskPriority) ?? "normal")
                }
              >
                <SelectTrigger id="task-priority" className="h-8 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {TASK_PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-dueDate">Data limită</Label>
              <Input
                id="task-dueDate"
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-assignee">Responsabil</Label>
              <Select
                value={form.assigneeId || undefined}
                onValueChange={(value) => updateField("assigneeId", value ?? "")}
                disabled={isAssigneeOnly}
              >
                <SelectTrigger id="task-assignee" className="h-8 w-full">
                  <SelectValue placeholder="Neasignat" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isAssigneeOnly ? (
                <p className="text-xs text-muted-soft">Poți crea task-uri doar pentru tine.</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="task-client">Client</Label>
              <Select
                value={form.clientId || undefined}
                onValueChange={(value) => updateField("clientId", value ?? "")}
              >
                <SelectTrigger id="task-client" className="h-8 w-full">
                  <SelectValue placeholder="Fără client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-project">Proiect</Label>
              <Select
                value={form.projectId || undefined}
                onValueChange={(value) => updateField("projectId", value ?? "")}
              >
                <SelectTrigger id="task-project" className="h-8 w-full">
                  <SelectValue placeholder="Fără proiect" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-notes">Notițe</Label>
            <Textarea
              id="task-notes"
              rows={4}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </div>

          {formError ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Anulează
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Se salvează…"
                : mode === "create"
                  ? "Creează task"
                  : "Salvează modificările"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
