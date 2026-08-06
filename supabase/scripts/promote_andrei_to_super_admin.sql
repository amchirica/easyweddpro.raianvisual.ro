-- =============================================================================
-- Promote andreim.chirica@gmail.com to platform_super_admin
-- =============================================================================
-- Acest script trebuie rulat numai după ce utilizatorul există în Authentication → Users.
--
-- Schema (din 20260805240000_platform_admin_core.sql):
--   public.platform_admins (
--     user_id uuid PK → auth.users(id),
--     role text CHECK IN (
--       'platform_super_admin',  -- cel mai înalt rol
--       'platform_admin',
--       'platform_support',
--       'platform_billing',
--       'platform_content',
--       'platform_developer'
--     ),
--     disabled_at timestamptz NULL = activ,
--     invited_by, notes, created_at, updated_at
--   )
--   public.profiles: full_name, is_platform_admin, account_status
--     (nu există coloană phone pe profiles — telefonul se păstrează în notes)
--   public.platform_audit_logs: append-only audit
--
-- Rulează în Supabase SQL Editor (service role / postgres).
-- Nu creează utilizatorul Auth. Idempotent: upsert pe user_id.
-- =============================================================================

do $$
declare
  v_email constant text := 'andreim.chirica@gmail.com';
  v_full_name constant text := 'Andrei Mihai Chirica';
  v_phone constant text := '+40740607882';
  v_role constant text := 'platform_super_admin';
  v_user_id uuid;
begin
  select u.id
  into v_user_id
  from auth.users u
  where lower(u.email) = lower(v_email)
  limit 1;

  if v_user_id is null then
    raise exception
      'Utilizatorul % nu există în auth.users. Creează și confirmă contul în Authentication → Users, apoi rulează din nou acest script.',
      v_email;
  end if;

  -- Profile: name + legacy admin flag + active status (phone nu e pe profiles)
  insert into public.profiles (id, full_name, is_platform_admin, account_status)
  values (v_user_id, v_full_name, true, 'active')
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    is_platform_admin = true,
    account_status = 'active',
    suspended_at = null,
    updated_at = now();

  -- Platform admin membership (highest role, enabled)
  insert into public.platform_admins (user_id, role, disabled_at, notes, updated_at)
  values (
    v_user_id,
    v_role,
    null,
    format('Promoted via SQL script. Contact phone: %s', v_phone),
    now()
  )
  on conflict (user_id) do update
  set
    role = excluded.role,
    disabled_at = null,
    notes = coalesce(public.platform_admins.notes, excluded.notes),
    updated_at = now();

  insert into public.platform_audit_logs (
    actor_id,
    action,
    entity_type,
    entity_id,
    reason,
    metadata
  )
  values (
    v_user_id,
    'platform_admin.promote',
    'platform_admin',
    v_user_id::text,
    'SQL promote to platform_super_admin',
    jsonb_build_object(
      'email', v_email,
      'role', v_role,
      'source', 'promote_andrei_to_super_admin.sql'
    )
  );
end $$;

-- Verification (no secrets)
select
  u.id as user_id,
  u.email,
  p.full_name,
  pa.notes as phone_or_notes,
  pa.role,
  case when pa.disabled_at is null then 'active' else 'disabled' end as status,
  pa.created_at as activated_at,
  p.is_platform_admin,
  p.account_status
from auth.users u
join public.profiles p on p.id = u.id
join public.platform_admins pa on pa.user_id = u.id
where lower(u.email) = lower('andreim.chirica@gmail.com');
