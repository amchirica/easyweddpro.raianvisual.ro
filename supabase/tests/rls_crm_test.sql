-- EasyWedd Pro — executable RLS smoke tests (CRM + proposals + contracts/portal)
-- Run in Supabase SQL Editor AFTER applying all migrations
-- including 20260805160000_contracts_portal.sql.
--
-- IMPORTANT:
-- 1) Replace the UUIDs below with two real auth.users ids from your project.
-- 2) Do NOT use the service_role key for these checks.
-- 3) This script uses set_config to simulate JWTs (works in SQL Editor as postgres,
--    but RLS policies that call auth.uid() will see the claim only when
--    request.jwt.claim.sub is set — see notes at bottom for client-based verification).
--
-- Recommended verification path for PASS/FAIL truth:
--   Use two browser sessions / supabase-js clients with User A and User B anon keys,
--   then mark results in docs/RLS_TEST_MATRIX.md.
--
-- This SQL file prepares the fixtures and prints expected outcomes.

-- ---------------------------------------------------------------------------
-- 0. Parameters — EDIT THESE
-- ---------------------------------------------------------------------------
-- \set user_a 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
-- \set user_b 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'

do $$
declare
  user_a uuid;
  user_b uuid;
  ws_a uuid := '11111111-1111-1111-1111-111111111111';
  ws_b uuid := '22222222-2222-2222-2222-222222222222';
  lead_a uuid;
  lead_b uuid;
  client_b uuid;
  proposal_a uuid;
  client_a uuid;
  contract_a uuid;
  contract_b uuid;
  token_valid text := encode(gen_random_bytes(24), 'hex');
  token_invalid text := 'invalid-token-xxxxxxxxxxxx';
  contract_token text := encode(gen_random_bytes(24), 'hex');
  contract_token_hash text;
  portal_token text := encode(gen_random_bytes(24), 'hex');
  portal_token_hash text;
