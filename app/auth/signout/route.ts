import { NextResponse, type NextRequest } from "next/server";

import { hasSupabaseEnv } from "@/lib/env";
import {
  applyPendingAuthCookies,
  createAuthRouteClient,
  type PendingAuthCookie,
} from "@/lib/supabase/auth-route";

/**
 * Single logout flow: clear Supabase auth cookies server-side.
 * Client navigates to /login after a successful response.
 */
export async function POST(request: NextRequest) {
  const pendingCookies: PendingAuthCookie[] = [];
  const response = NextResponse.json({ ok: true });
  response.headers.set("Cache-Control", "no-store");

  if (!hasSupabaseEnv()) {
    return response;
  }

  try {
    const supabase = createAuthRouteClient(request, pendingCookies);
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error && process.env.NODE_ENV === "development") {
      console.error("Auth flow failed", {
        operation: "auth.signOut",
        message: error.message,
        status: error.status,
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Auth flow failed", {
        operation: "auth.signOut",
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return NextResponse.json({ ok: false, error: "logout_failed" }, { status: 500 });
  }

  return applyPendingAuthCookies(response, pendingCookies);
}
