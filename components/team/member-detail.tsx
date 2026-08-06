"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban, Briefcase, CheckSquare, ClipboardList, ShieldCheck, Trash2 } from "lucide-react";

import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MemberProjectItem, MemberTaskItem } from "@/lib/data/team";
import {
  changeMemberRoleAction,
  disableMemberAction,
  enableMemberAction,
  removeMemberAction,
} from "@/lib/actions/team";
import { WORKSPACE_ROLE_LABELS, type WorkspaceRole } from "@/lib/constants";
import { formatDate } from "@/lib/format";

const ASSIGNABLE_ROLES: WorkspaceRole[] = [
  "owner",
  "admin",
  "manager",
  "sales",
  "editor",
  "collaborator",
  "viewer",
];

const TASK_STATUS_LABELS: Record<string, string> = {
  todo: "De făcut",
  in_progress: "În lucru",
  blocked: "Blocat",
  done: "Finalizat",
  cancelled: "Anulat",
};

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

export type MemberDetailData = {
  membershipId: string;
  userId: string;
  role: WorkspaceRole;
  disabledAt: string | null;
  memberSince: string;
  fullName: string | null;
};

type MemberDetailProps = {
  member: MemberDetailData;
  workload: { openTasks: number; totalTasks: number; projects: number };
  tasks: MemberTaskItem[];
  projects: MemberProjectItem[];
  canManage: boolean;
  isSelf: boolean;
};

export function MemberDetail({ member, workload, tasks, projects, canManage, isSelf }: MemberDetailProps) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const displayName = member.fullName ?? "Membru fără profil";

  async function handleRoleChange(nextRole: WorkspaceRole) {
    if (nextRole === member.role) return;
    let confirmOwnerTransfer = false;
    if (nextRole === "owner") {
      confirmOwnerTransfer = window.confirm(
        `Confirmă transferul de proprietate: „${displayName}” va deveni owner.`,
      );
      if (!confirmOwnerTransfer) return;
    }
    setBusy(true);
    const result = await changeMemberRoleAction(member.membershipId, {
      role: nextRole,
      confirmOwnerTransfer,
    });
    setBusy(false);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Rol actualizat.", "success");
    router.refresh();
  }

  async function handleToggleDisabled() {
    setBusy(true);
    const result = member.disabledAt
      ? await enableMemberAction(member.membershipId)
      : await disableMemberAction(member.membershipId);
    setBusy(false);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Salvat.", "success");
    router.refresh();
  }

  async function handleRemove() {
    if (!window.confirm(`Elimini ${displayName} din workspace?`)) return;
    setBusy(true);
    const result = await removeMemberAction(member.membershipId);
    setBusy(false);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Membru eliminat.", "success");
    router.push("/dashboard/team");
  }

  return (
    <div className="space-y-6">
      <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            <AvatarFallback className="bg-champagne/15 text-champagne">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-heading text-xl font-medium text-foreground">
              {displayName}
              {isSelf ? " (tu)" : ""}
            </p>
            <p className="text-sm text-muted-foreground">Membru din {formatDate(member.memberSince)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {member.disabledAt ? <StatusBadge label="Dezactivat" tone="danger" /> : null}
          {canManage ? (
            <Select value={member.role} onValueChange={(value) => handleRoleChange((value as WorkspaceRole) ?? member.role)}>
              <SelectTrigger className="h-8 w-40" disabled={busy}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {WORKSPACE_ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <StatusBadge label={WORKSPACE_ROLE_LABELS[member.role]} tone="accent" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Sarcini active" value={String(workload.openTasks)} icon={CheckSquare} />
        <StatCard label="Total sarcini" value={String(workload.totalTasks)} icon={ClipboardList} />
        <StatCard label="Proiecte în echipă" value={String(workload.projects)} icon={Briefcase} />
      </div>

      <section className="surface-card space-y-3 p-5">
        <h2 className="font-heading text-base font-medium text-foreground">Sarcini asignate</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nicio sarcină asignată.</p>
        ) : (
          <ul className="divide-y divide-border">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-foreground">{task.title}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {task.dueDate ? formatDate(task.dueDate) : "—"}
                  <StatusBadge label={TASK_STATUS_LABELS[task.status] ?? task.status} tone="neutral" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-card space-y-3 p-5">
        <h2 className="font-heading text-base font-medium text-foreground">Proiecte în echipă</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Niciun proiect cu acest membru în echipă.</p>
        ) : (
          <ul className="divide-y divide-border">
            {projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate text-foreground">{project.name}</span>
                <span className="text-xs text-muted-foreground">{project.progress}%</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canManage ? (
        <section className="surface-card space-y-3 p-5">
          <h2 className="font-heading text-base font-medium text-foreground">Administrare</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={handleToggleDisabled}>
              {member.disabledAt ? (
                <>
                  <ShieldCheck data-icon="inline-start" />
                  Reactivează
                </>
              ) : (
                <>
                  <Ban data-icon="inline-start" />
                  Dezactivează
                </>
              )}
            </Button>
            <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={handleRemove}>
              <Trash2 data-icon="inline-start" />
              Elimină din workspace
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
