import {
  addDaysDateString,
  todayDateString,
} from "@/lib/background/client";
import { notifyManagersIdempotent } from "@/lib/background/notify";
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_PAGES,
  EVENT_REMINDER_DAYS,
  type BackgroundClient,
} from "@/lib/background/types";

type EventRow = {
  id: string;
  workspace_id: string;
  title: string;
  starts_at: string;
  event_type: string;
};

function daysUntil(startsAt: string, today: string): number | null {
  const startDay = startsAt.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDay)) return null;
  const start = Date.parse(`${startDay}T00:00:00.000Z`);
  const base = Date.parse(`${today}T00:00:00.000Z`);
  if (Number.isNaN(start) || Number.isNaN(base)) return null;
  return Math.round((start - base) / 86_400_000);
}

/**
 * Find events starting in 30/14/7/3/1 days and create idempotent notifications.
 */
export async function processUpcomingEvents(
  supabase: BackgroundClient,
  options?: { batchSize?: number; maxPages?: number },
): Promise<{ processed: number; errors: number; metadata: Record<string, number> }> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  const today = todayDateString();
  const horizon = addDaysDateString(today, 30);
  const fromIso = `${today}T00:00:00.000Z`;
  const toIso = `${horizon}T23:59:59.999Z`;

  let processed = 0;
  let errors = 0;
  let notified = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const { data, error } = await supabase
      .from("calendar_events")
      .select("id, workspace_id, title, starts_at, event_type")
      .gte("starts_at", fromIso)
      .lte("starts_at", toIso)
      .neq("status", "cancelled")
      .is("deleted_at", null)
      .order("starts_at", { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw new Error(error.message);
    const rows = (data ?? []) as EventRow[];
    if (!rows.length) break;

    for (const event of rows) {
      const delta = daysUntil(event.starts_at, today);
      if (delta == null || !(EVENT_REMINDER_DAYS as readonly number[]).includes(delta)) {
        continue;
      }
      processed += 1;

      try {
        const inserted = await notifyManagersIdempotent(supabase, event.workspace_id, {
          type: "event_upcoming",
          title: `Eveniment în ${delta} ${delta === 1 ? "zi" : "zile"}`,
          body: `„${event.title}” începe pe ${event.starts_at.slice(0, 10)}.`,
          entityType: "calendar_event",
          entityId: event.id,
          actionUrl: "/dashboard/calendar",
          idempotencyKey: `event_upcoming:${event.id}:${delta}d`,
          metadata: { days: delta, starts_at: event.starts_at, event_type: event.event_type },
        });
        notified += inserted;
      } catch (err) {
        errors += 1;
        console.error(
          "[background.events]",
          event.id,
          err instanceof Error ? err.message : "failed",
        );
      }
    }

    if (rows.length < batchSize) break;
  }

  return { processed, errors, metadata: { notified } };
}
