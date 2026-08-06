import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { PASSWORD_RESET_PATH } from "@/lib/auth/callback-destination";
import { getSafeRedirectPath, resolvePostAuthPath } from "@/lib/auth/redirect";
import { hasSupabaseEnv } from "@/lib/env";
import {
  applyPendingAuthCookies,
  createAuthRouteClient,
  type PendingAuthCookie,
} from "@/lib/supabase/auth-route";
import { getSiteUrl } from "@/lib/url";

/**
 * Email confirm / recovery / invite / magiclink.
 * Uses token_hash + verifyOtp — works across mail clients and in-app browsers.
 * OAuth PKCE (`?code=`) is handled exclusively by /auth/callback.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const siteUrl = getSiteUrl();

  const fallback = type === "recovery" ? PASSWORD_RESET_PATH : "/onboarding";
  const requestedNext = getSafeRedirectPath(searchParams.get("next"), fallback);

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/login?error=missing_token", siteUrl));
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/login?error=auth_not_configured", siteUrl));
  }

  const pendingCookies: PendingAuthCookie[] = [];
  const supabase = createAuthRouteClient(request, pendingCookies);

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Auth flow failed", {
        operation: "auth.confirm.verifyOtp",
        message: error.message,
        status: error.status,
      });
    }
    const code =
      error.code === "otp_expired" || /expired|invalid/i.test(error.message)
        ? "otp_expired"
        : (error.code ?? "auth_confirmation_failed");
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(code)}`, siteUrl),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (process.env.NODE_ENV === "development") {
      console.error("Auth flow failed", {
        operation: "auth.confirm.session",
        message: "session_missing_after_verify",
      });
    }
    return NextResponse.redirect(new URL("/login?error=session_missing", siteUrl));
  }

  const destination =
    type === "recovery"
      ? getSafeRedirectPath(searchParams.get("next"), PASSWORD_RESET_PATH)
      : await resolvePostAuthPath(supabase, requestedNext);

  const response = NextResponse.redirect(new URL(destination, siteUrl));
  return applyPendingAuthCookies(response, pendingCookies);
}
