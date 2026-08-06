import { createBrowserClient } from "@supabase/ssr";

import { hasSupabaseEnv, requireSupabasePublicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createClient() {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Supabase nu este configurat. Setează NEXT_PUBLIC_SUPABASE_URL și NEXT_PUBLIC_SUPABASE_ANON_KEY (sau NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).",
    );
  }

  const { url, anonKey } = requireSupabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