begin
  select id into user_a from auth.users order by created_at asc limit 1;
  select id into user_b from auth.users order by created_at asc offset 1 limit 1;

  if user_a is null or user_b is null then
    raise notice 'SETUP_FAIL: need at least 2 users in auth.users. Create User A and User B via /register first.';
    return;
  end if;

  raise notice 'Using user_a=%, user_b=%', user_a, user_b;

  -- Clean previous fixtures (idempotent-ish)
  delete from public.client_portal_tokens where workspace_id in (ws_a, ws_b);
  delete from public.contracts where workspace_id in (ws_a, ws_b);
  delete from public.proposal_items where workspace_id in (ws_a, ws_b);
  delete from public.proposals where workspace_id in (ws_a, ws_b);
  delete from public.leads where workspace_id in (ws_a, ws_b);
  delete from public.clients where workspace_id in (ws_a, ws_b);
  delete from public.activity_logs where workspace_id in (ws_a, ws_b);
  delete from public.subscriptions where workspace_id in (ws_a, ws_b);
  delete from public.workspace_members where workspace_id in (ws_a, ws_b);
  delete from public.workspaces where id in (ws_a, ws_b);

  insert into public.profiles (id, full_name, onboarding_completed)
  values
    (user_a, 'User A', true),
    (user_b, 'User B', true)
  on conflict (id) do update set onboarding_completed = true;

  insert into public.workspaces (id, name, slug, plan, currency, timezone)
  values
    (ws_a, 'Workspace A', 'workspace-a-rls', 'free', 'RON', 'Europe/Bucharest'),
    (ws_b, 'Workspace B', 'workspace-b-rls', 'free', 'RON', 'Europe/Bucharest');

  insert into public.workspace_members (workspace_id, user_id, role) values
    (ws_a, user_a, 'owner'),
    (ws_a, user_b, 'viewer'), -- B is viewer on A
    (ws_b, user_b, 'owner');

  insert into public.subscriptions (workspace_id, plan, status)
  values (ws_a, 'free', 'active'), (ws_b, 'free', 'active');

  insert into public.leads (id, workspace_id, name, status, estimated_value, created_by)
  values
    (gen_random_uuid(), ws_a, 'Lead A1', 'new', 1000, user_a),
    (gen_random_uuid(), ws_b, 'Lead B1', 'new', 2000, user_b)
  returning id into lead_b; -- last returning is B; capture A separately below

  select id into lead_a from public.leads where workspace_id = ws_a limit 1;
  select id into lead_b from public.leads where workspace_id = ws_b limit 1;

  insert into public.clients (workspace_id, name, email, status, created_by)
  values (ws_b, 'Client B', 'b@example.com', 'active', user_b)
  returning id into client_b;

  insert into public.clients (workspace_id, name, email, status, created_by)
  values (ws_a, 'Client A', 'a@example.com', 'active', user_a)
  returning id into client_a;

  insert into public.proposals (
    id, workspace_id, title, status, currency, subtotal, total, amount,
    public_token, created_by, proposal_number
  ) values (
    gen_random_uuid(), ws_a, 'Ofertă A', 'sent', 'RON', 1000, 1000, 1000,
    token_valid, user_a, 'EWP-TEST-0001'
  ) returning id into proposal_a;

  contract_token_hash := public.hash_token(contract_token);
  portal_token_hash := public.hash_token(portal_token);

  insert into public.contracts (
    id, workspace_id, client_id, title, status, currency, total, amount,
    deposit_amount, remaining_amount, public_token, public_token_hash,
    contract_number, version, created_by
  ) values (
    gen_random_uuid(), ws_a, client_a, 'Contract A', 'published', 'RON', 1000, 1000,
    300, 700, contract_token, contract_token_hash,
    'CTR-TEST-0001', 1, user_a
  ) returning id into contract_a;

  insert into public.contracts (
    id, workspace_id, client_id, title, status, currency, total, amount,
    deposit_amount, remaining_amount, contract_number, version, created_by
  ) values (
    gen_random_uuid(), ws_b, client_b, 'Contract B', 'draft', 'RON', 2000, 2000,
    600, 1400, 'CTR-TEST-B001', 1, user_b
  ) returning id into contract_b;

  insert into public.client_portal_tokens (
    workspace_id, client_id, token_hash, created_by
  ) values (ws_a, client_a, portal_token_hash, user_a);

  raise notice 'FIXTURES_OK ws_a=% ws_b=% lead_a=% lead_b=% proposal_a=% contract_a=% token_valid=% contract_token=% portal_token=%',
    ws_a, ws_b, lead_a, lead_b, proposal_a, contract_a, token_valid, contract_token, portal_token;

  -- Public RPC checks (security definer — runnable as postgres)
  if public.get_public_proposal_by_token(token_valid) is null then
    raise notice 'FAIL: valid token should return proposal JSON';
  else
    raise notice 'PASS: valid token returns public proposal JSON';
  end if;

  if public.get_public_proposal_by_token(token_invalid) is not null then
    raise notice 'FAIL: invalid token must return null';
  else
    raise notice 'PASS: invalid token returns null';
  end if;

  if public.get_public_contract_by_token(contract_token) is null then
    raise notice 'FAIL: valid contract token should return JSON';
  else
    raise notice 'PASS: valid contract token returns public JSON';
  end if;

  if public.get_public_contract_by_token(token_invalid) is not null then
    raise notice 'FAIL: invalid contract token must return null';
  else
    raise notice 'PASS: invalid contract token returns null';
  end if;

  if public.get_client_portal_by_token(portal_token) is null then
    raise notice 'FAIL: valid portal token should return JSON';
  else
    raise notice 'PASS: valid portal token returns client-scoped JSON';
  end if;

  if public.get_client_portal_by_token(token_invalid) is not null then
    raise notice 'FAIL: invalid portal token must return null';
  else
    raise notice 'PASS: invalid portal token returns null';
  end if;

  raise notice '---';
  raise notice 'CLIENT TESTS (must be run as User A / User B via supabase-js, not service_role):';
  raise notice '1. As User A: select leads where workspace_id=ws_a → expect rows';
  raise notice '2. As User A: select leads where workspace_id=ws_b → expect 0 rows';
  raise notice '3. As User A: update clients set name=x where id=client_b → expect 0';
  raise notice '4. As User B (viewer on A): select leads ws_a → expect rows';
  raise notice '5. As User B (viewer on A): insert lead into ws_a → expect RLS deny';
  raise notice '6. As User B (viewer on A): update lead in ws_a → expect RLS deny';
  raise notice '7. Promote User B to sales on A, then insert/update lead → expect allow';
  raise notice '8. Editor role: update proposal totals → expect deny (no sales role)';
  raise notice '9. Owner A: full CRUD on ws_a → expect allow';
  raise notice '10. User without membership: select → expect 0';
  raise notice '11. Platform admin flag separate from owner role';
  raise notice 'C1. User A: select contracts ws_a → rows; ws_b → 0';
  raise notice 'C2. Viewer B on A: update contracts ws_a → deny';
  raise notice 'C3. Sales on A: update contracts → deny; select → allow';
  raise notice 'C4. Manager on A: insert/publish contracts → allow';
  raise notice 'C5. Accepted contract update by writer should be blocked in app (status draft-only)';
  raise notice 'C6. Portal token client A must not expose client B';
  raise notice 'C7. Never use service_role in browser';
  raise notice 'See docs/RLS_TEST_MATRIX.md to record PASS/FAIL.';
end $$;
