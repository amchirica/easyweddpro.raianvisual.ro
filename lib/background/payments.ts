import {
  addDaysDateString,
  todayDateString,
} from "@/lib/background/client";
import { notifyManagersIdempotent } from "@/lib/background/notify";
import type { BackgroundClient } from "@/lib/background/types";
import { DEFAULT_BATCH_SIZE, DEFAULT_MAX_PAGES } from "@/lib/background/types";

export type PaymentBucket = "overdue" | "due_today" | "upcoming";

type PaymentRow = {
  id: string;
  workspace_id: string;
  label: string;
  amount: number;
  currency: string;
  due_date: string | null;
  status: string;
};

function classifyPayment(dueDate: string | null, today: string): PaymentBucket | null {
  if (!dueDate) return null;
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "due_today";
  const horizon = addDaysDateString(today, 7);
  if (dueDate <= horizon) return "upcoming";
  return null;
}

async function scanPaymentsPage(
  supabase: BackgroundClient,
  from: number,
  to: number,
): Promise<PaymentRow[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("id, workspace_id, label, amount, currency, due_date, status")
    .in("status", ["pending", "partial"])
    .is("deleted_at", null)
    .not("due_date", "is", null)
    .order("due_date", { ascending: true })
    .range(from, to);

  if (error) throw new Error(error.message);
  return (data ?? []) as PaymentRow[];
}

/**
 * Classifies open payments (overdue / due today / upcoming 7d) and creates
 * idempotent manager notifications. Emails are handled by processScheduledEmails.
 */
export async function processOverduePayments(
  supabase: BackgroundClient,
  options?: { batchSize?: number; maxPages?: number },
): Promise<{ processed: number; errors: number; metadata: Record<string, number> }> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  const today = todayDateString();

  let processed = 0;
  let errors = 0;
  const counts = { overdue: 0, due_today: 0, upcoming: 0, notified: 0 };

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const rows = await scanPaymentsPage(supabase, from, from + batchSize - 1);
    if (!rows.length) break;

    for (const payment of rows) {
      const bucket = classifyPayment(payment.due_date, today);
      if (!bucket) continue;
      counts[bucket] += 1;
      processed += 1;

      try {
        const title =
          bucket === "overdue"
            ? "Plată restantă"
            : bucket === "due_today"
              ? "Plată scadentă azi"
              : "Plată viitoare";
        const body = payment.label
          ? `„${payment.label}” — ${payment.amount} ${payment.currency}, scadență ${payment.due_date}.`
          : `Plată ${payment.amount} ${payment.currency}, scadență ${payment.due_date}.`;

        const inserted = await notifyManagersIdempotent(supabase, payment.workspace_id, {
          type: `payment_${bucket}`,
          title,
          body,
          entityType: "payment",
          entityId: payment.id,
          actionUrl: "/dashboard/payments",
          idempotencyKey: `payment_${bucket}:${payment.id}:${today}`,
          metadata: {
            amount: payment.amount,
            currency: payment.currency,
            due_date: payment.due_date,
            bucket,
          },
        });
        counts.notified += inserted;
      } catch (error) {
        errors += 1;
        console.error(
          "[background.payments]",
          payment.id,
          error instanceof Error ? error.message : "failed",
        );
      }
    }

    if (rows.length < batchSize) break;
  }

  return { processed, errors, metadata: counts };
}
