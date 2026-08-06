import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { hasSupabaseEnv, requireSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Request-scoped Supabase client. Returns null when env is not configured.
 */
export const createClient = cache(async () => {
  if (!hasSupabaseEnv()) return null;

  const cookieStore = await cookies();
  const { url, anonKey } = requireSupabasePublicEnv();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component — middleware will refresh session.
          }
        },
      },
    },
  );
});
