"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Ban,
  MoreHorizontal,
  Send,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { useI18n } from "@/components/providers/i18n-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  changeMemberRoleAction,
  disableMemberAction,
  enableMemberAction,
  removeMemberAction,
  resendInvitationAction,
  revokeInvitationAction,
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

export type TeamMemberItem = {
  membershipId: string;
  userId: string;
  role: WorkspaceRole;
  disabledAt: string | null;
  memberSince: string;
  fullName: string | null;
};

export type TeamInvitationItem = {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  createdAt: string;
  expired: boolean;
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

type TeamPageClientProps = {
  members: TeamMemberItem[];
  invitations: TeamInvitationItem[];
  canManage: boolean;
  currentUserId: string;
  error?: string | null;
};

export function TeamPageClient({
  members,
  invitations,
  canManage,
  currentUserId,
  error,
}: TeamPageClientProps) {
  const { t } = useI18n();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function runAction(
    id: string,
    action: () => Promise<{ error?: string; success?: string }>,
  ) {
    setBusyId(id);
    const result = await action();
    setBusyId(null);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Salvat.", "success");
    router.refresh();
  }

  async function handleRoleChange(member: TeamMemberItem, nextRole: WorkspaceRole) {
    if (nextRole === member.role) return;

    let confirmOwnerTransfer = false;
    if (nextRole === "owner") {
      confirmOwnerTransfer = window.confirm(
        t("modules.team.transferConfirm", { name: member.fullName ?? t("modules.team.thisMember") }),
      );
      if (!confirmOwnerTransfer) return;
    }

    setBusyId(member.membershipId);
    const result = await changeMemberRoleAction(member.membershipId, {
      role: nextRole,
      confirmOwnerTransfer,
    });
    setBusyId(null);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Rol actualizat.", "success");
    router.refresh();
  }

  function handleRemove(member: TeamMemberItem) {
    if (!window.confirm(`Elimini ${member.fullName ?? "acest membru"} din workspace?`)) return;
    void runAction(member.membershipId, () => removeMemberAction(member.membershipId));
  }

  async function handleResend(invitation: TeamInvitationItem) {
    setBusyId(invitation.id);
    const result = await resendInvitationAction(invitation.id);
    setBusyId(null);
    if (result?.error || !result?.data) {
      toast(result?.error ?? t("modules.team.resendFailed"), "error");
      return;
    }
    toast(result.success ?? t("modules.team.resent"), "success");
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${result.data.invitePath}`);
      toast(t("modules.team.newLinkCopied"), "success");
    } catch {
      // Clipboard optional — invitation was still rotated successfully.
    }
    router.refresh();
  }

  function handleRevoke(invitation: TeamInvitationItem) {
    if (!window.confirm(t("modules.team.revokeConfirm", { email: invitation.email }))) return;
    void runAction(invitation.id, () => revokeInvitationAction(invitation.id));
  }

  return (
    <ModuleShell
      title={t("modules.team.title")}
      description={t("modules.team.description")}
      actions={
        canManage ? (
          <Button type="button" onClick={() => setInviteOpen(true)}>
            <UserPlus data-icon="inline-start" />
            {t("modules.team.invite")}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-8">
        {error ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {members.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title={t("modules.team.empty")}
            description={t("modules.team.emptyHint")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => {
              const isSelf = member.userId === currentUserId;
              const displayName = member.fullName ?? t("modules.team.memberNoProfile");
              return (
                <div key={member.membershipId} className="surface-card flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/dashboard/team/${member.membershipId}`}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <Avatar>
                        <AvatarFallback className="bg-champagne/15 text-champagne">
                          {getInitials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-heading text-base font-medium text-foreground">
                          {displayName}
                          {isSelf ? " (tu)" : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Membru din {formatDate(member.memberSince)}
                        </p>
                      </div>
                    </Link>
                    {member.disabledAt ? (
                      <StatusBadge label="Dezactivat" tone="danger" />
                    ) : (
                      <StatusBadge label={WORKSPACE_ROLE_LABELS[member.role]} tone="accent" />
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    {canManage ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member, (value as WorkspaceRole) ?? member.role)
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className="h-7 w-36"
                          disabled={busyId === member.membershipId}
                        >
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
                      <span className="text-xs text-muted-soft">{WORKSPACE_ROLE_LABELS[member.role]}</span>
                    )}

                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={busyId === member.membershipId}
                            />
                          }
                        >
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.disabledAt ? (
                            <DropdownMenuItem
                              onClick={() =>
                                runAction(member.membershipId, () =>
                                  enableMemberAction(member.membershipId),
                                )
                              }
                            >
                              <ShieldCheck data-icon="inline-start" />
                              {t("modules.team.reactivate")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                runAction(member.membershipId, () =>
                                  disableMemberAction(member.membershipId),
                                )
                              }
                            >
                              <Ban data-icon="inline-start" />
                              {t("modules.team.deactivate")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => handleRemove(member)}>
                            <Trash2 data-icon="inline-start" />
                            {t("modules.team.removeFromWorkspace")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {canManage ? (
          <section className="space-y-3">
            <h2 className="font-heading text-lg font-medium text-foreground">
              {t("modules.team.pendingInvites", { count: invitations.length })}
            </h2>
            {invitations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("modules.team.noPendingInvites")}</p>
            ) : (
              <div className="surface-card divide-y divide-border overflow-hidden">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{invitation.email}</p>
                      <p className="text-xs text-muted-foreground">
                  {t("modules.team.roleSentExpires", {
                    role: WORKSPACE_ROLE_LABELS[invitation.role],
                    sent: formatDate(invitation.createdAt),
                    expires: formatDate(invitation.expiresAt),
                  })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === invitation.id}
                        onClick={() => handleResend(invitation)}
                      >
                        <Send data-icon="inline-start" />
                        Retrimite
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={busyId === invitation.id}
                        onClick={() => handleRevoke(invitation)}
                        aria-label={t("modules.team.revokeAria")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={() => router.refresh()}
      />
    </ModuleShell>
  );
}
