import { NextResponse } from "next/server";

import { getHealthSnapshot } from "@/lib/background/health";

export const dynamic = "force-dynamic";

/**
 * Readiness probe — Supabase must be up. Includes cron/analytics freshness
 * flags without exposing secrets or PII.
 */
export async function GET() {
  const snapshot = await getHealthSnapshot();

  if (snapshot.supabase !== "up") {
    return NextResponse.json(
      {
        ok: false,
        supabase: snapshot.supabase,
        resendConfigured: snapshot.resendConfigured,
        stripeConfigured: snapshot.stripeConfigured,
        storageConfigured: snapshot.storageConfigured,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    supabase: "up",
    resendConfigured: snapshot.resendConfigured,
    stripeConfigured: snapshot.stripeConfigured,
    storageConfigured: snapshot.storageConfigured,
    lastCronRun: snapshot.lastCronRun
      ? {
          startedAt: snapshot.lastCronRun.startedAt,
          finishedAt: snapshot.lastCronRun.finishedAt,
          success: snapshot.lastCronRun.success,
          processed: snapshot.lastCronRun.processed,
          errors: snapshot.lastCronRun.errors,
          durationMs: snapshot.lastCronRun.durationMs,
        }
      : null,
    lastAutomationsRun: snapshot.lastAutomationsRun,
    lastAnalyticsSync: snapshot.lastAnalyticsSync,
  });
}
