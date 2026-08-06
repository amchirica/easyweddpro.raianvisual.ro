import {
  addDaysDateString,
  isResendConfiguredForJobs,
  todayDateString,
} from "@/lib/background/client";
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_PAGES,
  type BackgroundClient,
} from "@/lib/background/types";

const userEmailCache = new Map<string, string | null>();

async function resolveUserEmail(
  supabase: BackgroundClient,
  userId: string,
): Promise<string | null> {
  if (userEmailCache.has(userId)) return userEmailCache.get(userId) ?? null;
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data.user?.email) {
      userEmailCache.set(userId, null);
      return null;
    }
    const email = data.user.email.toLowerCase();
    userEmailCache.set(userId, email);
    return email;
  } catch {
    userEmailCache.set(userId, null);
    return null;
  }
}

async function loadManagerEmails(
  supabase: BackgroundClient,
  workspaceId: string,
): Promise<string[]> {
  const { data: members } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .in("role", ["owner", "admin", "manager"])
    .is("disabled_at", null);

  if (!members?.length) return [];

  const emails: string[] = [];
  for (const member of members) {
    const email = await resolveUserEmail(supabase, member.user_id);
    if (email) emails.push(email);
  }
  return [...new Set(emails)];
}

async function sendIdempotentEmail(
  supabase: BackgroundClient,
  input: {
    workspaceId: string;
    to: string;
    template: string;
    subject: string;
    html: string;
    entityType: string;
    entityId: string;
    idempotencyKey: string;
  },
): Promise<"sent" | "skipped" | "failed" | "duplicate"> {
  const { data: existing } = await supabase
    .from("email_deliveries")
    .select("id, status")
    .eq("idempotency_key", input.idempotencyKey)
    .maybeSingle();

  if (existing) return "duplicate";

  const { data: pending, error: insertError } = await supabase
    .from("email_deliveries")
    .insert({
      workspace_id: input.workspaceId,
      recipient: input.to,
      template: input.template,
      entity_type: input.entityType,
      entity_id: input.entityId,
      status: "pending",
      idempotency_key: input.idempotencyKey,
      metadata: {},
    })
    .select("id")
    .single();

  if (insertError || !pending) {
    if (insertError?.code === "23505") return "duplicate";
    return "failed";
  }

  if (!isResendConfiguredForJobs()) {
    await supabase
      .from("email_deliveries")
      .update({ status: "skipped", error_message: "resend_not_configured" })
      .eq("id", pending.id);
    return "skipped";
  }

  try {
    const apiKey = process.env.RESEND_API_KEY!.trim();
    const fromEmail =
      process.env.RESEND_FROM_EMAIL?.trim() || "notificari@easyweddpro.raianvisual.ro";
    const fromName = process.env.RESEND_FROM_NAME?.trim() || "EasyWedd Pro";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      await supabase
        .from("email_deliveries")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
          error_message: text.slice(0, 200),
        })
        .eq("id", pending.id);
      return "failed";
    }

    const payload = (await response.json()) as { id?: string };
    await supabase
      .from("email_deliveries")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: payload.id ?? null,
      })
      .eq("id", pending.id);
    return "sent";
  } catch (error) {
    await supabase
      .from("email_deliveries")
      .update({
        status: "failed",
        failed_at: new Date().toISOString(),
        error_message: error instanceof Error ? error.message.slice(0, 200) : "send_failed",
      })
      .eq("id", pending.id);
    return "failed";
  }
}

function reminderHtml(heading: string, body: string): string {
  return `<!doctype html><html lang="ro"><body style="font-family:Georgia,serif;background:#0b0b0c;color:#f5f5f4;padding:24px">
  <h1 style="font-weight:500">${heading}</h1>
  <p style="color:#a8a29e;line-height:1.5">${body}</p>
  <p style="color:#78716c;font-size:12px">EasyWedd Pro · notificare automată</p>
  </body></html>`;
}

type CountKey = "sent" | "skipped" | "duplicate" | "failed";

async function fanOut(
  supabase: BackgroundClient,
  workspaceId: string,
  emailCache: Map<string, string[]>,
  payload: Omit<Parameters<typeof sendIdempotentEmail>[1], "to" | "workspaceId">,
  counts: Record<CountKey, number>,
): Promise<{ processed: number; errors: number }> {
  let cached = emailCache.get(workspaceId);
  if (!cached) {
    cached = await loadManagerEmails(supabase, workspaceId);
    emailCache.set(workspaceId, cached);
  }

  let processed = 0;
  let errors = 0;
  for (const to of cached) {
    processed += 1;
    const result = await sendIdempotentEmail(supabase, {
      ...payload,
      workspaceId,
      to,
      idempotencyKey: `${payload.idempotencyKey}:${to}`,
    });
    counts[result] += 1;
    if (result === "failed") errors += 1;
  }
  return { processed, errors };
}

/**
 * Scheduled reminder emails for payments, proposals, contracts, events, tasks.
 * Deduped via email_deliveries.idempotency_key.
 */
