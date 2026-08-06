import { addDaysDateString, todayDateString } from "@/lib/background/client";
import { notifyManagersIdempotent } from "@/lib/background/notify";
import {
  DEFAULT_BATCH_SIZE,
  DEFAULT_MAX_PAGES,
  type BackgroundClient,
} from "@/lib/background/types";

/**
 * Scheduled in-app notifications not covered by payments/events/tasks jobs
 * (e.g. proposals/contracts awaiting action).
 */
export async function processScheduledNotifications(
  supabase: BackgroundClient,
  options?: { batchSize?: number; maxPages?: number },
): Promise<{ processed: number; errors: number; metadata: Record<string, number> }> {
  const batchSize = options?.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxPages = options?.maxPages ?? DEFAULT_MAX_PAGES;
  const today = todayDateString();
  const in3 = addDaysDateString(today, 3);

  let processed = 0;
  let errors = 0;
  let notified = 0;

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * batchSize;
    const { data, error } = await supabase
      .from("proposals")
      .select("id, workspace_id, title, valid_until")
      .eq("status", "sent")
      .is("deleted_at", null)
      .not("valid_until", "is", null)
      .lte("valid_until", in3)
      .order("valid_until", { ascending: true })
      .range(from, from + batchSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    if (!rows.length) break;

    for (const proposal of rows) {
      processed += 1;
      try {
        const inserted = await notifyManagersIdempotent(supabase, proposal.workspace_id, {
          type: "proposal_reminder",
          title: "Ofertă în așteptare",
          body: `„${proposal.title}” expiră pe ${proposal.valid_until}.`,
          entityType: "proposal",
          entityId: proposal.id,
          actionUrl: "/dashboard/proposals",
          idempotencyKey: `proposal_reminder:${proposal.id}:${today}`,
        });
        notified += inserted;
      } catch (err) {
        errors += 1;
        console.error(
          "[background.notifications.proposal]",
          proposal.id,
          err instanceof Error ? err.message : "failed",
        );
      }
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
      processed += 1;
      try {
        const inserted = await notifyManagersIdempotent(supabase, contract.workspace_id, {
          type: "contract_reminder",
          title: "Contract în așteptare",
          body: `„${contract.title}” așteaptă semnare.`,
          entityType: "contract",
          entityId: contract.id,
          actionUrl: `/dashboard/contracts/${contract.id}`,
          idempotencyKey: `contract_reminder:${contract.id}:${today}`,
        });
        notified += inserted;
      } catch (err) {
        errors += 1;
        console.error(
          "[background.notifications.contract]",
          contract.id,
          err instanceof Error ? err.message : "failed",
        );
      }
    }
    if (rows.length < batchSize) break;
  }

  return { processed, errors, metadata: { notified } };
}
