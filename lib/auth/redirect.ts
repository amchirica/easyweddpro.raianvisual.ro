import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const ALLOWED_AUTH_PATHS = new Set(["/auth/reset-password"]);

/**
 * Safe internal redirect only. Rejects external URLs and protocol-relative paths.
 * Returns null when the value is unsafe (callers supply a fallback).
 */
export function getSafeRedirectPath(value: string | null | undefined): string | null;
export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback: string,
): string;
export function getSafeRedirectPath(
  value: string | null | undefined,
  fallback?: string,
): string | null {
  if (!value || typeof value !== "string") {
    return fallback === undefined ? null : fallback;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback === undefined ? null : fallback;
  }
  if (trimmed.includes("://") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback === undefined ? null : fallback;
  }

  const pathOnly = trimmed.split(/[?#]/)[0] ?? trimmed;

  if (pathOnly === "/auth" || pathOnly.startsWith("/auth/")) {
    if (!ALLOWED_AUTH_PATHS.has(pathOnly)) {
      return fallback === undefined ? null : fallback;
    }
  }

  return trimmed;
}

export async function userHasWorkspace(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userId)
    .limit(1);
  return Boolean(data?.length);
}

/**
 * Destination after successful auth:
 * - without workspace → /onboarding
 * - with workspace → /dashboard
 * Respects a safe `next` when compatible with workspace state.
 */
export async function resolvePostAuthPath(
  supabase: SupabaseClient<Database>,
  next: string | null | undefined,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  const hasWorkspace = await userHasWorkspace(supabase, user.id);
  const fallback = hasWorkspace ? "/dashboard" : "/onboarding";
  const safe = getSafeRedirectPath(next) ?? fallback;

  if (safe === "/auth/reset-password" || safe.startsWith("/auth/reset-password/")) {
    return "/auth/reset-password";
  }

  if (!hasWorkspace && (safe === "/dashboard" || safe.startsWith("/dashboard/"))) {
    return "/onboarding";
  }
  if (hasWorkspace && (safe === "/onboarding" || safe.startsWith("/onboarding/"))) {
    return "/dashboard";
  }

  return safe;
}
