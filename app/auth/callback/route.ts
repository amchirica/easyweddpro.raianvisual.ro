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
 * OAuth / PKCE (`?code=`) and recovery links that land with an auth code.
 * Email confirm via token_hash uses /auth/confirm.
 *
 * Redirects stay on the current request host via request.url.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = getSafeRedirectPath(searchParams.get("next")) ?? "/dashboard";

  if (!code) {
    return redirectRelative(request, "/login?error=missing_auth_code");
  }

  if (!hasSupabaseEnv()) {
    return redirectRelative(request, "/login?error=auth_not_configured");
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
    const isRecovery = requestedNext === PASSWORD_RESET_PATH;
    return redirectRelative(
      request,
      isRecovery
        ? "/login?error=password_reset_failed"
        : "/login?error=session_initialization_failed",
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectRelative(request, "/login?error=session_initialization_failed");
  }

  await supabase.rpc("ensure_own_profile");

  const destination =
    requestedNext === PASSWORD_RESET_PATH ||
    requestedNext.startsWith(`${PASSWORD_RESET_PATH}/`)
      ? PASSWORD_RESET_PATH
      : await resolvePostAuthPath(supabase, requestedNext);

  const response = redirectRelative(request, destination);
  return applyPendingAuthCookies(response, pendingCookies);
}
