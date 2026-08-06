import type { Json } from "@/types/database";
import type { BackgroundClient, JobResult } from "@/lib/background/types";

function cleanMetadata(metadata?: Record<string, Json | undefined>): Json {
  return Object.fromEntries(
    Object.entries(metadata ?? {}).filter(([, value]) => value !== undefined),
  ) as Json;
}

export async function startCronRun(
  supabase: BackgroundClient,
  job: string,
  metadata?: Record<string, Json | undefined>,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("cron_runs")
    .insert({
      job,
      success: false,
      processed: 0,
      errors: 0,
      metadata: cleanMetadata(metadata),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[cron_runs.start]", job, error?.message ?? "insert_failed");
    return null;
  }
  return data.id;
}

export async function finishCronRun(
  supabase: BackgroundClient,
  runId: string | null,
  result: Pick<JobResult, "success" | "processed" | "errors" | "durationMs" | "metadata">,
): Promise<void> {
  if (!runId) return;

  const { error } = await supabase
    .from("cron_runs")
    .update({
      finished_at: new Date().toISOString(),
      duration_ms: result.durationMs,
      success: result.success,
      processed: result.processed,
      errors: result.errors,
      metadata: cleanMetadata(result.metadata),
    })
    .eq("id", runId);

  if (error) {
    console.error("[cron_runs.finish]", error.message);
  }
}

export async function getLatestCronRun(
  supabase: BackgroundClient,
  job?: string,
): Promise<{
  job: string;
  started_at: string;
  finished_at: string | null;
  success: boolean;
  processed: number;
  errors: number;
  duration_ms: number | null;
} | null> {
  let query = supabase
    .from("cron_runs")
    .select("job, started_at, finished_at, success, processed, errors, duration_ms")
    .order("started_at", { ascending: false })
    .limit(1);

  if (job) query = query.eq("job", job);

  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return data;
}
