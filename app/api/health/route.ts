import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness probe — process is up, no external dependencies checked. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
