/** Pure role-restriction helpers for team management (no I/O, easy to unit test). */

import type { WorkspaceRole } from "@/lib/constants";

export type RuleResult = { ok: true } | { ok: false; error: string };

function ok(): RuleResult {
  return { ok: true };
}

function fail(error: string): RuleResult {
  return { ok: false, error };
}

export function countOwners(members: { role: WorkspaceRole }[]): number {
  return members.filter((member) => member.role === "owner").length;
}

/**
 * "Owner cannot be removed by another member" + "cannot leave workspace without an owner".
 */
export function canRemoveMember(params: {
  actorUserId: string;
  targetUserId: string;
  targetRole: WorkspaceRole;
  ownerCount: number;
}): RuleResult {
  const { actorUserId, targetUserId, targetRole, ownerCount } = params;

  if (targetRole === "owner") {
    if (actorUserId !== targetUserId) {
      return fail("Un proprietar (owner) nu poate fi eliminat de un alt membru.");
    }
    if (ownerCount <= 1) {
      return fail("Workspace-ul trebuie să aibă cel puțin un proprietar.");
    }
  }

  return ok();
}

/**
 * "Admin cannot promote to owner without explicit confirmOwnerTransfer: true" +
 * "cannot leave workspace without an owner" when demoting the sole owner.
 */
export function canChangeMemberRole(params: {
  actorRole: WorkspaceRole;
  targetCurrentRole: WorkspaceRole;
  nextRole: WorkspaceRole;
  ownerCount: number;
  confirmOwnerTransfer?: boolean;
}): RuleResult {
  const { actorRole, targetCurrentRole, nextRole, ownerCount, confirmOwnerTransfer } = params;

  if (actorRole !== "owner" && actorRole !== "admin") {
    return fail("Nu ai permisiunea de a schimba rolul membrilor.");
  }

  if (nextRole === "owner" && targetCurrentRole !== "owner" && !confirmOwnerTransfer) {
    return fail("Confirmă explicit transferul de proprietate pentru a promova un membru la owner.");
  }

  if (targetCurrentRole === "owner" && nextRole !== "owner" && ownerCount <= 1) {
    return fail("Workspace-ul trebuie să aibă cel puțin un proprietar.");
  }

  return ok();
}

/** Cannot disable the workspace's last remaining owner. */
export function canDisableMember(params: {
  targetRole: WorkspaceRole;
  ownerCount: number;
}): RuleResult {
  if (params.targetRole === "owner" && params.ownerCount <= 1) {
    return fail("Nu poți dezactiva singurul proprietar al workspace-ului.");
  }
  return ok();
}

/** Invitations default to a 7-day expiry window. */
export const DEFAULT_INVITATION_TTL_DAYS = 7;

export function invitationExpiryDate(fromDate: Date = new Date()): Date {
  return new Date(fromDate.getTime() + DEFAULT_INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function isInvitationExpired(expiresAt: string, now: Date = new Date()): boolean {
  return new Date(expiresAt).getTime() < now.getTime();
}

/** Only owner/admin may invite members, and never directly as "owner". */
export function canInviteRole(role: WorkspaceRole): RuleResult {
  if (role === "owner") {
    return fail("Nu poți invita direct cu rolul owner. Transferă proprietatea după acceptare.");
  }
  return ok();
}
