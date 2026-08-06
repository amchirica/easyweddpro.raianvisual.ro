-- EasyWedd Pro — incremental CRM MVP fields + RPCs
-- Safe to apply after 20260805000000_easyweddpro_schema.sql

-- ---------------------------------------------------------------------------
-- Workspaces: onboarding extras + timezone
-- ---------------------------------------------------------------------------
alter table public.workspaces
  add column if not exists timezone text not null default 'Europe/Bucharest',
  add column if not exists services text[] default '{}',
  add column if not exists events_per_year integer,
  add column if not exists team_size text,
  add column if not exists settings jsonb default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Leads: audit, conversion, soft delete, currency
-- ---------------------------------------------------------------------------
alter table public.leads
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists client_id uuid references public.clients (id) on delete set null,
  add column if not exists converted_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists currency text not null default 'RON';

create index if not exists leads_workspace_status_idx
  on public.leads (workspace_id, status)
  where deleted_at is null;

create index if not exists leads_workspace_created_idx
  on public.leads (workspace_id, created_at desc)
  where deleted_at is null;

create index if not exists leads_follow_up_idx
  on public.leads (workspace_id, follow_up_date)
  where deleted_at is null and follow_up_date is not null;

-- ---------------------------------------------------------------------------
-- Clients: richer CRM fields + soft archive
-- ---------------------------------------------------------------------------
alter table public.clients
  add column if not exists company text,
  add column if not exists address text,
  add column if not exists country text,
  add column if not exists tags text[] default '{}',
  add column if not exists source text,
  add column if not exists lead_id uuid references public.leads (id) on delete set null,
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists archived_at timestamptz;

create index if not exists clients_workspace_active_idx
  on public.clients (workspace_id, created_at desc)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Activity logs: action + metadata
-- ---------------------------------------------------------------------------
alter table public.activity_logs
  add column if not exists action text,
  add column if not exists metadata jsonb default '{}'::jsonb;

create index if not exists activity_logs_workspace_created_idx
  on public.activity_logs (workspace_id, created_at desc);

create index if not exists activity_logs_entity_idx
  on public.activity_logs (workspace_id, entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- Profile helpers: split trigger vs callable RPC (avoid return-type clash)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user_profile()
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
  for each row execute function public.handle_new_user_profile();

-- Remove legacy trigger function if it still exists as RETURNS trigger
drop function if exists public.ensure_own_profile() cascade;

create or replace function public.ensure_own_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id, full_name)
  values (
    auth.uid(),
    coalesce(
      (select raw_user_meta_data ->> 'full_name' from auth.users where id = auth.uid()),
      (select email from auth.users where id = auth.uid())
    )
  )
  on conflict (id) do nothing;
end;
$$;

-- ---------------------------------------------------------------------------
-- Onboarding RPC (full payload, idempotent if already owner of a workspace)
-- ---------------------------------------------------------------------------
create or replace function public.create_onboarding_workspace(
  p_name text,
  p_activity_type text,
  p_city text,
  p_country text,
  p_services text[] default '{}',
  p_events_per_year integer default null,
  p_team_size text default null,
  p_currency text default 'RON',
  p_timezone text default 'Europe/Bucharest',
  p_logo_url text default null,
  p_brand_accent text default null,
  p_fiscal_data jsonb default null,
  p_settings jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_workspace_id uuid;
  v_slug text;
  v_existing uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  perform public.ensure_own_profile();

  -- Idempotent: if user already owns a workspace, return it (prevents double-submit duplicates)
  select w.id into v_existing
  from public.workspaces w
  join public.workspace_members m on m.workspace_id = w.id
  where m.user_id = v_uid and m.role = 'owner'
  order by w.created_at asc
  limit 1;

  if v_existing is not null then
    update public.profiles
    set onboarding_completed = true, updated_at = now()
    where id = v_uid;

    return v_existing;
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'invalid_company_name';
  end if;

  v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  if v_slug = '' then
    v_slug := 'workspace';
  end if;
  v_slug := left(v_slug, 40) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

  insert into public.workspaces (
    name, slug, activity_type, city, country, currency, timezone,
    services, events_per_year, team_size, logo_url, brand_accent,
    fiscal_data, settings, plan
  )
  values (
    trim(p_name),
    v_slug,
    nullif(trim(p_activity_type), ''),
    nullif(trim(p_city), ''),
    nullif(trim(p_country), ''),
    coalesce(nullif(trim(p_currency), ''), 'RON'),
    coalesce(nullif(trim(p_timezone), ''), 'Europe/Bucharest'),
    coalesce(p_services, '{}'),
    p_events_per_year,
    nullif(trim(coalesce(p_team_size, '')), ''),
    nullif(trim(coalesce(p_logo_url, '')), ''),
    nullif(trim(coalesce(p_brand_accent, '')), ''),
    p_fiscal_data,
    coalesce(p_settings, '{}'::jsonb),
    'free'
  )
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, v_uid, 'owner');

  insert into public.subscriptions (workspace_id, plan, status, trial_ends_at)
  values (v_workspace_id, 'free', 'trialing', now() + interval '14 days')
  on conflict (workspace_id) do nothing;

  insert into public.activity_logs (
    workspace_id, actor_id, entity_type, entity_id, action, title, description, metadata
  )
  values (
    v_workspace_id,
    v_uid,
    'workspace',
    v_workspace_id,
    'workspace.created',
    'Workspace creat',
    'Onboarding finalizat — workspace-ul a fost creat.',
    jsonb_build_object('source', 'onboarding')
  );

  update public.profiles
  set onboarding_completed = true, updated_at = now()
  where id = v_uid;

  return v_workspace_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Convert lead → client (atomic-ish, membership checked)
