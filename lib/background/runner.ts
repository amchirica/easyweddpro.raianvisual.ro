import { finishCronRun, startCronRun } from "@/lib/background/cron-log";
import type { BackgroundClient, JobName, JobResult } from "@/lib/background/types";
import type { Json } from "@/types/database";

export type JobFn = (supabase: BackgroundClient) => Promise<{
  processed: number;
  errors?: number;
  metadata?: Record<string, Json | undefined>;
}>;

/**
 * Runs a single named job with cron_runs journaling.
 * Never throws — failures become `{ success: false }`.
 */
export async function runLoggedJob(
  supabase: BackgroundClient,
  job: JobName | string,
  fn: JobFn,
  meta?: Record<string, Json | undefined>,
): Promise<JobResult> {
  const started = Date.now();
  const runId = await startCronRun(supabase, job, meta);

  try {
    const outcome = await fn(supabase);
    const result: JobResult = {
      job,
      success: (outcome.errors ?? 0) === 0,
      processed: outcome.processed,
      errors: outcome.errors ?? 0,
      durationMs: Date.now() - started,
      metadata: outcome.metadata,
    };
    await finishCronRun(supabase, runId, result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "job_failed";
    console.error(`[background.${job}]`, message);
    const result: JobResult = {
      job,
      success: false,
      processed: 0,
      errors: 1,
      durationMs: Date.now() - started,
      errorMessages: [message],
      metadata: meta,
    };
    await finishCronRun(supabase, runId, result);
    return result;
  }
}

/** Settles a list of job runners; one failure never stops the rest. */
export async function settleJobs(
  jobs: Array<() => Promise<JobResult>>,
): Promise<JobResult[]> {
  const settled = await Promise.allSettled(jobs.map((job) => job()));
  return settled.map((item, index) => {
    if (item.status === "fulfilled") return item.value;
    const message = item.reason instanceof Error ? item.reason.message : "job_rejected";
    console.error("[background.settle]", index, message);
    return {
      job: `unknown_${index}`,
      success: false,
      processed: 0,
      errors: 1,
      durationMs: 0,
      errorMessages: [message],
    };
  });
}
