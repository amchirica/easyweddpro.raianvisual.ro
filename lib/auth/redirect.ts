import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Safe internal redirect only. Rejects external URLs and protocol-relative paths.
 */
export function getSafeRedirectPath(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  // Avoid bouncing through auth handlers again.
  if (next === "/auth" || next.startsWith("/auth/")) {
    return fallback;
  }
  return next;
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
  const safe = getSafeRedirectPath(next, fallback);

  if (!hasWorkspace && (safe === "/dashboard" || safe.startsWith("/dashboard/"))) {
    return "/onboarding";
  }
  if (hasWorkspace && (safe === "/onboarding" || safe.startsWith("/onboarding/"))) {
    return "/dashboard";
  }

  return safe;
}
