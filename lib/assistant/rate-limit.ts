import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

export async function checkAssistantRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from("assistant_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) {
    // Fail open on telemetry errors so guidance still works
    return { ok: true };
  }

  if ((count ?? 0) >= MAX_PER_WINDOW) {
    return { ok: false, retryAfterSec: 60 };
  }
  return { ok: true };
}
