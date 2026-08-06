-- EasyWedd Pro — multi-tenant schema + RLS
-- Apply in Supabase SQL Editor or via supabase db push

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  account_status text not null default 'active'
    check (account_status in ('active', 'pending', 'suspended')),
  suspended_at timestamptz,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Workspaces & membership
-- ---------------------------------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  activity_type text,
  city text,
  country text,
  currency text not null default 'RON',
  logo_url text,
  brand_primary text,
  brand_accent text,
  fiscal_data jsonb,
  plan text not null default 'free'
    check (plan in ('free', 'solo', 'studio', 'agency')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null
    check (role in ('owner', 'admin', 'manager', 'sales', 'editor', 'collaborator', 'viewer')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_idx on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_idx on public.workspace_members (workspace_id);

-- ---------------------------------------------------------------------------
-- Core CRM tables
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  event_type text,
  event_date date,
  city text,
  venue text,
  budget numeric(12, 2),
  source text,
  services text[],
  notes text,
  owner_id uuid references auth.users (id) on delete set null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost')),
  estimated_value numeric(12, 2),
  follow_up_date date,
  tags text[],
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  city text,
  event_date date,
  event_type text,
  status text not null default 'active',
  total_value numeric(12, 2),
  notes text,
  portal_token text unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  lead_id uuid references public.leads (id) on delete set null,
  title text not null,
  package_name text,
  amount numeric(12, 2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired')),
  valid_until date,
  public_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  content jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  proposal_id uuid references public.proposals (id) on delete set null,
  title text not null,
  amount numeric(12, 2) not null default 0,
  deposit numeric(12, 2) not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'active', 'completed', 'cancelled')),
  signed_at timestamptz,
  signer_name text,
  signer_ip text,
  event_date date,
  content jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  name text not null,
  event_date date,
  status text not null default 'booked',
  deadline date,
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  team text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  due_date date,
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'todo'
    check (status in ('todo', 'doing', 'done')),
  assignee_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  contract_id uuid references public.contracts (id) on delete set null,
  label text not null,
  amount numeric(12, 2) not null default 0,
  paid_amount numeric(12, 2) not null default 0,
  due_date date,
  method text check (method in ('transfer', 'cash', 'card', 'other') or method is null),
  status text not null default 'pending'
    check (status in ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  title text not null,
  event_type text not null default 'event',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  trigger_key text not null,
  channel text not null default 'email',
  enabled boolean not null default true,
  config jsonb,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'trialing',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_workspace_idx on public.leads (workspace_id);
create index if not exists clients_workspace_idx on public.clients (workspace_id);
create index if not exists proposals_workspace_idx on public.proposals (workspace_id);
create index if not exists contracts_workspace_idx on public.contracts (workspace_id);
create index if not exists projects_workspace_idx on public.projects (workspace_id);
create index if not exists payments_workspace_idx on public.payments (workspace_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_platform_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.ensure_own_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.ensure_own_profile();

create or replace function public.create_onboarding_workspace(
  p_name text,
  p_activity_type text,
  p_city text,
  p_country text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workspace_id uuid;
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.workspaces (name, slug, activity_type, city, country)
  values (p_name, v_slug, p_activity_type, p_city, p_country)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, auth.uid(), 'owner');

  insert into public.subscriptions (workspace_id, plan, status, trial_ends_at)
  values (v_workspace_id, 'free', 'trialing', now() + interval '14 days');

  update public.profiles
  set onboarding_completed = true, updated_at = now()
  where id = auth.uid();

  return v_workspace_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.proposals enable row level security;
alter table public.contracts enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.payments enable row level security;
alter table public.calendar_events enable row level security;
alter table public.automations enable row level security;
alter table public.activity_logs enable row level security;
alter table public.subscriptions enable row level security;

-- Profiles
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_platform_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Workspaces
create policy "workspaces_select_member"
  on public.workspaces for select
  using (public.is_workspace_member(id) or public.is_platform_admin());

create policy "workspaces_update_member_admin"
  on public.workspaces for update
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.workspace_members m
      where m.workspace_id = id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- Members
create policy "members_select_same_workspace"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "members_manage_admins"
  on public.workspace_members for all
  using (
    public.is_platform_admin()
    or exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_members.workspace_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  )
  with check (
    public.is_platform_admin()
    or exists (
      select 1 from public.workspace_members m
      where m.workspace_id = workspace_members.workspace_id
        and m.user_id = auth.uid()
        and m.role in ('owner', 'admin')
    )
  );

-- Generic workspace-scoped CRUD helper policies
create policy "leads_workspace_all"
  on public.leads for all
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin())
  with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "clients_workspace_all"
  on public.clients for all
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin())
  with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "proposals_workspace_all"
  on public.proposals for all
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin())
  with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "contracts_workspace_all"
  on public.contracts for all
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin())
  with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "projects_workspace_all"
  on public.projects for all
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin())
  with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "tasks_workspace_all"
  on public.tasks for all
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin())
  with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "payments_workspace_all"
  on public.payments for all
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin())
  with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "calendar_workspace_all"
  on public.calendar_events for all
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin())
  with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "automations_workspace_all"
  on public.automations for all
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin())
  with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "activity_workspace_select"
  on public.activity_logs for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "activity_workspace_insert"
  on public.activity_logs for insert
  with check (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "subscriptions_workspace_select"
  on public.subscriptions for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());

create policy "subscriptions_admin_all"
  on public.subscriptions for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Public reads happen via security-definer RPCs (token-scoped), not open table policies.
create or replace function public.get_proposal_by_token(p_token text)
returns setof public.proposals
language sql
stable
security definer
set search_path = public
as $$
  select * from public.proposals where public_token = p_token limit 1;
$$;

create or replace function public.get_client_by_portal_token(p_token text)
returns setof public.clients
language sql
stable
security definer
set search_path = public
as $$
  select * from public.clients where portal_token = p_token limit 1;
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.create_onboarding_workspace(text, text, text, text) to authenticated;
grant execute on function public.get_proposal_by_token(text) to anon, authenticated;
grant execute on function public.get_client_by_portal_token(text) to anon, authenticated;
