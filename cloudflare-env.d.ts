/**
 * Minimal Worker env typing for custom `worker.ts`.
 * Regenerate fuller types with: npm run cf-typegen
 */
interface CloudflareEnv {
  ASSETS?: Fetcher;
  WORKER_SELF_REFERENCE?: Fetcher;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_APP_URL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_FROM_NAME?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  CRON_SECRET?: string;
  [key: string]: unknown;
}
