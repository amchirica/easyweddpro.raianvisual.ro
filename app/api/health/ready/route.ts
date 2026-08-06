import { NextResponse } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Readiness probe — confirms Supabase is reachable. Never returns secrets or
 * env values, only a plain up/down status.
 */
export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: true, supabase: "down" });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ ok: false, supabase: "down" }, { status: 503 });
    }

    return NextResponse.json({ ok: true, supabase: "up" });
  } catch {
    return NextResponse.json({ ok: false, supabase: "down" }, { status: 503 });
  }
}
