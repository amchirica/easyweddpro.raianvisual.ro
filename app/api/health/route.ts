import { NextResponse } from "next/server";

import { getHealthSnapshot } from "@/lib/background/health";

export const dynamic = "force-dynamic";

/** Liveness + lightweight infra flags (no secrets). */
export async function GET() {
  const snapshot = await getHealthSnapshot();
  return NextResponse.json({
    ok: true,
    alive: true,
    supabase: snapshot.supabase,
    resendConfigured: snapshot.resendConfigured,
    stripeConfigured: snapshot.stripeConfigured,
    storageConfigured: snapshot.storageConfigured,
    lastCronRunAt: snapshot.lastCronRun?.startedAt ?? null,
    lastCronSuccess: snapshot.lastCronRun?.success ?? null,
  });
}