-- ---------------------------------------------------------------------------
create or replace function public.convert_lead_to_client(
  p_lead_id uuid,
  p_existing_client_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_lead public.leads%rowtype;
  v_client_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_lead
  from public.leads
  where id = p_lead_id and deleted_at is null;

  if not found then
    raise exception 'lead_not_found';
  end if;

  if not public.is_workspace_member(v_lead.workspace_id) then
    raise exception 'forbidden';
  end if;

  -- Already converted
  if v_lead.client_id is not null then
    return v_lead.client_id;
  end if;

  if p_existing_client_id is not null then
    if not exists (
      select 1 from public.clients c
      where c.id = p_existing_client_id
        and c.workspace_id = v_lead.workspace_id
        and c.deleted_at is null
    ) then
      raise exception 'client_not_found';
    end if;
    v_client_id := p_existing_client_id;

    update public.clients
    set
      lead_id = coalesce(lead_id, v_lead.id),
      event_date = coalesce(event_date, v_lead.event_date),
      event_type = coalesce(event_type, v_lead.event_type),
      city = coalesce(city, v_lead.city),
      source = coalesce(source, v_lead.source),
      notes = coalesce(notes, v_lead.notes),
      updated_at = now()
    where id = v_client_id;
  else
    insert into public.clients (
      workspace_id, name, email, phone, city, event_date, event_type,
      status, total_value, notes, source, lead_id, created_by, tags
    )
    values (
      v_lead.workspace_id,
      v_lead.name,
      v_lead.email,
      v_lead.phone,
      v_lead.city,
      v_lead.event_date,
      v_lead.event_type,
      'active',
      v_lead.estimated_value,
      v_lead.notes,
      v_lead.source,
      v_lead.id,
      v_uid,
      coalesce(v_lead.tags, '{}')
    )
    returning id into v_client_id;
  end if;

  update public.leads
  set
    status = 'won',
    client_id = v_client_id,
    converted_at = coalesce(converted_at, now()),
    updated_at = now()
  where id = v_lead.id;

  insert into public.activity_logs (
    workspace_id, actor_id, entity_type, entity_id, action, title, description, metadata
  )
  values
    (
      v_lead.workspace_id, v_uid, 'lead', v_lead.id, 'lead.converted',
      'Lead convertit în client',
      'Leadul a fost convertit cu succes.',
      jsonb_build_object('client_id', v_client_id)
    ),
    (
      v_lead.workspace_id, v_uid, 'client', v_client_id, 'client.created_from_lead',
      'Client creat din lead',
      'Client legat de leadul sursă.',
      jsonb_build_object('lead_id', v_lead.id)
    );

  return v_client_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant execute on function public.ensure_own_profile() to authenticated;
grant execute on function public.create_onboarding_workspace(
  text, text, text, text, text[], integer, text, text, text, text, text, jsonb, jsonb
) to authenticated;
grant execute on function public.convert_lead_to_client(uuid, uuid) to authenticated;

-- Drop old 4-arg overload grants if present (function replaced with new signature)
-- Postgres keeps overloads; drop the old 4-arg version explicitly.
drop function if exists public.create_onboarding_workspace(text, text, text, text);
