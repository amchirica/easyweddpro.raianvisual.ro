import type { SupabaseClient } from "@supabase/supabase-js";

import { logActivity } from "@/lib/activity/log";
import { LEAD_STATUSES, PROJECT_STATUSES } from "@/lib/constants";
import { isResendConfigured, sendTransactionalEmail } from "@/lib/email/resend";
import type { Database, Json } from "@/types/database";
import {
  evaluateConditions,
  type AutomationAction,
  type AutomationCondition,
} from "@/lib/automations/catalog";

type AutomationsClient = SupabaseClient<Database>;
type AutomationRow = Database["public"]["Tables"]["automations"]["Row"];

export type RunAutomationsInput = {
  supabase: AutomationsClient;
  workspaceId: string;
  /** Free-form trigger key — validated loosely; unmatched triggers simply find zero automations. */
  triggerKey: string;
  entityId?: string | null;
  /** Acting user id, if any. Automations triggered by system jobs may omit this. */
  actorId?: string | null;
  metadata?: Record<string, unknown>;
  /**
   * Base idempotency key for this trigger occurrence (e.g. `contract_published:${contractId}`).
   * The engine derives a per-automation key so multiple automations on the same trigger don't
   * collide on the (workspace_id, idempotency_key) unique constraint.
   */
  idempotencyKey: string;
};

export type AutomationRunOutcome = "success" | "failed" | "skipped";

export type AutomationRunSummary = {
  automationId: string;
  automationName: string;
  status: AutomationRunOutcome;
  error?: string;
};

function buildRunKey(idempotencyKey: string, automationId: string): string {
  return `${idempotencyKey}::${automationId}`;
}

function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000);
}

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86_400_000);
}

function automationNote(
  notes: string | undefined,
  triggerKey: string,
  entityId: string | null,
): string {
  const context = `Generat automat — declanșator: ${triggerKey}${entityId ? ` (${entityId})` : ""}.`;
  return notes ? `${notes}\n\n${context}` : context;
}

async function executeAction(params: {
  supabase: AutomationsClient;
  workspaceId: string;
  actorId: string | null;
  entityId: string | null;
  triggerKey: string;
  action: AutomationAction;
}): Promise<void> {
  const { supabase, workspaceId, actorId, entityId, triggerKey, action } = params;

  switch (action.type) {
    case "create_task": {
      const dueDate =
        typeof action.dueInDays === "number"
          ? addDays(new Date(), action.dueInDays).toISOString().slice(0, 10)
          : null;
      const { error } = await supabase.from("tasks").insert({
        workspace_id: workspaceId,
        title: action.title,
        notes: automationNote(action.notes, triggerKey, entityId),
        due_date: dueDate,
        priority: action.priority ?? "normal",
        status: "todo",
        assignee_id: action.assigneeId ?? null,
        created_by: actorId,
      });
      if (error) throw new Error(`create_task: ${error.message}`);
      return;
    }
    case "create_reminder": {
      const startsAt = addMinutes(new Date(), action.offsetMinutes ?? 0);
      const endsAt = addMinutes(startsAt, 30);
      const { error } = await supabase.from("calendar_events").insert({
        workspace_id: workspaceId,
        title: action.title,
        event_type: "reminder",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "confirmed",
        notes: automationNote(action.notes, triggerKey, entityId),
        created_by: actorId,
      });
      if (error) throw new Error(`create_reminder: ${error.message}`);
      return;
    }
    case "change_status": {
      if (!entityId) throw new Error("change_status: missing entity id");

      if (action.entityType === "lead") {
        if (!(LEAD_STATUSES as readonly string[]).includes(action.toStatus)) {
          throw new Error(`change_status: invalid lead status "${action.toStatus}"`);
        }
        const { error } = await supabase
          .from("leads")
          .update({ status: action.toStatus, updated_at: new Date().toISOString() })
          .eq("id", entityId)
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null);
        if (error) throw new Error(`change_status: ${error.message}`);
        return;
      }

      if (action.entityType === "project") {
        if (!(PROJECT_STATUSES as readonly string[]).includes(action.toStatus)) {
          throw new Error(`change_status: invalid project status "${action.toStatus}"`);
        }
        const { error } = await supabase
          .from("projects")
          .update({ status: action.toStatus, updated_at: new Date().toISOString() })
          .eq("id", entityId)
          .eq("workspace_id", workspaceId)
          .is("deleted_at", null);
        if (error) throw new Error(`change_status: ${error.message}`);
        return;
      }

      throw new Error("change_status: unsupported entity type");
    }
    case "log_activity": {
      await logActivity(supabase, {
        workspaceId,
        actorId,
        entityType: "automation",
        entityId,
        action: `automation.${triggerKey}`,
        title: action.title,
        description: action.description ?? null,
      });
      return;
    }
    case "prepare_email": {
      await logActivity(supabase, {
        workspaceId,
        actorId,
        entityType: "automation",
        entityId,
        action: "automation.email_prepared",
        title: `Email pregătit: ${action.subject}`,
        description: "Emailul a fost pregătit, dar nu a fost trimis (acțiune prepare_email).",
        metadata: { subject: action.subject },
      });
      return;
    }
    case "send_email": {
      if (!isResendConfigured()) {
        await logActivity(supabase, {
          workspaceId,
          actorId,
          entityType: "automation",
          entityId,
          action: "automation.email_skipped",
          title: `Email neconfigurat: ${action.subject}`,
          description: "Resend nu este configurat (RESEND_API_KEY) — emailul nu a fost trimis.",
          metadata: { subject: action.subject, reason: "resend_not_configured" },
        });
        return;
      }
      if (!action.to) {
        await logActivity(supabase, {
          workspaceId,
          actorId,
          entityType: "automation",
          entityId,
          action: "automation.email_skipped",
          title: `Email fără destinatar: ${action.subject}`,
          description: "Nu a fost furnizată o adresă de email pentru destinatar.",
          metadata: { subject: action.subject, reason: "missing_recipient" },
        });
        return;
      }

      await sendTransactionalEmail({ to: action.to, subject: action.subject, html: action.body });
      await logActivity(supabase, {
        workspaceId,
        actorId,
        entityType: "automation",
        entityId,
        action: "automation.email_sent",
        title: `Email trimis: ${action.subject}`,
        metadata: { to: action.to },
      });
      return;
    }
    default:
      return;
  }
}

