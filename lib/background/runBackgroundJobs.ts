import { aggregateAnalytics } from "@/lib/background/analytics";
import { runAutomations } from "@/lib/background/automations";
import { cleanupExpiredTokens, cleanupOldLogs } from "@/lib/background/cleanup";
import { createBackgroundAdminClient } from "@/lib/background/client";
import { processScheduledEmails } from "@/lib/background/emails";
import { processUpcomingEvents } from "@/lib/background/events";
import { processScheduledNotifications } from "@/lib/background/notifications";
import { processOverduePayments } from "@/lib/background/payments";
import { finishCronRun, startCronRun } from "@/lib/background/cron-log";
import { runLoggedJob, settleJobs } from "@/lib/background/runner";
import { processTaskReminders } from "@/lib/background/tasks";
import type {
  BackgroundRunOptions,
  BackgroundRunSummary,
  JobResult,
} from "@/lib/background/types";
import { DEFAULT_BATCH_SIZE, DEFAULT_MAX_PAGES } from "@/lib/background/types";

/**
 * Central background executor invoked by Cloudflare `scheduled()` (and HTTP cron fallback).
 * Each job is independent — failures are logged and never abort the whole run.
 */
export async function runBackgroundJobs(
  options: BackgroundRunOptions = {},
): Promise<BackgroundRunSummary> {
  const startedAt = new Date();
  const source = options.source ?? "manual";
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE;
  const maxPages = options.maxPages ?? DEFAULT_MAX_PAGES;
  const scanOpts = { batchSize, maxPages };

  const supabase = createBackgroundAdminClient();
  const runnerId = await startCronRun(supabase, "runner", {
    source,
    cron: options.cron ?? null,
    scheduledTime: options.scheduledTime ?? null,
  });

  const jobs = await settleJobs([
    () =>
      runLoggedJob(supabase, "automations", () => runAutomations(supabase, scanOpts), {
        source,
      }),
    () =>
      runLoggedJob(
        supabase,
        "notifications",
        () => processScheduledNotifications(supabase, scanOpts),
        { source },
      ),
    () =>
      runLoggedJob(supabase, "emails", () => processScheduledEmails(supabase, scanOpts), {
        source,
      }),
    () =>
      runLoggedJob(supabase, "payments", () => processOverduePayments(supabase, scanOpts), {
        source,
      }),
    () =>
      runLoggedJob(supabase, "events", () => processUpcomingEvents(supabase, scanOpts), {
        source,
      }),
    () =>
      runLoggedJob(supabase, "tasks", () => processTaskReminders(supabase, scanOpts), {
        source,
      }),
    () =>
      runLoggedJob(supabase, "cleanup", async () => {
        const tokens = await cleanupExpiredTokens(supabase);
        const logs = await cleanupOldLogs(supabase);
        return {
          processed: tokens.processed + logs.processed,
          errors: tokens.errors + logs.errors,
          metadata: {
            tokens: tokens.processed,
            logs: logs.processed,
            ...tokens.metadata,
            ...logs.metadata,
          },
        };
      }, { source }),
    () =>
      runLoggedJob(supabase, "analytics", () => aggregateAnalytics(supabase, scanOpts), {
        source,
      }),
  ]);

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const ok = jobs.every((job) => job.success);
  const processed = jobs.reduce((sum, job) => sum + job.processed, 0);
  const errors = jobs.reduce((sum, job) => sum + job.errors, 0);

  await finishCronRun(supabase, runnerId, {
    success: ok,
    processed,
    errors,
    durationMs,
    metadata: {
      source,
      cron: options.cron ?? null,
      jobCount: jobs.length,
      failedJobs: jobs.filter((j) => !j.success).map((j) => j.job),
    },
  });

  const summary: BackgroundRunSummary = {
    ok,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs,
    jobs: jobs as JobResult[],
    source,
  };

  console.log(
    "[runBackgroundJobs]",
    JSON.stringify({
      ok: summary.ok,
      source: summary.source,
      durationMs: summary.durationMs,
      processed,
      errors,
      jobs: summary.jobs.map((j) => ({
        job: j.job,
        success: j.success,
        processed: j.processed,
        errors: j.errors,
      })),
    }),
  );

  return summary;
}
