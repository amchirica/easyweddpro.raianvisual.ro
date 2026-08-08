import { addDaysDateString, todayDateString } from "@/lib/background/client";
import { notifyManagersIdempotent } from "@/lib/background/notify";
import type { BackgroundClient } from "@/lib/background/types";
import { DEFAULT_BATCH_SIZE, DEFAULT_MAX_PAGES } from "@/lib/background/types";

type TrialingSubscriptionRow = {
  workspace_id: string;
  trial_end: string | null;
  trial_ends_at: string | null;
};

function trialEndIso(row: TrialingSubscriptionRow): string | null {
  return row.trial_end ?? row.trial_ends_at ?? null;
}

function daysUntil(iso: string, today: string): number {
  const endDay = iso.slice(0, 10);
  const end = new Date(`${endDay}T00:00:00.000Z`).getTime();
  const start = new Date(`${today}T00:00:00.000Z`).getTime();
  return Math.round((end - start) / 86_400_000);
}

/**
 * Notifies managers when a Stripe trial ends within 3 days.
 * Idempotent per workspace + days-left bucket via notifyManagersIdempotent.
 */
export async function processTrialExpiringNotifications(
  supabase: BackgroundClient,
  options?: { batchSize?: number; maxPages?: number },
): Promise<{ processed: number; errors: number; metadata: Record<string, number> }> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  const today = todayDateString();
  const horizon = addDaysDateString(today, 3);

  let processed = 0;
  let errors = 0;
  let notified = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const { data, error } = await supabase
      .from("subscriptions")
      .select("workspace_id, trial_end, trial_ends_at")
      .eq("status", "trialing")
      .order("workspace_id", { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) throw new Error(error.message);
    const rows = (data ?? []) as TrialingSubscriptionRow[];
    if (!rows.length) break;

    for (const row of rows) {
      const endIso = trialEndIso(row);
      if (!endIso) continue;
      const endDay = endIso.slice(0, 10);
      if (endDay < today || endDay > horizon) continue;

      processed += 1;
      const daysLeft = Math.max(0, daysUntil(endIso, today));
      const body =
        daysLeft <= 1 ? "Trial-ul expiră mâine." : `Trial-ul expiră în ${daysLeft} zile.`;

      try {
        const inserted = await notifyManagersIdempotent(supabase, row.workspace_id, {
          type: "trial_expiring",
          title: "Trial aproape de expirare",
          body,
          entityType: "subscription",
          entityId: row.workspace_id,
          actionUrl: "/dashboard/billing",
          idempotencyKey: `trial_expiring:${row.workspace_id}:${daysLeft}d`,
        });
        notified += inserted;
      } catch (notifyError) {
        errors += 1;
        console.error(
          "[background.billing_reminders]",
          notifyError instanceof Error ? notifyError.message : notifyError,
        );
      }
    }

    if (rows.length < batchSize) break;
  }

  return {
    processed,
    errors,
    metadata: { notified, horizonDays: 3 },
  };
}
