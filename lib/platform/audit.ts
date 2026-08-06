import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

type Client = SupabaseClient<Database>;

export type PlatformAuditInput = {
  actorId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  reason?: string | null;
  metadata?: Record<string, Json | undefined>;
  ip?: string | null;
};

function cleanMetadata(metadata?: Record<string, Json | undefined>): Json {
  return Object.fromEntries(
    Object.entries(metadata ?? {}).filter(([, value]) => value !== undefined),
  ) as Json;
}

/** Append-only platform audit. Never throws to callers. */
export async function writePlatformAudit(
  supabase: Client,
  input: PlatformAuditInput,
): Promise<void> {
  const { error } = await supabase.from("platform_audit_logs").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    reason: input.reason ?? null,
    metadata: cleanMetadata(input.metadata),
    ip: input.ip ?? null,
  });

  if (error && process.env.NODE_ENV === "development") {
    console.error("[platform.audit]", error.message);
  }
}

export async function logAdminAccess(
  supabase: Client,
  input: {
    userId: string | null;
    path: string;
    outcome: "allow" | "deny" | "forbidden";
    metadata?: Record<string, Json | undefined>;
  },
): Promise<void> {
  const { error } = await supabase.from("admin_access_logs").insert({
    user_id: input.userId,
    path: input.path,
    outcome: input.outcome,
    metadata: cleanMetadata(input.metadata),
  });
  if (error && process.env.NODE_ENV === "development") {
    console.error("[platform.access]", error.message);
  }
}
