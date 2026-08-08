"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { canCreateResource, getUsageForWorkspace } from "@/lib/billing/plans";
import type { WorkspaceRole } from "@/lib/constants";
import { hashPublicToken } from "@/lib/contracts/token";
import { sendWorkspaceEmail } from "@/lib/email/send";
import { renderInvitationEmail } from "@/lib/email/templates/transactional";
import { notifyRoleChanged, notifyTeamInvite } from "@/lib/notifications/events";
import {
  canChangeMemberRole,
  canDisableMember,
  canRemoveMember,
  countOwners,
  invitationExpiryDate,
} from "@/lib/team/rules";
import { changeMemberRoleSchema, inviteMemberSchema } from "@/lib/validations/team";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";

/** 32 random bytes, URL-safe — never logged raw, only the SHA-256 hash is persisted. */
function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function inviteMemberAction(
  input: unknown,
): Promise<ActionResult<{ invitePath: string; email: string }>> {
  const parsed = inviteMemberSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("members.manage");
    const usage = await getUsageForWorkspace(ctx.supabase, ctx.activeWorkspace.id);
    const limitCheck = canCreateResource(usage.plan, "user", usage);
    if (!limitCheck.ok) {
      return actionError(limitCheck.reason);
    }

    const email = parsed.data.email.trim().toLowerCase();

    await ctx.supabase
      .from("workspace_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("workspace_id", ctx.activeWorkspace.id)
      .eq("email", email)
      .is("accepted_at", null)
      .is("revoked_at", null);

    const token = generateInvitationToken();
    const tokenHash = hashPublicToken(token);
    const expiresAt = invitationExpiryDate().toISOString();

    const { data: invitation, error } = await ctx.supabase
      .from("workspace_invitations")
      .insert({
        workspace_id: ctx.activeWorkspace.id,
        email,
        role: parsed.data.role,
        token_hash: tokenHash,
        expires_at: expiresAt,
        invited_by: ctx.user.id,
      })
      .select("id")
      .single();

    if (error || !invitation) {
      if (process.env.NODE_ENV === "development") {
        console.error("[team.invite]", error?.message);
      }
      return actionError("Nu am putut crea invitația.");
    }

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "team_invitation",
      entityId: invitation.id,
      action: "invitation.created",
      title: "Invitație creată",
      description: email,
      metadata: { role: parsed.data.role, has_token: true },
    });

    const invitePath = `/invite/${token}`;

    void notifyTeamInvite(ctx.supabase, ctx.activeWorkspace.id, {
      id: invitation.id,
      email,
      invitedBy: ctx.user.id,
    });

    try {
      const { data: profile } = await ctx.supabase
        .from("profiles")
        .select("full_name")
        .eq("id", ctx.user.id)
        .maybeSingle();
      const inviterName = profile?.full_name?.trim() || ctx.user.email || "Un coleg";
      const rendered = renderInvitationEmail({
        workspaceName: ctx.activeWorkspace.name,
        inviterName,
        role: parsed.data.role,
        invitePath,
      });
      await sendWorkspaceEmail({
        supabase: ctx.supabase,
        workspaceId: ctx.activeWorkspace.id,
        to: email,
        template: "invitation",
        subject: rendered.subject,
        html: rendered.html,
        entityType: "invitation",
        entityId: invitation.id,
        idempotencyKey: `invitation:${invitation.id}`,
        metadata: { role: parsed.data.role },
      });
    } catch (emailError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[team.invite.email]", emailError);
      }
    }

    revalidatePath("/dashboard/team");
    return actionSuccess("Invitație creată. Copiază linkul și trimite-l colegului.", {
      invitePath,
      email,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a invita membri.");
    }
    return actionError("Nu am putut crea invitația.");
  }
}

export async function resendInvitationAction(
  invitationId: string,
): Promise<ActionResult<{ invitePath: string }>> {
  try {
    const ctx = await requireWorkspaceAction("members.manage");

    const { data: invitation } = await ctx.supabase
      .from("workspace_invitations")
      .select("id, email, accepted_at, revoked_at")
      .eq("id", invitationId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle();

    if (!invitation) return actionError("Invitația nu a fost găsită.");
    if (invitation.accepted_at) return actionError("Invitația a fost deja acceptată.");
    if (invitation.revoked_at) return actionError("Invitația a fost revocată. Creează una nouă.");

    const token = generateInvitationToken();
    const tokenHash = hashPublicToken(token);
    const expiresAt = invitationExpiryDate().toISOString();

    const { error } = await ctx.supabase
      .from("workspace_invitations")
      .update({ token_hash: tokenHash, expires_at: expiresAt })
      .eq("id", invitationId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut retrimite invitația.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "team_invitation",
      entityId: invitationId,
      action: "invitation.resent",
      title: "Invitație retrimisă",
      description: invitation.email,
      metadata: { has_token: true },
    });

    revalidatePath("/dashboard/team");
    return actionSuccess("Invitație retrimisă cu link nou.", { invitePath: `/invite/${token}` });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a retrimite invitații.");
    }
    return actionError("Nu am putut retrimite invitația.");
  }
}

