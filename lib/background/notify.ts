import type { BackgroundClient } from "@/lib/background/types";
import type { Json } from "@/types/database";

type NotifyManagersInput = {
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  /** Stable key shared across managers for the same event (suffixed with user id on insert). */
  idempotencyKey: string;
  metadata?: Record<string, Json | undefined>;
};

/**
 * Fan-out to owner/admin/manager with per-user idempotency keys.
 * Returns how many NEW notifications were inserted.
 */
export async function notifyManagersIdempotent(
  supabase: BackgroundClient,
  workspaceId: string,
  input: NotifyManagersInput,
): Promise<number> {
  const { data: members, error } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .in("role", ["owner", "admin", "manager"])
    .is("disabled_at", null);

  if (error || !members?.length) return 0;

  const metadata = Object.fromEntries(
    Object.entries(input.metadata ?? {}).filter(([, value]) => value !== undefined),
  ) as Json;

  let inserted = 0;
  for (const member of members) {
    const key = `${input.idempotencyKey}:${member.user_id}`;
    const { error: insertError } = await supabase.from("notifications").insert({
      workspace_id: workspaceId,
      user_id: member.user_id,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      action_url: input.actionUrl ?? null,
      idempotency_key: key,
      metadata,
    });

    if (!insertError) {
      inserted += 1;
      continue;
    }
    // Unique violation = already notified — ignore.
    if (insertError.code !== "23505") {
      console.error("[background.notify]", insertError.message);
    }
  }

  return inserted;
}
