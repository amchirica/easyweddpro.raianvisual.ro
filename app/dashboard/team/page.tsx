import type { Metadata } from "next";

import {
  TeamPageClient,
  type TeamInvitationItem,
  type TeamMemberItem,
} from "@/components/team/team-page-client";
import { listMembers, listPendingInvitations } from "@/lib/data/team";
import type { WorkspaceRole } from "@/lib/constants";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Echipă · EasyWedd Pro",
};

export default async function TeamPage() {
  const ctx = await getWorkspaceOrDemo();
  const permissions = permissionsForRole(ctx.role);

  let members: TeamMemberItem[] = [];
  let invitations: TeamInvitationItem[] = [];
  let error: string | null = null;

  try {
    const [memberRows, invitationRows] = await Promise.all([
      listMembers(ctx.supabase, ctx.workspace.id),
      permissions.canManageMembers
        ? listPendingInvitations(ctx.supabase, ctx.workspace.id)
        : Promise.resolve([]),
    ]);

    members = memberRows.map((row) => ({
      membershipId: row.membershipId,
      userId: row.userId,
      role: row.role as WorkspaceRole,
      disabledAt: row.disabledAt,
      memberSince: row.memberSince,
      fullName: row.fullName,
    }));

    invitations = invitationRows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role as WorkspaceRole,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      // Client computes "expired" from expiresAt to keep this render pure.
      expired: false,
    }));
  } catch (err) {
    error = err instanceof Error ? err.message : "Nu am putut încărca echipa.";
  }

  return (
    <TeamPageClient
      members={members}
      invitations={invitations}
      canManage={permissions.canManageMembers}
      currentUserId={ctx.user.id}
      error={error}
    />
  );
}
