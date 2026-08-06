import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, type NextResponse } from "next/server";

import { requireSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export type PendingAuthCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Supabase client that collects Set-Cookie operations so they can be applied
 * to the final redirect/json response after the destination is known.
 */
export function createAuthRouteClient(
  request: NextRequest,
  pendingCookies: PendingAuthCookie[],
) {
  const { url, anonKey } = requireSupabasePublicEnv();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          pendingCookies.push({ name, value, options });
        });
      },
    },
  });
}

export function applyPendingAuthCookies(
  response: NextResponse,
  pendingCookies: PendingAuthCookie[],
) {
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
  return response;
}
