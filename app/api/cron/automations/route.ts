import { NextResponse, type NextRequest } from "next/server";

import { runBackgroundJobs } from "@/lib/background/runBackgroundJobs";

/**
 * HTTP fallback for background jobs (GitHub Actions / external cron).
 * Prefer Cloudflare `scheduled()` via `worker.ts` in production.
 *
 * Auth: Authorization: Bearer ${CRON_SECRET}
 */

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

async function handleCronRequest(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runBackgroundJobs({ source: "http_cron" });
    return NextResponse.json({
      ok: summary.ok,
      startedAt: summary.startedAt,
      finishedAt: summary.finishedAt,
      durationMs: summary.durationMs,
      jobs: summary.jobs.map((job) => ({
        job: job.job,
        success: job.success,
        processed: job.processed,
        errors: job.errors,
        durationMs: job.durationMs,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "cron_run_failed";
    if (process.env.NODE_ENV === "development") {
      console.error("[cron.automations]", message);
    }
    return NextResponse.json({ error: "cron_run_failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCronRequest(request);
}

export async function POST(request: NextRequest) {
  return handleCronRequest(request);
}
