# RLS Test Matrix — EasyWedd Pro

Status: **executable fixtures ready; client-as-user PASS/FAIL must be recorded after you run the checks against a real Supabase project.**

Migrations required (in order):

1. `supabase/migrations/20260805000000_easyweddpro_schema.sql`
2. `supabase/migrations/20260805120000_crm_mvp_fields.sql`
3. `supabase/migrations/20260805140000_roles_and_proposals.sql`
4. `supabase/migrations/20260805160000_contracts_portal.sql`

Fixture / smoke script:

- `supabase/tests/rls_crm_test.sql`

## Setup (exact steps)

1. Create **User A** and **User B** via `/register` + email confirm (or Supabase Auth dashboard).
2. Apply all three migrations in the SQL Editor.
3. Open `supabase/tests/rls_crm_test.sql` and run it (as postgres in SQL Editor).  
   It creates:
   - Workspace A (owner = User A)
   - Workspace B (owner = User B)
   - User B as **viewer** on Workspace A
   - sample leads/clients/proposal + a valid public token
4. For each row below, authenticate with the **anon key + user JWT** (browser session or supabase-js).  
   **Do not use service_role** for user isolation tests.
5. Record **Actual** and mark **PASS/FAIL**.

## Role matrix implemented (app + RLS)

| Role | CRM read | CRM write | CRM delete | Proposals write | Contracts write | Workspace/members |
|---|---|---|---|---|---|---|
| owner | yes | yes | yes | yes | yes | yes |
| admin | yes | yes | yes | yes | yes | yes |
| manager | yes | yes | yes | yes | yes | no |
| sales | yes | yes | no | yes | no | no |
| editor | yes | no | no | no | no | no |
| collaborator | yes | no | no | no | no | no |
| viewer | yes | no | no | no | no | no |

SQL helpers: `has_workspace_role`, `can_manage_crm`, `can_manage_sales`, `can_delete_crm`, `can_manage_workspace`, `can_manage_members`, `can_write_contracts`.

App helpers: `lib/workspace/permissions.ts` (`canPerformWorkspaceAction`, `requireWorkspaceAction`, `permissionsForRole`).

## Results log

Fill **Actual** after running. Initial state: not executed in CI/agent environment (no live Supabase credentials).

| # | Actor | Operation | Expected | Actual | Result |
|---|---|---|---|---|---|
| 1 | User A | `select` leads Workspace A | rows returned | _pending_ | _pending_ |
| 2 | User A | `select` leads Workspace B | 0 rows | _pending_ | _pending_ |
| 3 | User A | `update` client from Workspace B | 0 rows / denied | _pending_ | _pending_ |
| 4 | User B viewer on A | `select` leads A | rows returned | _pending_ | _pending_ |
| 5 | User B viewer on A | `insert` lead into A | denied | _pending_ | _pending_ |
| 6 | User B viewer on A | `update` lead on A | denied | _pending_ | _pending_ |
| 7 | User B sales on A | `insert`/`update` lead on A | allowed | _pending_ | _pending_ |
| 8 | Editor on A | `update` proposal financials | denied | _pending_ | _pending_ |
| 9 | Owner A | full CRM/proposals on A | allowed | _pending_ | _pending_ |
| 10 | User without membership | `select` A resources | 0 rows | _pending_ | _pending_ |
| 11 | Platform admin | cross-workspace select via `is_platform_admin` | allowed; distinct from owner | _pending_ | _pending_ |
| 12 | Anon | `get_public_proposal_by_token(invalid)` | `null` | **script asserts PASS when run** | SQL smoke |
| 13 | Anon | `get_public_proposal_by_token(valid)` | JSON with limited fields only | **script asserts PASS when run** | SQL smoke |
| 14 | User A | `select` contracts Workspace A | rows returned | _pending_ | _pending_ |
| 15 | User A | `select` contracts Workspace B | 0 rows | _pending_ | _pending_ |
| 16 | User B viewer on A | `update` contract on A | denied | _pending_ | _pending_ |
| 17 | User B sales on A | `update` contract on A | denied | _pending_ | _pending_ |
| 18 | Manager on A | create/publish contract on A | allowed | _pending_ | _pending_ |
| 19 | Anon | `get_public_contract_by_token(invalid)` | `null` | **script asserts PASS when run** | SQL smoke |
| 20 | Anon | `get_public_contract_by_token(valid)` | limited public JSON only | **script asserts PASS when run** | SQL smoke |
| 21 | Anon | portal token client A | only client A data | **script asserts PASS when run** | SQL smoke |
| 22 | Writer | edit accepted contract | app blocks (draft-only) | _pending_ | _pending_ |
| 23 | Browser | service_role key | must not be present | _pending_ manual_ | _pending_ |

### Example supabase-js checks (User A session)

```ts
const { data: own } = await supabase.from("leads").select("id").eq("workspace_id", WS_A);
const { data: other } = await supabase.from("leads").select("id").eq("workspace_id", WS_B);
const { error: insertErr } = await supabase.from("leads").insert({
  workspace_id: WS_A,
  name: "Should fail as viewer",
});
```

### Public token notes

- **Proposals:** MVP still stores the **raw** `public_token`. Limitation: DB leak exposes usable tokens.
- **Contracts:** public lookup uses `public_token_hash` (SHA-256). Raw token may still be stored for staff copy-link (RLS member select only).
- **Portal:** `client_portal_tokens.token_hash` only; raw returned once at generation.
- Contract RPCs: `get_public_contract_by_token` / `mark_contract_viewed_by_token` / `accept_contract_by_token`.
- Portal RPC: `get_client_portal_by_token`.

## Agent execution note

Unit/lint/typecheck/build may be run locally in the agent environment.  
**Live RLS PASS/FAIL against a remote Supabase project was not executed** unless explicitly recorded below after a real multi-user run. Do not mark contract RLS rows PASS without that run.
