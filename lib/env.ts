/**
 * Single public Supabase key resolution.
 * Prefer publishable key, fall back to classic anon JWT.
 * Never use the service-role / secret key here.
 */
export function getSupabaseAnonKey(): string | undefined {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    undefined;
  return key || undefined;
}

export function getSupabaseUrl(): string | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url || undefined;
}

export function hasSupabaseEnv(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function requireSupabasePublicEnv(): { url: string; anonKey: string } {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)",
    );
  }
  return { url, anonKey };
}

export function requireServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return key;
}

/**
 * Explicit demo mode:
 * - EASYWEDDPRO_DEMO=1 always enables demo
 * - Without Supabase env, demo is allowed only outside production
 * Authenticated users with a real workspace must never silently fall back to fixtures.
 */
export function isDemoMode(): boolean {
  if (process.env.EASYWEDDPRO_DEMO === "1") return true;
  if (hasSupabaseEnv()) return false;
  return process.env.NODE_ENV !== "production";
}

export function isExplicitDemoFlag(): boolean {
  return process.env.EASYWEDDPRO_DEMO === "1";
}
