import { runAutomationsForTrigger } from "@/lib/automations/engine";
import { todayDateString } from "@/lib/background/client";
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_PAGES,
  type BackgroundClient,
} from "@/lib/background/types";

/**
 * Fire workspace automations for overdue payments/tasks (idempotent per day).
 */
export async function runAutomations(
  supabase: BackgroundClient,
  options?: { batchSize?: number; maxPages?: number },
): Promise<{ processed: number; errors: number; metadata: Record<string, number> }> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  const today = todayDateString();

  let processed = 0;
  let errors = 0;
  let paymentTriggers = 0;
  let taskTriggers = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const { data, error } = await supabase
      .from("payments")
      .select("id, workspace_id, amount, currency, due_date")
      .in("status", ["pending", "partial"])
      .lt("due_date", today)
      .is("deleted_at", null)
      .order("due_date", { ascending: true })
      .range(from, from + batchSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (!rows.length) break;

    for (const payment of rows) {
      processed += 1;
      try {
        await runAutomationsForTrigger({
          supabase,
          workspaceId: payment.workspace_id,
          triggerKey: "payment_overdue",
          entityId: payment.id,
          idempotencyKey: `payment_overdue:${payment.id}:${today}`,
          metadata: {
            amount: payment.amount,
            currency: payment.currency,
            dueDate: payment.due_date,
          },
        });
        paymentTriggers += 1;
      } catch (err) {
        errors += 1;
        console.error(
          "[background.automations.payment]",
          payment.id,
          err instanceof Error ? err.message : "failed",
        );
      }
    }
    if (rows.length < batchSize) break;
  }

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const { data, error } = await supabase
      .from("tasks")
      .select("id, workspace_id, title, due_date")
      .not("status", "in", '("done","cancelled")')
      .lt("due_date", today)
      .is("deleted_at", null)
      .order("due_date", { ascending: true })
      .range(from, from + batchSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (!rows.length) break;

    for (const task of rows) {
      processed += 1;
      try {
        await runAutomationsForTrigger({
          supabase,
          workspaceId: task.workspace_id,
          triggerKey: "task_overdue",
          entityId: task.id,
          idempotencyKey: `task_overdue:${task.id}:${today}`,
          metadata: { title: task.title, dueDate: task.due_date },
        });
        taskTriggers += 1;
      } catch (err) {
        errors += 1;
        console.error(
          "[background.automations.task]",
          task.id,
          err instanceof Error ? err.message : "failed",
        );
      }
    }
    if (rows.length < batchSize) break;
  }

  return {
    processed,
    errors,
    metadata: { paymentTriggers, taskTriggers },
  };
}
