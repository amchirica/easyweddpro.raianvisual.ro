# Production migration checklist — EasyWedd Pro

## Order (do not reorder)

1. `20260805000000_easyweddpro_schema.sql`
2. `20260805120000_crm_mvp_fields.sql`
3. `20260805140000_roles_and_proposals.sql`
4. `20260805160000_contracts_portal.sql`
5. `20260805170000_fix_contract_token_hash.sql`
6. `20260805180000_ops_modules_wave1.sql`
7. `20260805190000_templates_team_settings.sql`
8. `20260805200000_automations_analytics.sql`
9. `20260805210000_portal_client_payload.sql`
10. `20260805220000_beta_hardening.sql`

## Dependencies

| Migration | Depends on |
|---|---|
| 120000 | base schema |
| 140000 | CRM tables + roles helpers |
| 160000 | proposals + contracts columns |
| 170000 | `pgcrypto` / `hash_token` |
| 180000 | contracts/proposals for FKs |
| 190000 | `can_manage_workspace` / members |
| 200000 | automations table |
| 210000 | projects/payments columns from 180000 |
| 220000 | workspaces, subscriptions, storage |

## Expected tables (core)

`profiles`, `workspaces`, `workspace_members`, `leads`, `clients`, `proposals`, `contracts`, `contract_templates`, `client_portal_tokens`, `projects`, `tasks`, `payments`, `calendar_events`, `automations`, `automation_runs`, `activity_logs`, `subscriptions`, `workspace_templates`, `workspace_invitations`, `notifications`, `email_deliveries`, `user_feedback`, `stripe_webhook_events`

## Expected RPCs

`is_platform_admin`, `is_workspace_member`, `create_onboarding_workspace`, `convert_lead_to_client`, `create_contract_from_proposal`, `get_public_contract_by_token`, `accept_contract_by_token`, `get_client_portal_by_token`, `contract_payment_totals`, `workspace_analytics_summary`, `hash_token`

## Storage buckets

- `workspace-logos` (legacy logo uploads)
- `workspace-assets` (preferred: `{workspace_id}/logo.webp`, documents)

## Verification

Run after apply (read-only):

```bash
# In Supabase SQL Editor
\i supabase/tests/production_schema_check.sql
```

Or paste the contents of `supabase/tests/production_schema_check.sql`.

## Rollback notes

- Do **not** edit shipped migrations.
- To roll back beta hardening: drop `notifications`, `email_deliveries`, `user_feedback`, `stripe_webhook_events`; drop `workspace-assets` policies/bucket; drop added subscription columns.
- Portal RPC: restore from `20260805170000` if needed.
- Keep backups before production apply.

## Post-apply checks

1. Register + onboarding creates workspace + membership.
2. Create lead/client/proposal/contract draft.
3. Upload logo to `workspace-assets`.
4. Cron route returns 401 without `CRON_SECRET`.
5. Stripe webhook rejects unsigned payloads.
