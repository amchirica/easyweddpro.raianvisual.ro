import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Service-role client for background jobs.
 * Intentionally free of `server-only` so Cloudflare `scheduled()` can import it.
 */
export function createBackgroundAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("supabase_not_configured");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Copy string Worker bindings into process.env for Node-compat libraries. */
export function applyWorkerEnv(env: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string" && value.length > 0) {
      process.env[key] = value;
    }
  }
}

export function isResendConfiguredForJobs(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function isStripeConfiguredForJobs(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function isStorageConfiguredForJobs(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );
}

export function todayDateString(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDaysDateString(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
