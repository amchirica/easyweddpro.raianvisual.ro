import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

type ActivityClient = SupabaseClient<Database>;

export type ActivityInput = {
  workspaceId: string;
  actorId: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, Json | undefined>;
};

export async function logActivity(
  supabase: ActivityClient,
  input: ActivityInput,
): Promise<void> {
  const metadata = Object.fromEntries(
    Object.entries(input.metadata ?? {}).filter(([, value]) => value !== undefined),
  ) as Json;

  const { error } = await supabase.from("activity_logs").insert({
    workspace_id: input.workspaceId,
    actor_id: input.actorId,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    action: input.action,
    title: input.title,
    description: input.description ?? null,
    metadata,
  });

  if (error && process.env.NODE_ENV === "development") {
    console.error("[activity_log]", error.message);
  }
}
