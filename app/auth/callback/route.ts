import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath, resolvePostAuthPath } from "@/lib/auth/redirect";
import { hasSupabaseEnv } from "@/lib/env";
import {
  applyPendingAuthCookies,
  createAuthRouteClient,
  type PendingAuthCookie,
} from "@/lib/supabase/auth-route";
import { getSiteUrl } from "@/lib/url";

/**
 * OAuth / PKCE only (`?code=`).
 * Email confirm + password recovery use /auth/confirm (token_hash + verifyOtp).
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const siteUrl = getSiteUrl();
  const requestedNext = getSafeRedirectPath(searchParams.get("next"), "/dashboard");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", siteUrl));
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login?error=auth_not_configured", siteUrl));
  }

  const pendingCookies: PendingAuthCookie[] = [];
  const supabase = createAuthRouteClient(request, pendingCookies);

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Auth flow failed", {
        operation: "auth.callback.exchangeCodeForSession",
        message: error.message,
        status: error.status,
      });
    }
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error.code ?? "auth_confirmation_failed")}`,
        siteUrl,
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=session_missing", siteUrl));
  }

  const destination = await resolvePostAuthPath(supabase, requestedNext);
  const response = NextResponse.redirect(new URL(destination, siteUrl));
  return applyPendingAuthCookies(response, pendingCookies);
}
