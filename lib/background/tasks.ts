import { addDaysDateString, todayDateString } from "@/lib/background/client";
import { notifyManagersIdempotent } from "@/lib/background/notify";
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_PAGES,
  type BackgroundClient,
} from "@/lib/background/types";

type TaskRow = {
  id: string;
  workspace_id: string;
  title: string;
  due_date: string | null;
  assignee_id: string | null;
};

/**
 * Reminders for overdue tasks + tasks due tomorrow.
 */
export async function processTaskReminders(
  supabase: BackgroundClient,
  options?: { batchSize?: number; maxPages?: number },
): Promise<{ processed: number; errors: number; metadata: Record<string, number> }> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  const today = todayDateString();
  const tomorrow = addDaysDateString(today, 1);

  let processed = 0;
  let errors = 0;
  let notified = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const { data, error } = await supabase
      .from("tasks")
      .select("id, workspace_id, title, due_date, assignee_id")
      .not("status", "in", '("done","cancelled")')
      .is("deleted_at", null)
      .not("due_date", "is", null)
      .lte("due_date", tomorrow)
      .order("due_date", { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw new Error(error.message);
    const rows = (data ?? []) as TaskRow[];
    if (!rows.length) break;

    for (const task of rows) {
      if (!task.due_date) continue;
      const kind = task.due_date < today ? "overdue" : task.due_date === today ? "due_today" : "due_tomorrow";
      if (kind === "due_tomorrow" && task.due_date !== tomorrow) continue;

      processed += 1;
      try {
        const title =
          kind === "overdue"
            ? "Task întârziat"
            : kind === "due_today"
              ? "Task scadent azi"
              : "Reminder task mâine";
        const inserted = await notifyManagersIdempotent(supabase, task.workspace_id, {
          type: `task_${kind}`,
          title,
          body: `„${task.title}” — termen ${task.due_date}.`,
          entityType: "task",
          entityId: task.id,
          actionUrl: "/dashboard/tasks",
          idempotencyKey: `task_${kind}:${task.id}:${today}`,
          metadata: { due_date: task.due_date, kind },
        });
        notified += inserted;

        // Also notify assignee once, if different from managers path (managers already covered).
        if (task.assignee_id) {
          const key = `task_${kind}:${task.id}:${today}:${task.assignee_id}`;
          const { error: insertError } = await supabase.from("notifications").insert({
            workspace_id: task.workspace_id,
            user_id: task.assignee_id,
            type: `task_${kind}`,
            title,
            body: `„${task.title}” — termen ${task.due_date}.`,
            entity_type: "task",
            entity_id: task.id,
            action_url: "/dashboard/tasks",
            idempotency_key: key,
            metadata: { due_date: task.due_date, kind },
          });
          if (!insertError) notified += 1;
          else if (insertError.code !== "23505") {
            console.error("[background.tasks.assignee]", insertError.message);
          }
        }
      } catch (err) {
        errors += 1;
        console.error(
          "[background.tasks]",
          task.id,
          err instanceof Error ? err.message : "failed",
        );
      }
    }

    if (rows.length < batchSize) break;
  }

  return { processed, errors, metadata: { notified } };
}
