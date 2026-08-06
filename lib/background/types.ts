import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database";

export type BackgroundClient = SupabaseClient<Database>;

export type JobName =
  | "automations"
  | "notifications"
  | "emails"
  | "payments"
  | "events"
  | "tasks"
  | "cleanup"
  | "analytics"
  | "runner";

export type JobResult = {
  job: JobName | string;
  success: boolean;
  processed: number;
  errors: number;
  durationMs: number;
  errorMessages?: string[];
  metadata?: Record<string, Json | undefined>;
};

export type BackgroundRunOptions = {
  source?: string;
  cron?: string;
  scheduledTime?: number;
  /** Limit each scanner page size (default 100). */
  batchSize?: number;
  /** Max pages per job (default 10 → 1000 rows). */
  maxPages?: number;
};

export type BackgroundRunSummary = {
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  jobs: JobResult[];
  source: string;
};

export const DEFAULT_BATCH_SIZE = 100;
export const DEFAULT_MAX_PAGES = 10;

export const EVENT_REMINDER_DAYS = [30, 14, 7, 3, 1] as const;
export type EventReminderDay = (typeof EVENT_REMINDER_DAYS)[number];