/**
 * Find enabled automations matching `triggerKey` for the workspace, run their
 * actions, and record one `automation_runs` row per automation (idempotent via
 * the unique (workspace_id, idempotency_key) constraint). Never throws —
 * callers can safely fire this without unwinding their primary transaction.
 */
export async function runAutomationsForTrigger(
  input: RunAutomationsInput,
): Promise<AutomationRunSummary[]> {
  const { supabase, workspaceId, triggerKey, entityId = null, actorId = null, metadata, idempotencyKey } = input;
  const summaries: AutomationRunSummary[] = [];

  let automations: AutomationRow[] = [];
  try {
    const { data, error } = await supabase
      .from("automations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("trigger_key", triggerKey)
      .eq("enabled", true)
      .is("deleted_at", null);
    if (error) throw error;
    automations = data ?? [];
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[automations.engine] failed to load automations", error);
    }
    return summaries;
  }

  if (!automations.length) return summaries;

  const metadataBag = (metadata ?? {}) as Record<string, unknown>;

  for (const automation of automations) {
    const conditions = Array.isArray(automation.conditions)
      ? (automation.conditions as unknown as AutomationCondition[])
      : [];

    if (conditions.length && !evaluateConditions(conditions, metadataBag)) {
      summaries.push({
        automationId: automation.id,
        automationName: automation.name,
        status: "skipped",
      });
      continue;
    }

    const runKey = buildRunKey(idempotencyKey, automation.id);
    const { data: run, error: insertError } = await supabase
      .from("automation_runs")
      .insert({
        automation_id: automation.id,
        workspace_id: workspaceId,
        trigger_key: triggerKey,
        status: "running",
        idempotency_key: runKey,
        metadata: metadataBag as Json,
      })
      .select("id")
      .single();

    if (insertError || !run) {
      // Unique violation → this automation already ran for this occurrence.
      if (insertError?.code === "23505") {
        summaries.push({
          automationId: automation.id,
          automationName: automation.name,
          status: "skipped",
        });
        continue;
      }
      summaries.push({
        automationId: automation.id,
        automationName: automation.name,
        status: "failed",
        error: insertError?.message ?? "run_insert_failed",
      });
      continue;
    }

    const actions = Array.isArray(automation.actions)
      ? (automation.actions as unknown as AutomationAction[])
      : [];

    let runError: string | null = null;
    try {
      for (const action of actions) {
        await executeAction({
          supabase,
          workspaceId,
          actorId,
          entityId,
          triggerKey,
          action,
        });
      }
    } catch (error) {
      runError = error instanceof Error ? error.message : "unknown_error";
    }

    await supabase
      .from("automation_runs")
      .update({
        status: runError ? "failed" : "success",
        error: runError,
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id);

    await supabase
      .from("automations")
      .update({ last_run_at: new Date().toISOString() })
      .eq("id", automation.id);

    summaries.push({
      automationId: automation.id,
      automationName: automation.name,
      status: runError ? "failed" : "success",
      error: runError ?? undefined,
    });
  }

  return summaries;
}
