import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isResendConfigured, sendTransactionalEmail } from "@/lib/email/resend";
import type { Database, Json } from "@/types/database";

type EmailClient = SupabaseClient<Database>;
type EmailDeliveryRow = Database["public"]["Tables"]["email_deliveries"]["Row"];

export type SendWorkspaceEmailInput = {
  supabase: EmailClient;
  /** Null for platform-level emails not tied to a workspace (rare). */
  workspaceId: string | null;
  to: string;
  template: string;
  subject: string;
  html: string;
  entityType?: string | null;
  entityId?: string | null;
  /**
   * Caller-provided idempotency key (e.g. `invitation:${invitationId}`). Enforced by a
   * unique index on email_deliveries.idempotency_key — retries never double-send.
   */
  idempotencyKey: string;
  metadata?: Record<string, Json | undefined>;
};

export type SendWorkspaceEmailResult = {
  status: EmailDeliveryRow["status"];
  deliveryId: string | null;
  providerMessageId: string | null;
  error?: string;
};

function cleanMetadata(metadata?: Record<string, Json | undefined>): Json {
  return Object.fromEntries(
    Object.entries(metadata ?? {}).filter(([, value]) => value !== undefined),
  ) as Json;
}

/**
 * Journal-backed transactional email sender.
 *
 * - Idempotent: a repeated call with the same `idempotencyKey` never re-sends — it returns
 *   the outcome of the original attempt.
 * - Never claims a send succeeded when Resend isn't configured (`status: "skipped"`).
 * - Always records the attempt in `email_deliveries`, even on failure, for support/debugging.
 */
export async function sendWorkspaceEmail(
  input: SendWorkspaceEmailInput,
): Promise<SendWorkspaceEmailResult> {
  const { supabase, workspaceId, to, template, subject, html, entityType, entityId, idempotencyKey } =
    input;

  const { data: existing } = await supabase
    .from("email_deliveries")
    .select("id, status, provider_message_id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    return {
      status: existing.status as EmailDeliveryRow["status"],
      deliveryId: existing.id,
      providerMessageId: existing.provider_message_id,
    };
  }

  const { data: pending, error: insertError } = await supabase
    .from("email_deliveries")
    .insert({
      workspace_id: workspaceId,
      recipient: to,
      template,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      status: "pending",
      idempotency_key: idempotencyKey,
      metadata: cleanMetadata(input.metadata),
    })
    .select("id")
    .single();

  if (insertError || !pending) {
    // Unique violation → a concurrent call already created the journal row; fetch its outcome.
    if (insertError?.code === "23505") {
      const { data: raced } = await supabase
        .from("email_deliveries")
        .select("id, status, provider_message_id")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (raced) {
        return {
          status: raced.status as EmailDeliveryRow["status"],
          deliveryId: raced.id,
          providerMessageId: raced.provider_message_id,
        };
      }
    }
    return {
      status: "failed",
      deliveryId: null,
      providerMessageId: null,
      error: insertError?.message ?? "email_delivery_insert_failed",
    };
  }

  if (!isResendConfigured()) {
    await supabase
      .from("email_deliveries")
      .update({
        status: "skipped",
        error_message: "resend_not_configured",
      })
      .eq("id", pending.id);

    return { status: "skipped", deliveryId: pending.id, providerMessageId: null };
  }

  try {
    const { providerMessageId } = await sendTransactionalEmail({ to, subject, html });
    await supabase
      .from("email_deliveries")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: providerMessageId,
      })
      .eq("id", pending.id);

    return { status: "sent", deliveryId: pending.id, providerMessageId };
  } catch (error) {
    const message = error instanceof Error ? error.message : "resend_send_failed";
    await supabase
      .from("email_deliveries")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", pending.id);

    if (process.env.NODE_ENV === "development") {
      console.error("[email.send]", template, message);
    }

    return { status: "failed", deliveryId: pending.id, providerMessageId: null, error: message };
  }
}
