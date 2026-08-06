"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { TaskFormDialog, type TaskFormOption } from "@/components/tasks/task-form-dialog";

type NewTaskDialogPageProps = {
  members: TaskFormOption[];
  clients: TaskFormOption[];
  projects: TaskFormOption[];
  currentUserId: string;
  isAssigneeOnly: boolean;
};

export function NewTaskDialogPage({
  members,
  clients,
  projects,
  currentUserId,
  isAssigneeOnly,
}: NewTaskDialogPageProps) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) router.push("/dashboard/tasks");
  }

  return (
    <TaskFormDialog
      open={open}
      onOpenChange={handleOpenChange}
      mode="create"
      members={members}
      clients={clients}
      projects={projects}
      currentUserId={currentUserId}
      isAssigneeOnly={isAssigneeOnly}
      onSuccess={() => router.push("/dashboard/tasks")}
    />
  );
}
