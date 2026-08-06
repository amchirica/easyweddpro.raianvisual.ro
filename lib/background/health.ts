import {
  createBackgroundAdminClient,
  isResendConfiguredForJobs,
  isStorageConfiguredForJobs,
  isStripeConfiguredForJobs,
} from "@/lib/background/client";
import { getLatestCronRun } from "@/lib/background/cron-log";
import { hasSupabaseEnv } from "@/lib/env";

export type HealthSnapshot = {
  ok: boolean;
  supabase: "up" | "down" | "unconfigured";
  resendConfigured: boolean;
  stripeConfigured: boolean;
  storageConfigured: boolean;
  lastCronRun: {
    job: string;
    startedAt: string;
    finishedAt: string | null;
    success: boolean;
    processed: number;
    errors: number;
    durationMs: number | null;
  } | null;
  lastAutomationsRun: {
    startedAt: string;
    success: boolean;
    processed: number;
    errors: number;
  } | null;
  lastAnalyticsSync: {
    startedAt: string;
    success: boolean;
    processed: number;
  } | null;
};

export async function getHealthSnapshot(): Promise<HealthSnapshot> {
  const base: HealthSnapshot = {
    ok: false,
    supabase: hasSupabaseEnv() ? "down" : "unconfigured",
    resendConfigured: isResendConfiguredForJobs(),
    stripeConfigured: isStripeConfiguredForJobs(),
    storageConfigured: isStorageConfiguredForJobs(),
    lastCronRun: null,
    lastAutomationsRun: null,
    lastAnalyticsSync: null,
  };

  if (!hasSupabaseEnv() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return base;
  }

  try {
    const supabase = createBackgroundAdminClient();
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
    if (error) return base;

    base.supabase = "up";

    const [runner, automations, analytics] = await Promise.all([
      getLatestCronRun(supabase, "runner"),
      getLatestCronRun(supabase, "automations"),
      getLatestCronRun(supabase, "analytics"),
    ]);

    if (runner) {
      base.lastCronRun = {
        job: runner.job,
        startedAt: runner.started_at,
        finishedAt: runner.finished_at,
        success: runner.success,
        processed: runner.processed,
        errors: runner.errors,
        durationMs: runner.duration_ms,
      };
    }
    if (automations) {
      base.lastAutomationsRun = {
        startedAt: automations.started_at,
        success: automations.success,
        processed: automations.processed,
        errors: automations.errors,
      };
    }
    if (analytics) {
      base.lastAnalyticsSync = {
        startedAt: analytics.started_at,
        success: analytics.success,
        processed: analytics.processed,
      };
    }

    base.ok = base.supabase === "up";
    return base;
  } catch {
    return base;
  }
}
