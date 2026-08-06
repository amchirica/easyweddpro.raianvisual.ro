# Backup & recovery

## What to protect

1. **Supabase Postgres** — primary business data (CRM, contracts, billing rows)
2. **Supabase Storage** — `workspace-assets` (logos/docs) and any legacy logo buckets
3. **Auth** — managed by Supabase Auth (users/sessions)
4. **Secrets** — Stripe/Resend/Cron/env (password manager / CF secrets, not git)

## Recommended cadence

| Asset | Cadence | Retention |
| --- | --- | --- |
| Database (PITR / daily dump) | Daily + continuous if plan allows | ≥ 30 days |
| Storage objects | Daily or bucket versioning | ≥ 30 days |
| Migration history | Git + `supabase/migrations` | Forever |

Enable Supabase PITR on paid plans when available. Otherwise schedule `pg_dump` (or Supabase backups UI) and store offsite.

## Recovery drills

1. Restore a staging project from the latest backup
2. Re-apply any migrations newer than the dump timestamp
3. Verify RLS with `supabase/tests/rls_crm_test.sql` / `production_schema_check.sql`
4. Smoke: login, lead create, contract public link, portal token, health endpoints

## Incident notes

- Prefer restore-to-new-project then cutover over in-place overwrite
- Rotate `CRON_SECRET`, Stripe webhook secret, and service role if leaked
- Do not restore production from a dump that contains test Stripe customers without scrubbing
