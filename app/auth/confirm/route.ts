import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";

import { PASSWORD_RESET_PATH } from "@/lib/auth/callback-destination";
import { getSafeRedirectPath, resolvePostAuthPath } from "@/lib/auth/redirect";
import { redirectRelative } from "@/lib/auth/relative-redirect";
import { hasSupabaseEnv } from "@/lib/env";
import {
  applyPendingAuthCookies,
  createAuthRouteClient,
  type PendingAuthCookie,
} from "@/lib/supabase/auth-route";

/**
 * Email confirm / recovery / invite / magiclink.
 * Uses token_hash + verifyOtp — works across mail clients and in-app browsers.
 * OAuth PKCE (`?code=`) is handled exclusively by /auth/callback.
 *
 * Redirects are always relative to request.url so the browser stays on the
 * current host (localhost in dev). Absolute production URLs are not used here.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const fallback = type === "recovery" ? PASSWORD_RESET_PATH : "/onboarding";
  const requestedNext = getSafeRedirectPath(searchParams.get("next")) ?? fallback;

  if (!tokenHash || !type) {
    return redirectRelative(request, "/login?error=invalid_or_expired_link");
  }

  if (!hasSupabaseEnv()) {
    return redirectRelative(request, "/login?error=auth_not_configured");
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
    return redirectRelative(request, "/login?error=invalid_or_expired_link");
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
    return redirectRelative(request, "/login?error=session_initialization_failed");
  }

  // Ensure profile row exists before onboarding/dashboard.
  await supabase.rpc("ensure_own_profile");

  const destination =
    type === "recovery"
      ? getSafeRedirectPath(searchParams.get("next")) ?? PASSWORD_RESET_PATH
      : await resolvePostAuthPath(supabase, requestedNext);

  const response = redirectRelative(request, destination);
  return applyPendingAuthCookies(response, pendingCookies);
}
