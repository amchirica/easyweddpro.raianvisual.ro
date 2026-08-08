import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createNotification,
  notifyWorkspaceManagers,
} from "@/lib/notifications/create";
import type { Database, Json } from "@/types/database";

type Client = SupabaseClient<Database>;

export type NotificationEventType =
  | "lead_new"
  | "proposal_accepted"
  | "proposal_rejected"
  | "contract_accepted"
  | "payment_due"
  | "payment_overdue"
  | "task_assigned"
  | "task_overdue"
  | "event_upcoming"
  | "team_invite"
  | "role_changed"
  | "automation_failure"
  | "webhook_failure"
  | "subscription_payment_failed"
  | "trial_expiring";

type EventNotifyInput = {
  supabase: Client;
  workspaceId: string;
  type: NotificationEventType;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  /** Stable key — duplicates are ignored via unique index. */
  idempotencyKey: string;
  metadata?: Record<string, Json | undefined>;
  /** When set, notify this user only instead of workspace managers. */
  userId?: string;
};

/**
 * Create an in-app notification for managers (or a single user).
 * Never throws — product flows must not fail because of notifications.
 */
export async function notifyEvent(input: EventNotifyInput): Promise<void> {
  try {
    if (input.userId) {
      await createNotification({
        supabase: input.supabase,
        workspaceId: input.workspaceId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
        actionUrl: input.actionUrl,
        idempotencyKey: input.idempotencyKey,
        metadata: input.metadata,
      });
      return;
    }

    await notifyWorkspaceManagers(input.supabase, input.workspaceId, {
      type: input.type,
      title: input.title,
      body: input.body,
      entityType: input.entityType,
      entityId: input.entityId,
      actionUrl: input.actionUrl,
      idempotencyKey: input.idempotencyKey,
      metadata: input.metadata,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[notifications.notifyEvent]", error);
    }
  }
}

export async function notifyLeadCreated(
  supabase: Client,
  workspaceId: string,
  lead: { id: string; name: string },
): Promise<void> {
  await notifyEvent({
    supabase,
    workspaceId,
    type: "lead_new",
    title: "Lead nou",
    body: lead.name,
    entityType: "lead",
    entityId: lead.id,
    actionUrl: `/dashboard/leads/${lead.id}`,
    idempotencyKey: `lead_new:${lead.id}`,
  });
}

export async function notifyProposalDecision(
  supabase: Client,
  workspaceId: string,
  proposal: { id: string; title: string | null },
  decision: "accepted" | "rejected",
): Promise<void> {
  const accepted = decision === "accepted";
  await notifyEvent({
    supabase,
    workspaceId,
    type: accepted ? "proposal_accepted" : "proposal_rejected",
    title: accepted ? "Ofertă acceptată" : "Ofertă refuzată",
    body: proposal.title ?? undefined,
    entityType: "proposal",
    entityId: proposal.id,
    actionUrl: `/dashboard/proposals/${proposal.id}`,
    idempotencyKey: `proposal_${decision}:${proposal.id}`,
  });
}

export async function notifyContractAccepted(
  supabase: Client,
  workspaceId: string,
  contract: { id: string; title: string | null },
): Promise<void> {
  await notifyEvent({
    supabase,
    workspaceId,
    type: "contract_accepted",
    title: "Contract acceptat",
    body: contract.title ?? undefined,
    entityType: "contract",
    entityId: contract.id,
    actionUrl: `/dashboard/contracts/${contract.id}`,
    idempotencyKey: `contract_accepted:${contract.id}`,
  });
}

export async function notifyTaskAssigned(
  supabase: Client,
  workspaceId: string,
  task: { id: string; title: string; assigneeId: string },
): Promise<void> {
  await notifyEvent({
    supabase,
    workspaceId,
    userId: task.assigneeId,
    type: "task_assigned",
    title: "Task atribuit",
    body: task.title,
    entityType: "task",
    entityId: task.id,
    actionUrl: `/dashboard/tasks?task=${task.id}`,
    idempotencyKey: `task_assigned:${task.id}:${task.assigneeId}`,
  });
}

export async function notifyTeamInvite(
  supabase: Client,
  workspaceId: string,
  invite: { id: string; email: string; invitedBy: string },
): Promise<void> {
  await notifyEvent({
    supabase,
    workspaceId,
    userId: invite.invitedBy,
    type: "team_invite",
    title: "Invitație echipă trimisă",
    body: invite.email,
    entityType: "invitation",
    entityId: invite.id,
    actionUrl: "/dashboard/team",
    idempotencyKey: `team_invite:${invite.id}`,
  });
}

export async function notifyRoleChanged(
  supabase: Client,
  workspaceId: string,
  member: { userId: string; role: string },
): Promise<void> {
  await notifyEvent({
    supabase,
    workspaceId,
    userId: member.userId,
    type: "role_changed",
    title: "Rol actualizat",
    body: `Noul rol: ${member.role}`,
    entityType: "member",
    entityId: member.userId,
    actionUrl: "/dashboard/team",
    idempotencyKey: `role_changed:${workspaceId}:${member.userId}:${member.role}`,
  });
}

export async function notifyAutomationFailure(
  supabase: Client,
  workspaceId: string,
  automation: { id: string; name: string; error?: string },
): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  await notifyEvent({
    supabase,
    workspaceId,
    type: "automation_failure",
    title: "Automatizare eșuată",
    body: automation.error
      ? `${automation.name}: ${automation.error}`
      : automation.name,
    entityType: "automation",
    entityId: automation.id,
    actionUrl: `/dashboard/automations/${automation.id}`,
    idempotencyKey: `automation_failure:${automation.id}:${day}`,
  });
}

export async function notifySubscriptionPaymentFailed(
  supabase: Client,
  workspaceId: string,
): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  await notifyEvent({
    supabase,
    workspaceId,
    type: "subscription_payment_failed",
    title: "Plată abonament eșuată",
    body: "Actualizează metoda de plată pentru a evita întreruperea serviciului.",
    entityType: "subscription",
    entityId: workspaceId,
    actionUrl: "/dashboard/billing",
    idempotencyKey: `subscription_payment_failed:${workspaceId}:${day}`,
  });
}

export async function notifyTrialExpiring(
  supabase: Client,
  workspaceId: string,
  daysLeft: number,
): Promise<void> {
  await notifyEvent({
    supabase,
    workspaceId,
    type: "trial_expiring",
    title: "Trial aproape de expirare",
    body: daysLeft <= 1
      ? "Trial-ul expiră mâine."
      : `Trial-ul expiră în ${daysLeft} zile.`,
    entityType: "subscription",
    entityId: workspaceId,
    actionUrl: "/dashboard/billing",
    idempotencyKey: `trial_expiring:${workspaceId}:${daysLeft}d`,
  });
}

export async function notifyWebhookFailure(
  supabase: Client,
  workspaceId: string,
  detail: string,
): Promise<void> {
  const day = new Date().toISOString().slice(0, 10);
  await notifyEvent({
    supabase,
    workspaceId,
    type: "webhook_failure",
    title: "Eroare webhook Stripe",
    body: detail,
    entityType: "webhook",
    entityId: workspaceId,
    actionUrl: "/dashboard/billing",
    idempotencyKey: `webhook_failure:${workspaceId}:${day}`,
  });
}