export async function revokeInvitationAction(invitationId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("members.manage");

    const { data: invitation } = await ctx.supabase
      .from("workspace_invitations")
      .select("id, email, accepted_at")
      .eq("id", invitationId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle();

    if (!invitation) return actionError("Invitația nu a fost găsită.");
    if (invitation.accepted_at) return actionError("Invitația a fost deja acceptată.");

    const { error } = await ctx.supabase
      .from("workspace_invitations")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", invitationId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut revoca invitația.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "team_invitation",
      entityId: invitationId,
      action: "invitation.revoked",
      title: "Invitație revocată",
      description: invitation.email,
    });

    revalidatePath("/dashboard/team");
    return actionSuccess("Invitație revocată.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a revoca invitații.");
    }
    return actionError("Nu am putut revoca invitația.");
  }
}

async function fetchOwnerCount(
  supabase: Awaited<ReturnType<typeof requireWorkspaceAction>>["supabase"],
  workspaceId: string,
): Promise<number> {
  const { data } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId);
  return countOwners((data ?? []).map((row) => ({ role: row.role as WorkspaceRole })));
}

export async function changeMemberRoleAction(
  membershipId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = changeMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("members.manage");

    const { data: membership } = await ctx.supabase
      .from("workspace_members")
      .select("id, user_id, role")
      .eq("id", membershipId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle();

    if (!membership) return actionError("Membrul nu a fost găsit.");

    const ownerCount = await fetchOwnerCount(ctx.supabase, ctx.activeWorkspace.id);
    const check = canChangeMemberRole({
      actorRole: ctx.role,
      targetCurrentRole: membership.role as WorkspaceRole,
      nextRole: parsed.data.role,
      ownerCount,
      confirmOwnerTransfer: parsed.data.confirmOwnerTransfer,
    });
    if (!check.ok) return actionError(check.error);

    const { error } = await ctx.supabase
      .from("workspace_members")
      .update({ role: parsed.data.role })
      .eq("id", membershipId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut schimba rolul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "team_member",
      entityId: membershipId,
      action: "member.role_changed",
      title: "Rol membru actualizat",
      metadata: { from: membership.role, to: parsed.data.role },
    });

    void notifyRoleChanged(ctx.supabase, ctx.activeWorkspace.id, {
      userId: membership.user_id,
      role: parsed.data.role,
    });

    revalidatePath("/dashboard/team");
    revalidatePath(`/dashboard/team/${membershipId}`);
    return actionSuccess("Rol actualizat.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a schimba rolul membrilor.");
    }
    return actionError("Nu am putut schimba rolul.");
  }
}

export async function disableMemberAction(membershipId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("members.manage");

    const { data: membership } = await ctx.supabase
      .from("workspace_members")
      .select("id, role, disabled_at")
      .eq("id", membershipId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle();

    if (!membership) return actionError("Membrul nu a fost găsit.");
    if (membership.disabled_at) return actionSuccess("Membrul este deja dezactivat.");

    const ownerCount = await fetchOwnerCount(ctx.supabase, ctx.activeWorkspace.id);
    const check = canDisableMember({ targetRole: membership.role as WorkspaceRole, ownerCount });
    if (!check.ok) return actionError(check.error);

    const { error } = await ctx.supabase
      .from("workspace_members")
      .update({ disabled_at: new Date().toISOString() })
      .eq("id", membershipId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut dezactiva membrul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "team_member",
      entityId: membershipId,
      action: "member.disabled",
      title: "Membru dezactivat",
    });

    revalidatePath("/dashboard/team");
    revalidatePath(`/dashboard/team/${membershipId}`);
    return actionSuccess("Membru dezactivat.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a dezactiva membri.");
    }
    return actionError("Nu am putut dezactiva membrul.");
  }
}

export async function enableMemberAction(membershipId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("members.manage");

    const { data: membership } = await ctx.supabase
      .from("workspace_members")
      .select("id")
      .eq("id", membershipId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle();

    if (!membership) return actionError("Membrul nu a fost găsit.");

    const { error } = await ctx.supabase
      .from("workspace_members")
      .update({ disabled_at: null })
      .eq("id", membershipId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut reactiva membrul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "team_member",
      entityId: membershipId,
      action: "member.enabled",
      title: "Membru reactivat",
    });

    revalidatePath("/dashboard/team");
    revalidatePath(`/dashboard/team/${membershipId}`);
    return actionSuccess("Membru reactivat.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a reactiva membri.");
    }
    return actionError("Nu am putut reactiva membrul.");
  }
}

export async function removeMemberAction(membershipId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("members.manage");

    const { data: membership } = await ctx.supabase
      .from("workspace_members")
      .select("id, user_id, role")
      .eq("id", membershipId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle();

    if (!membership) return actionError("Membrul nu a fost găsit.");

    const ownerCount = await fetchOwnerCount(ctx.supabase, ctx.activeWorkspace.id);
    const check = canRemoveMember({
      actorUserId: ctx.user.id,
      targetUserId: membership.user_id,
      targetRole: membership.role as WorkspaceRole,
      ownerCount,
    });
    if (!check.ok) return actionError(check.error);

    const { error } = await ctx.supabase
      .from("workspace_members")
      .delete()
      .eq("id", membershipId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut elimina membrul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "team_member",
      entityId: membershipId,
      action: "member.removed",
      title: "Membru eliminat din workspace",
    });

    revalidatePath("/dashboard/team");
    return actionSuccess("Membru eliminat.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a elimina membri.");
    }
    return actionError("Nu am putut elimina membrul.");
  }
}
