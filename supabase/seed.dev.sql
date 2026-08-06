-- DEV ONLY — Studio Raian Fine Arts demo workspace
-- Run after migrations, with a real auth user UUID substituted below.

-- Replace this UUID with an existing auth.users.id from your project.
-- \set demo_user_id '00000000-0000-0000-0000-000000000001'

do $$
declare
  v_user uuid;
  v_ws uuid;
begin
  select id into v_user from auth.users order by created_at asc limit 1;
  if v_user is null then
    raise notice 'No auth users found — create a user first, then re-run seed.';
    return;
  end if;

  insert into public.profiles (id, full_name, onboarding_completed, account_status)
  values (v_user, 'Raian Fine Arts', true, 'active')
  on conflict (id) do update
    set full_name = excluded.full_name,
        onboarding_completed = true;

  insert into public.workspaces (id, name, slug, activity_type, city, country, currency, plan)
  values (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1',
    'Studio Raian Fine Arts',
    'studio-raian-visual-demo',
    'Fotografie & videografie evenimente',
    'București',
    'România',
    'RON',
    'studio'
  )
  on conflict (id) do nothing
  returning id into v_ws;

  if v_ws is null then
    v_ws := 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_ws, v_user, 'owner')
  on conflict (workspace_id, user_id) do nothing;

  insert into public.subscriptions (workspace_id, plan, status, trial_ends_at)
  values (v_ws, 'studio', 'active', now() + interval '30 days')
  on conflict (workspace_id) do nothing;

  insert into public.leads (
    workspace_id, name, email, phone, event_type, event_date, city, venue,
    budget, source, services, notes, status, estimated_value, follow_up_date, tags
  )
  values
    (v_ws, 'Andreea & Mihai Popescu', 'andreea.popescu@email.com', '+40 721 111 222', 'Nuntă', '2026-09-12', 'București', 'Palatul Snagov', 18000, 'Instagram', array['Foto','Video'], 'Stil editorial', 'negotiation', 16500, '2026-08-08', array['premium']),
    (v_ws, 'Ioana Marinescu', 'ioana.m@email.com', '+40 722 333 444', 'Botez', '2026-08-22', 'Ploiești', 'Restaurant Belvedere', 4500, 'Recomandare', array['Foto'], 'Așteaptă ofertă', 'proposal_sent', 3900, '2026-08-07', array['botez']),
    (v_ws, 'Elena Radu', 'elena.radu@email.com', '+40 725 999 000', 'Logodnă', '2026-08-15', 'Constanța', 'Mamaia Nord', 2500, 'Facebook', array['Foto'], 'Lead nou', 'new', 2200, null, array['logodnă'])
  on conflict do nothing;

  insert into public.clients (workspace_id, name, email, phone, city, event_date, event_type, status, total_value, notes, portal_token)
  values
    (v_ws, 'Maria & Cristian Dobre', 'maria.dobre@email.com', '+40 727 303 404', 'București', '2026-07-18', 'Nuntă', 'active', 13500, 'Livrare galerie', 'demo-portal-dobre'),
    (v_ws, 'Laura & Paul Niculescu', 'laura.n@email.com', '+40 731 112 213', 'Sibiu', '2026-08-29', 'Nuntă', 'active', 17200, 'Pregătire', 'demo-portal-niculescu')
  on conflict do nothing;

  raise notice 'Demo workspace seeded for user %', v_user;
end $$;
