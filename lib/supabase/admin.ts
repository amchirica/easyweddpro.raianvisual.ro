import "server-only";

import { createClient } from "@supabase/supabase-js";

import { requireServiceRoleKey, requireSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role client. Server-only. Never import from client components.
 */
export function createAdminClient() {
  const { url } = requireSupabasePublicEnv();
  const serviceRoleKey = requireServiceRoleKey();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