export async function processScheduledEmails(
  supabase: BackgroundClient,
  options?: { batchSize?: number; maxPages?: number },
): Promise<{ processed: number; errors: number; metadata: Record<string, number> }> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  const today = todayDateString();
  const tomorrow = addDaysDateString(today, 1);
  const in7 = addDaysDateString(today, 7);

  let processed = 0;
  let errors = 0;
  const counts: Record<CountKey, number> = {
    sent: 0,
    skipped: 0,
    duplicate: 0,
    failed: 0,
  };
  const emailCache = new Map<string, string[]>();

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const { data, error } = await supabase
      .from("payments")
      .select("id, workspace_id, label, amount, currency, due_date")
      .in("status", ["pending", "partial"])
      .is("deleted_at", null)
      .lte("due_date", today)
      .order("due_date", { ascending: true })
      .range(from, from + batchSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (!rows.length) break;

    for (const payment of rows) {
      if (!payment.due_date) continue;
      const kind = payment.due_date < today ? "overdue" : "due_today";
      const fan = await fanOut(
        supabase,
        payment.workspace_id,
        emailCache,
        {
          template: `payment_reminder_${kind}`,
          subject:
            kind === "overdue"
              ? `Plată restantă: ${payment.label || "fără etichetă"}`
              : `Plată scadentă azi: ${payment.label || "fără etichetă"}`,
          html: reminderHtml(
            kind === "overdue" ? "Plată restantă" : "Plată scadentă azi",
            `${payment.label || "Plată"} — ${payment.amount} ${payment.currency}, scadență ${payment.due_date}.`,
          ),
          entityType: "payment",
          entityId: payment.id,
          idempotencyKey: `email:payment_${kind}:${payment.id}:${today}`,
        },
        counts,
      );
      processed += fan.processed;
      errors += fan.errors;
    }
    if (rows.length < batchSize) break;
  }

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const { data, error } = await supabase
      .from("proposals")
      .select("id, workspace_id, title, valid_until")
      .eq("status", "sent")
      .is("deleted_at", null)
      .not("valid_until", "is", null)
      .lte("valid_until", in7)
      .order("valid_until", { ascending: true })
      .range(from, from + batchSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (!rows.length) break;

    for (const proposal of rows) {
      const fan = await fanOut(
        supabase,
        proposal.workspace_id,
        emailCache,
        {
          template: "proposal_reminder",
          subject: `Reminder ofertă: ${proposal.title}`,
          html: reminderHtml(
            "Reminder ofertă",
            `Oferta „${proposal.title}” este încă în așteptare (valabilă până la ${proposal.valid_until}).`,
          ),
          entityType: "proposal",
          entityId: proposal.id,
          idempotencyKey: `email:proposal_reminder:${proposal.id}:${today}`,
        },
        counts,
      );
      processed += fan.processed;
      errors += fan.errors;
    }
    if (rows.length < batchSize) break;
  }

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const { data, error } = await supabase
      .from("contracts")
      .select("id, workspace_id, title")
      .in("status", ["published", "viewed"])
      .is("deleted_at", null)
      .order("updated_at", { ascending: true })
      .range(from, from + batchSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (!rows.length) break;

    for (const contract of rows) {
      const fan = await fanOut(
        supabase,
        contract.workspace_id,
        emailCache,
        {
          template: "contract_reminder",
          subject: `Reminder contract: ${contract.title}`,
          html: reminderHtml(
            "Reminder contract",
            `Contractul „${contract.title}” așteaptă semnare.`,
          ),
          entityType: "contract",
          entityId: contract.id,
          idempotencyKey: `email:contract_reminder:${contract.id}:${today}`,
        },
        counts,
      );
      processed += fan.processed;
      errors += fan.errors;
    }
    if (rows.length < batchSize) break;
  }

  {
    const fromIso = `${tomorrow}T00:00:00.000Z`;
    const toIso = `${tomorrow}T23:59:59.999Z`;
    const { data, error } = await supabase
      .from("calendar_events")
      .select("id, workspace_id, title")
      .gte("starts_at", fromIso)
      .lte("starts_at", toIso)
      .neq("status", "cancelled")
      .is("deleted_at", null)
      .limit(batchSize);
    if (error) throw new Error(error.message);
    for (const event of data ?? []) {
      const fan = await fanOut(
        supabase,
        event.workspace_id,
        emailCache,
        {
          template: "event_reminder",
          subject: `Eveniment mâine: ${event.title}`,
          html: reminderHtml("Reminder eveniment", `„${event.title}” începe mâine.`),
          entityType: "calendar_event",
          entityId: event.id,
          idempotencyKey: `email:event_reminder:${event.id}:${tomorrow}`,
        },
        counts,
      );
      processed += fan.processed;
      errors += fan.errors;
    }
  }

  {
    const { data, error } = await supabase
      .from("tasks")
      .select("id, workspace_id, title")
      .eq("due_date", today)
      .not("status", "in", '("done","cancelled")')
      .is("deleted_at", null)
      .limit(batchSize);
    if (error) throw new Error(error.message);
    for (const task of data ?? []) {
      const fan = await fanOut(
        supabase,
        task.workspace_id,
        emailCache,
        {
          template: "task_reminder",
          subject: `Task azi: ${task.title}`,
          html: reminderHtml("Reminder task", `„${task.title}” este scadent azi.`),
          entityType: "task",
          entityId: task.id,
          idempotencyKey: `email:task_reminder:${task.id}:${today}`,
        },
        counts,
      );
      processed += fan.processed;
      errors += fan.errors;
    }
  }

  return { processed, errors, metadata: counts };
}
