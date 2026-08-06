-- Platform Admin Core: roles, audit, plans, inspect sessions, settings, errors.
-- Does not edit prior migrations. Rollback: drop new tables/functions carefully.

-- ---------------------------------------------------------------------------
-- platform_admins
-- ---------------------------------------------------------------------------
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null
    check (role in (
      'platform_super_admin',
      'platform_admin',
      'platform_support',
      'platform_billing',
      'platform_content',
      'platform_developer'
    )),
  disabled_at timestamptz,
  invited_by uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_admins_role_idx
  on public.platform_admins (role)
  where disabled_at is null;

alter table public.platform_admins enable row level security;

-- Backfill from legacy flag
insert into public.platform_admins (user_id, role)
select id, 'platform_super_admin'
from public.profiles
where is_platform_admin = true
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- Replace is_platform_admin() to honour platform_admins membership
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
      and pa.disabled_at is null
  )
  or coalesce(
    (select is_platform_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.get_platform_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select pa.role
  from public.platform_admins pa
  where pa.user_id = auth.uid()
    and pa.disabled_at is null
  limit 1;
$$;

grant execute on function public.get_platform_admin_role() to authenticated;

create policy "platform_admins_select_self_or_admin"
  on public.platform_admins for select
  using (user_id = auth.uid() or public.is_platform_admin());

create policy "platform_admins_write_super"
  on public.platform_admins for all
  using (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
        and pa.disabled_at is null
        and pa.role = 'platform_super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.platform_admins pa
      where pa.user_id = auth.uid()
        and pa.disabled_at is null
        and pa.role = 'platform_super_admin'
    )
  );

-- ---------------------------------------------------------------------------
-- platform_audit_logs (append-only via RLS: no update/delete for non-service)
-- ---------------------------------------------------------------------------
create table if not exists public.platform_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists platform_audit_logs_created_idx
  on public.platform_audit_logs (created_at desc);

create index if not exists platform_audit_logs_action_idx
  on public.platform_audit_logs (action, created_at desc);

alter table public.platform_audit_logs enable row level security;

create policy "platform_audit_select_admin"
  on public.platform_audit_logs for select
  using (public.is_platform_admin());

create policy "platform_audit_insert_admin"
  on public.platform_audit_logs for insert
  with check (public.is_platform_admin() and actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- admin_access_logs
-- ---------------------------------------------------------------------------
create table if not exists public.admin_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  path text not null,
  outcome text not null check (outcome in ('allow', 'deny', 'forbidden')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_access_logs_created_idx
  on public.admin_access_logs (created_at desc);

create index if not exists admin_access_logs_user_idx
  on public.admin_access_logs (user_id, created_at desc);

alter table public.admin_access_logs enable row level security;

create policy "admin_access_logs_select_admin"
  on public.admin_access_logs for select
  using (public.is_platform_admin());

create policy "admin_access_logs_insert_auth"
  on public.admin_access_logs for insert
  with check (auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- admin_inspect_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.admin_inspect_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  reason text not null,
  expires_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_inspect_sessions_active_idx
  on public.admin_inspect_sessions (admin_id, workspace_id)
  where ended_at is null;

alter table public.admin_inspect_sessions enable row level security;

create policy "admin_inspect_select_own_or_admin"
  on public.admin_inspect_sessions for select
  using (admin_id = auth.uid() or public.is_platform_admin());

create policy "admin_inspect_insert_admin"
  on public.admin_inspect_sessions for insert
  with check (admin_id = auth.uid() and public.is_platform_admin());

create policy "admin_inspect_update_admin"
  on public.admin_inspect_sessions for update
  using (admin_id = auth.uid() and public.is_platform_admin())
  with check (admin_id = auth.uid() and public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- plans + plan_versions
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  currency text not null default 'RON',
  visible boolean not null default true,
  active boolean not null default true,
  highlighted boolean not null default false,
  sort_order integer not null default 0,
  visibility text not null default 'public'
    check (visibility in ('public', 'legacy', 'internal')),
  cta text not null default 'Alege planul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id text not null references public.plans (id) on delete cascade,
  version integer not null,
  price_monthly integer not null default 0,
  price_yearly integer,
  stripe_price_monthly_id text,
  stripe_price_yearly_id text,
  trial_days integer not null default 0,
  limits jsonb not null default '{}'::jsonb,
  features jsonb not null default '[]'::jsonb,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  unique (plan_id, version)
);

create index if not exists plan_versions_current_idx
  on public.plan_versions (plan_id)
  where is_current;

alter table public.plans enable row level security;
alter table public.plan_versions enable row level security;

create policy "plans_select_authenticated"
  on public.plans for select
  to authenticated
  using (active = true or public.is_platform_admin());

create policy "plans_select_anon_public"
  on public.plans for select
  to anon
  using (active = true and visible = true and visibility = 'public');

create policy "plans_write_admin"
  on public.plans for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "plan_versions_select_authenticated"
  on public.plan_versions for select
  to authenticated
  using (true);

create policy "plan_versions_select_anon"
  on public.plan_versions for select
  to anon
  using (
    exists (
      select 1 from public.plans p
      where p.id = plan_id and p.active and p.visible and p.visibility = 'public'
    )
  );

create policy "plan_versions_write_admin"
  on public.plan_versions for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Seed from code catalog defaults
insert into public.plans (id, name, slug, description, highlighted, sort_order, cta) values
  ('free', 'Free', 'free', 'Pentru a testa fluxul de bază.', false, 0, 'Începe gratuit'),
  ('solo', 'Solo', 'solo', 'Pentru freelanceri și furnizori independenți.', true, 1, 'Alege Solo'),
  ('studio', 'Studio', 'studio', 'Pentru echipe și businessuri de evenimente în creștere.', false, 2, 'Alege Studio'),
  ('agency', 'Agency', 'agency', 'Pentru agenții, locații și operațiuni cu mai multe echipe.', false, 3, 'Alege Agency')
on conflict (id) do nothing;

insert into public.plan_versions (plan_id, version, price_monthly, price_yearly, limits, features, is_current) values
  ('free', 1, 0, 0,
    '{"activeLeads":5,"clients":3,"users":1,"automations":false,"analytics":false,"customBranding":false,"productionPipeline":false,"multiBrand":false}'::jsonb,
    '["5 leaduri active","3 clienți","1 utilizator","Funcții de bază","Branding EasyWedd Pro"]'::jsonb,
    true),
  ('solo', 1, 79, 790,
    '{"activeLeads":null,"clients":null,"users":1,"automations":false,"analytics":false,"customBranding":false,"productionPipeline":false,"multiBrand":false}'::jsonb,
    '["Leaduri nelimitate","Clienți, oferte, contracte","Calendar și plăți","Portal client","1 utilizator"]'::jsonb,
    true),
  ('studio', 1, 179, 1790,
    '{"activeLeads":null,"clients":null,"users":5,"automations":true,"analytics":true,"customBranding":true,"productionPipeline":true,"multiBrand":false}'::jsonb,
    '["Până la 5 utilizatori","Automatizări","Analytics","Pipeline producție","Template-uri","Branding personalizat"]'::jsonb,
    true),
  ('agency', 1, 349, 3490,
    '{"activeLeads":null,"clients":null,"users":15,"automations":true,"analytics":true,"customBranding":true,"productionPipeline":true,"multiBrand":true}'::jsonb,
    '["Până la 15 utilizatori","Roluri avansate","Rapoarte","Multiple branduri","Suport prioritar","Funcții avansate"]'::jsonb,
    true)
on conflict (plan_id, version) do nothing;

-- ---------------------------------------------------------------------------
-- platform_settings (non-secret)
-- ---------------------------------------------------------------------------
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

create policy "platform_settings_select_admin"
  on public.platform_settings for select
  using (public.is_platform_admin());

create policy "platform_settings_write_admin"
  on public.platform_settings for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

insert into public.platform_settings (key, value) values
  ('registration', '{"enabled": true, "inviteOnly": false}'::jsonb),
  ('maintenance', '{"enabled": false, "message": null}'::jsonb),
  ('trial', '{"defaultDays": 14}'::jsonb),
  ('branding', '{"supportEmail": "contact@easyweddpro.raianvisual.ro"}'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- system_errors
-- ---------------------------------------------------------------------------
create table if not exists public.system_errors (
  id uuid primary key default gen_random_uuid(),
  severity text not null default 'error'
    check (severity in ('debug', 'info', 'warning', 'error', 'critical')),
  module text not null,
  route text,
  message text not null,
  error_type text,
  stack text,
  workspace_id uuid references public.workspaces (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  occurrence_count integer not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_errors_open_idx
  on public.system_errors (last_seen_at desc)
  where resolved_at is null;

alter table public.system_errors enable row level security;

create policy "system_errors_select_admin"
  on public.system_errors for select
  using (public.is_platform_admin());

create policy "system_errors_write_admin"
  on public.system_errors for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- user_feedback triage columns
-- ---------------------------------------------------------------------------
alter table public.user_feedback
  add column if not exists priority text
    check (priority is null or priority in ('low', 'normal', 'high', 'urgent'));

alter table public.user_feedback
  add column if not exists assigned_to uuid references auth.users (id) on delete set null;

alter table public.user_feedback
  add column if not exists admin_notes text;

comment on table public.platform_admins is 'Platform staff membership with granular roles.';
comment on table public.platform_audit_logs is 'Append-only platform admin audit trail.';
comment on table public.plans is 'Administrable plan catalog (fallback: code PLAN_CATALOG).';
