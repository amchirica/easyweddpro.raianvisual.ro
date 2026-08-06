import type { BackgroundClient } from "@/lib/background/types";

const CRON_LOG_RETENTION_DAYS = 30;
const AUTOMATION_RUN_RETENTION_DAYS = 90;
const EMAIL_DELIVERY_RETENTION_DAYS = 90;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

/**
 * Expire/revoke stale tokens and prune old operational logs.
 * Never deletes contracts, proposals, payments, or other legal documents.
 */
export async function cleanupExpiredTokens(
  supabase: BackgroundClient,
): Promise<{ processed: number; errors: number; metadata: Record<string, number> }> {
  const now = new Date().toISOString();
  let processed = 0;
  let errors = 0;
  const counts: Record<string, number> = {
    invitations: 0,
    portalTokens: 0,
    proposalTokens: 0,
    contractTokens: 0,
  };

  try {
    const { data, error } = await supabase
      .from("workspace_invitations")
      .update({ revoked_at: now })
      .lt("expires_at", now)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .select("id");
    if (error) throw error;
    counts.invitations = data?.length ?? 0;
    processed += counts.invitations;
  } catch (err) {
    errors += 1;
    console.error("[cleanup.invitations]", err instanceof Error ? err.message : "failed");
  }

  try {
    const { data, error } = await supabase
      .from("client_portal_tokens")
      .update({ revoked_at: now })
      .lt("expires_at", now)
      .is("revoked_at", null)
      .select("id");
    if (error) throw error;
    counts.portalTokens = data?.length ?? 0;
    processed += counts.portalTokens;
  } catch (err) {
    errors += 1;
    console.error("[cleanup.portal]", err instanceof Error ? err.message : "failed");
  }

  // Proposals keep a non-null public_token column; access RPCs already reject expired tokens.
  // We only count expired proposal tokens for observability (no destructive wipe).
  try {
    const { count, error } = await supabase
      .from("proposals")
      .select("id", { count: "exact", head: true })
      .lt("public_token_expires_at", now)
      .not("public_token_expires_at", "is", null);
    if (error) throw error;
    counts.proposalTokens = count ?? 0;
  } catch (err) {
    errors += 1;
    console.error("[cleanup.proposals]", err instanceof Error ? err.message : "failed");
  }

  try {
    const { data, error } = await supabase
      .from("contracts")
      .update({
        public_token: null,
        public_token_hash: null,
        public_token_expires_at: null,
        updated_at: now,
      })
      .lt("public_token_expires_at", now)
      .not("public_token_hash", "is", null)
      .select("id");
    if (error) throw error;
    counts.contractTokens = data?.length ?? 0;
    processed += counts.contractTokens;
  } catch (err) {
    errors += 1;
    console.error("[cleanup.contracts]", err instanceof Error ? err.message : "failed");
  }

  return { processed, errors, metadata: counts };
}

export async function cleanupOldLogs(
  supabase: BackgroundClient,
): Promise<{ processed: number; errors: number; metadata: Record<string, number> }> {
  let processed = 0;
  let errors = 0;
  const counts: Record<string, number> = {
    cronRuns: 0,
    automationRuns: 0,
    emailDeliveries: 0,
  };

  try {
    const { data, error } = await supabase
      .from("cron_runs")
      .delete()
      .lt("started_at", daysAgoIso(CRON_LOG_RETENTION_DAYS))
      .select("id");
    if (error) throw error;
    counts.cronRuns = data?.length ?? 0;
    processed += counts.cronRuns;
  } catch (err) {
    errors += 1;
    console.error("[cleanup.cron_runs]", err instanceof Error ? err.message : "failed");
  }

  try {
    const { data, error } = await supabase
      .from("automation_runs")
      .delete()
      .lt("created_at", daysAgoIso(AUTOMATION_RUN_RETENTION_DAYS))
      .select("id");
    if (error) throw error;
    counts.automationRuns = data?.length ?? 0;
    processed += counts.automationRuns;
  } catch (err) {
    errors += 1;
    console.error("[cleanup.automation_runs]", err instanceof Error ? err.message : "failed");
  }

  try {
    const { data, error } = await supabase
      .from("email_deliveries")
      .delete()
      .lt("created_at", daysAgoIso(EMAIL_DELIVERY_RETENTION_DAYS))
      .in("status", ["skipped", "failed"])
      .select("id");
    if (error) throw error;
    counts.emailDeliveries = data?.length ?? 0;
    processed += counts.emailDeliveries;
  } catch (err) {
    errors += 1;
    console.error("[cleanup.email_deliveries]", err instanceof Error ? err.message : "failed");
  }

  return { processed, errors, metadata: counts };
}
