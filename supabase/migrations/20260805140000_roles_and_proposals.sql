-- EasyWedd Pro — role-based RLS + proposals MVP schema/RPCs
-- Apply after 20260805120000_crm_mvp_fields.sql

-- ===========================================================================
-- 1. Role helpers
-- ===========================================================================
create or replace function public.has_workspace_role(
  p_workspace_id uuid,
  p_roles text[]
)
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
      and m.role = any (p_roles)
  )
  or public.is_platform_admin();
$$;

create or replace function public.can_manage_crm(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(
    p_workspace_id,
    array['owner', 'admin', 'manager', 'sales']
  );
$$;

create or replace function public.can_manage_sales(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(
    p_workspace_id,
    array['owner', 'admin', 'manager', 'sales']
  );
$$;

create or replace function public.can_delete_crm(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(
    p_workspace_id,
    array['owner', 'admin', 'manager']
  );
$$;

create or replace function public.can_manage_workspace(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(
    p_workspace_id,
    array['owner', 'admin']
  );
$$;

create or replace function public.can_manage_members(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(
    p_workspace_id,
    array['owner', 'admin']
  );
$$;

create or replace function public.can_write_contracts(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(
    p_workspace_id,
    array['owner', 'admin', 'manager']
  );
$$;

-- ===========================================================================
-- 2. Replace broad policies with role-aware ones
-- ===========================================================================

-- Leads
drop policy if exists "leads_workspace_all" on public.leads;
create policy "leads_select_member"
  on public.leads for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "leads_insert_crm"
  on public.leads for insert
  with check (public.can_manage_crm(workspace_id));
create policy "leads_update_crm"
  on public.leads for update
  using (public.can_manage_crm(workspace_id))
  with check (public.can_manage_crm(workspace_id));
create policy "leads_delete_crm"
  on public.leads for delete
  using (public.can_delete_crm(workspace_id));

-- Clients
drop policy if exists "clients_workspace_all" on public.clients;
create policy "clients_select_member"
  on public.clients for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "clients_insert_crm"
  on public.clients for insert
  with check (public.can_manage_crm(workspace_id));
create policy "clients_update_crm"
  on public.clients for update
  using (public.can_manage_crm(workspace_id))
  with check (public.can_manage_crm(workspace_id));
create policy "clients_delete_crm"
  on public.clients for delete
  using (public.can_delete_crm(workspace_id));

-- Proposals (will re-apply after schema alter; drop old first)
drop policy if exists "proposals_workspace_all" on public.proposals;

-- Contracts
drop policy if exists "contracts_workspace_all" on public.contracts;
create policy "contracts_select_member"
  on public.contracts for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "contracts_insert_writers"
  on public.contracts for insert
  with check (public.can_write_contracts(workspace_id));
create policy "contracts_update_writers"
  on public.contracts for update
  using (public.can_write_contracts(workspace_id))
  with check (public.can_write_contracts(workspace_id));
create policy "contracts_delete_admins"
  on public.contracts for delete
  using (public.can_manage_workspace(workspace_id));

-- Activity logs: members read; writers insert
drop policy if exists "activity_workspace_select" on public.activity_logs;
drop policy if exists "activity_workspace_insert" on public.activity_logs;
create policy "activity_select_member"
  on public.activity_logs for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "activity_insert_member"
  on public.activity_logs for insert
  with check (
    public.is_workspace_member(workspace_id)
    and not public.has_workspace_role(workspace_id, array['viewer'])
    or public.is_platform_admin()
  );

-- Fix operator precedence: viewer should NOT insert
drop policy if exists "activity_insert_member" on public.activity_logs;
create policy "activity_insert_member"
  on public.activity_logs for insert
  with check (
    public.is_platform_admin()
    or (
      public.is_workspace_member(workspace_id)
      and not public.has_workspace_role(workspace_id, array['viewer'])
    )
  );

-- Workspace members
drop policy if exists "members_manage_admins" on public.workspace_members;
create policy "members_insert_admins"
  on public.workspace_members for insert
  with check (public.can_manage_members(workspace_id));
create policy "members_update_admins"
  on public.workspace_members for update
  using (public.can_manage_members(workspace_id))
  with check (public.can_manage_members(workspace_id));
create policy "members_delete_admins"
  on public.workspace_members for delete
  using (public.can_manage_members(workspace_id));

-- Workspaces update: owner/admin only (select policy already exists)
drop policy if exists "workspaces_update_member_admin" on public.workspaces;
create policy "workspaces_update_admins"
  on public.workspaces for update
  using (public.can_manage_workspace(id))
  with check (public.can_manage_workspace(id));

-- Subscriptions: members can read own; only platform admin mutates
drop policy if exists "subscriptions_workspace_select" on public.subscriptions;
drop policy if exists "subscriptions_admin_all" on public.subscriptions;
create policy "subscriptions_select_member"
  on public.subscriptions for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "subscriptions_admin_write"
  on public.subscriptions for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ===========================================================================
-- 3. Proposal schema enhancements
-- ===========================================================================
alter table public.proposals
  add column if not exists proposal_number text,
  add column if not exists currency text not null default 'RON',
  add column if not exists subtotal numeric(12, 2) not null default 0,
  add column if not exists discount_type text not null default 'none'
    check (discount_type in ('none', 'percent', 'fixed')),
  add column if not exists discount_value numeric(12, 2) not null default 0,
  add column if not exists discount_amount numeric(12, 2) not null default 0,
  add column if not exists tax_rate numeric(5, 2) not null default 0,
  add column if not exists tax_amount numeric(12, 2) not null default 0,
  add column if not exists total numeric(12, 2) not null default 0,
  add column if not exists public_token_expires_at timestamptz,
  add column if not exists viewed_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists rejected_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists notes text,
  add column if not exists terms text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists snapshot jsonb,
  add column if not exists acceptance jsonb,
  add column if not exists rejection_reason text,
  add column if not exists contract_id uuid references public.contracts (id) on delete set null;

-- Migrate legacy amount → total if total is 0
update public.proposals
set total = coalesce(nullif(total, 0), amount, 0),
    subtotal = coalesce(nullif(subtotal, 0), amount, 0)
where total = 0 and amount is not null;

-- Expand status check: drop old if present via recreate constraint
alter table public.proposals drop constraint if exists proposals_status_check;
alter table public.proposals
  add constraint proposals_status_check
  check (status in ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'cancelled'));

create unique index if not exists proposals_workspace_number_uidx
  on public.proposals (workspace_id, proposal_number)
  where proposal_number is not null and deleted_at is null;

create unique index if not exists proposals_public_token_uidx
  on public.proposals (public_token)
  where public_token is not null;

create index if not exists proposals_workspace_status_idx
  on public.proposals (workspace_id, status)
  where deleted_at is null;

-- Proposal items
create table if not exists public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  name text not null,
  description text,
  quantity numeric(12, 2) not null default 1 check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  tax_rate numeric(5, 2) not null default 0,
  line_total numeric(12, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposal_items_proposal_idx
  on public.proposal_items (proposal_id, sort_order);

alter table public.proposal_items enable row level security;

create policy "proposal_items_select_member"
  on public.proposal_items for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "proposal_items_insert_sales"
  on public.proposal_items for insert
  with check (public.can_manage_sales(workspace_id));
create policy "proposal_items_update_sales"
  on public.proposal_items for update
  using (public.can_manage_sales(workspace_id))
  with check (public.can_manage_sales(workspace_id));
create policy "proposal_items_delete_sales"
  on public.proposal_items for delete
  using (public.can_manage_sales(workspace_id));

-- Proposal policies (role-aware)
create policy "proposals_select_member"
  on public.proposals for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "proposals_insert_sales"
  on public.proposals for insert
  with check (public.can_manage_sales(workspace_id));
create policy "proposals_update_sales"
  on public.proposals for update
  using (public.can_manage_sales(workspace_id))
  with check (public.can_manage_sales(workspace_id));
create policy "proposals_delete_managers"
  on public.proposals for delete
  using (public.can_delete_crm(workspace_id));

-- Counters for proposal numbers (race-safe)
create table if not exists public.workspace_counters (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  counter_key text not null,
  current_value bigint not null default 0,
  primary key (workspace_id, counter_key)
);

alter table public.workspace_counters enable row level security;
-- No direct client access; only via security definer RPC
revoke all on public.workspace_counters from anon, authenticated;

create or replace function public.next_proposal_number(p_workspace_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year text := to_char(timezone('utc', now()), 'YYYY');
  v_key text := 'proposal_' || v_year;
  v_next bigint;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.can_manage_sales(p_workspace_id) then
    raise exception 'forbidden';
  end if;

  insert into public.workspace_counters (workspace_id, counter_key, current_value)
  values (p_workspace_id, v_key, 1)
  on conflict (workspace_id, counter_key)
  do update set current_value = public.workspace_counters.current_value + 1
  returning current_value into v_next;

  return 'EWP-' || v_year || '-' || lpad(v_next::text, 4, '0');
end;
$$;

-- ===========================================================================
-- 4. Public proposal RPCs (token-scoped, minimal payload)
-- ===========================================================================

-- Returns safe JSON for public page (not full row)
create or replace function public.get_public_proposal_by_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_row public.proposals%rowtype;
  v_ws public.workspaces%rowtype;
  v_client_name text;
  v_items jsonb;
  v_effective text;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    return null;
  end if;

  select * into v_row
  from public.proposals
  where public_token = trim(p_token)
    and deleted_at is null
  limit 1;

  if not found then
    return null;
  end if;

  if v_row.status = 'draft' then
    return null;
  end if;

  if v_row.public_token_expires_at is not null
     and v_row.public_token_expires_at < now() then
    v_effective := 'expired';
  elsif v_row.status = 'cancelled' then
    v_effective := 'cancelled';
  elsif v_row.status = 'accepted' then
    v_effective := 'accepted';
  elsif v_row.status = 'rejected' then
    v_effective := 'rejected';
  elsif v_row.valid_until is not null
     and v_row.valid_until < (timezone('utc', now()))::date
     and v_row.status not in ('accepted', 'rejected', 'cancelled') then
    v_effective := 'expired';
  else
    v_effective := v_row.status;
  end if;

  select * into v_ws from public.workspaces where id = v_row.workspace_id;
  select c.name into v_client_name from public.clients c where c.id = v_row.client_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'name', i.name,
      'description', i.description,
      'quantity', i.quantity,
      'unit_price', i.unit_price,
      'discount', i.discount,
      'tax_rate', i.tax_rate,
      'line_total', i.line_total,
      'sort_order', i.sort_order
    ) order by i.sort_order
  ), '[]'::jsonb)
  into v_items
  from public.proposal_items i
  where i.proposal_id = v_row.id;

  return jsonb_build_object(
    'id', v_row.id,
    'proposal_number', v_row.proposal_number,
    'title', v_row.title,
    'status', v_effective,
    'currency', v_row.currency,
    'subtotal', v_row.subtotal,
    'discount_type', v_row.discount_type,
    'discount_value', v_row.discount_value,
    'discount_amount', v_row.discount_amount,
    'tax_rate', v_row.tax_rate,
    'tax_amount', v_row.tax_amount,
    'total', v_row.total,
    'valid_until', v_row.valid_until,
    'created_at', v_row.created_at,
    'terms', v_row.terms,
    'notes', case when v_row.status in ('draft') then null else v_row.notes end,
    'client_name', coalesce(v_client_name, (v_row.snapshot ->> 'client_name')),
    'provider_name', v_ws.name,
    'brand_accent', v_ws.brand_accent,
    'logo_url', v_ws.logo_url,
    'items', coalesce(v_row.snapshot -> 'items', v_items),
    'accepted_at', v_row.accepted_at,
    'rejected_at', v_row.rejected_at,
    'viewed_at', v_row.viewed_at
  );
end;
$$;

create or replace function public.mark_proposal_viewed_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_workspace_id uuid;
  v_status text;
  v_viewed_at timestamptz;
begin
  select id, workspace_id, status, viewed_at
  into v_id, v_workspace_id, v_status, v_viewed_at
  from public.proposals
  where public_token = trim(p_token)
    and deleted_at is null
    and status in ('sent', 'viewed')
  for update;

  if not found then
    return public.get_public_proposal_by_token(p_token);
  end if;

  if v_viewed_at is null then
    update public.proposals
    set
      viewed_at = now(),
      status = case when status = 'sent' then 'viewed' else status end,
      updated_at = now()
    where id = v_id;

    insert into public.activity_logs (
      workspace_id, actor_id, entity_type, entity_id, action, title, description, metadata
    ) values (
      v_workspace_id, null, 'proposal', v_id, 'proposal.viewed',
      'Ofertă vizualizată',
      'Clientul a deschis linkul public al ofertei.',
      jsonb_build_object('source', 'public_token')
    );
  end if;

  return public.get_public_proposal_by_token(p_token);
end;
$$;

create or replace function public.accept_proposal_by_token(
  p_token text,
  p_full_name text,
  p_email text,
  p_accepted_terms boolean,
  p_ip text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.proposals%rowtype;
begin
  if coalesce(p_accepted_terms, false) is not true then
    raise exception 'terms_required';
  end if;
  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'name_required';
  end if;
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'email_required';
  end if;

  select * into v_row
  from public.proposals
  where public_token = trim(p_token)
    and deleted_at is null
  for update;

  if not found or v_row.status = 'draft' then
    raise exception 'proposal_not_found';
  end if;

  if v_row.status = 'accepted' then
    return jsonb_build_object('ok', true, 'status', 'accepted', 'already', true);
  end if;

  if v_row.status in ('rejected', 'cancelled') then
    raise exception 'proposal_not_acceptable';
  end if;

  if v_row.public_token_expires_at is not null and v_row.public_token_expires_at < now() then
    raise exception 'proposal_expired';
  end if;

  if v_row.valid_until is not null
     and v_row.valid_until < (timezone('utc', now()))::date then
    raise exception 'proposal_expired';
  end if;

  update public.proposals
  set
    status = 'accepted',
    accepted_at = now(),
    updated_at = now(),
    acceptance = jsonb_build_object(
      'full_name', trim(p_full_name),
      'email', lower(trim(p_email)),
      'accepted_terms', true,
      'accepted_at', now(),
      'ip', nullif(trim(coalesce(p_ip, '')), ''),
      'user_agent', left(nullif(trim(coalesce(p_user_agent, '')), ''), 400),
      'kind', 'digital_acceptance'
    ),
    snapshot = coalesce(snapshot, '{}'::jsonb)
  where id = v_row.id
    and status not in ('accepted', 'rejected', 'cancelled');

  if not found then
    -- Concurrent accept won the race
    return jsonb_build_object('ok', true, 'status', 'accepted', 'already', true);
  end if;

  insert into public.activity_logs (
    workspace_id, actor_id, entity_type, entity_id, action, title, description, metadata
  ) values (
    v_row.workspace_id, null, 'proposal', v_row.id, 'proposal.accepted',
    'Ofertă acceptată',
    'Acceptare digitală a ofertei de către client.',
    jsonb_build_object(
      'email', lower(trim(p_email)),
      'full_name', trim(p_full_name)
    )
  );

  return jsonb_build_object('ok', true, 'status', 'accepted', 'already', false);
end;
$$;

create or replace function public.reject_proposal_by_token(
  p_token text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.proposals%rowtype;
begin
  select * into v_row
  from public.proposals
  where public_token = trim(p_token)
    and deleted_at is null
  for update;

  if not found or v_row.status = 'draft' then
    raise exception 'proposal_not_found';
  end if;

  if v_row.status = 'accepted' then
    raise exception 'already_accepted';
  end if;

  if v_row.status = 'rejected' then
    return jsonb_build_object('ok', true, 'status', 'rejected', 'already', true);
  end if;

  if v_row.status = 'cancelled' then
    raise exception 'proposal_cancelled';
  end if;

  update public.proposals
  set
    status = 'rejected',
    rejected_at = now(),
    rejection_reason = nullif(trim(coalesce(p_reason, '')), ''),
    updated_at = now()
  where id = v_row.id;

  insert into public.activity_logs (
    workspace_id, actor_id, entity_type, entity_id, action, title, description, metadata
  ) values (
    v_row.workspace_id, null, 'proposal', v_row.id, 'proposal.rejected',
    'Ofertă refuzată',
    coalesce(nullif(trim(coalesce(p_reason, '')), ''), 'Clientul a refuzat oferta.'),
    '{}'::jsonb
  );

  return jsonb_build_object('ok', true, 'status', 'rejected', 'already', false);
end;
$$;

-- Keep legacy RPC but restrict to non-draft and return row only for authenticated members
-- Anon should use get_public_proposal_by_token instead.
create or replace function public.get_proposal_by_token(p_token text)
returns setof public.proposals
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Deprecated for public UI; returns nothing to anon to avoid leaking internal columns.
  if auth.role() = 'anon' then
    return;
  end if;

  return query
  select p.*
  from public.proposals p
  where p.public_token = trim(p_token)
    and p.deleted_at is null
    and public.is_workspace_member(p.workspace_id)
  limit 1;
end;
$$;

-- ===========================================================================
-- 5. Grants
-- ===========================================================================
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;
grant execute on function public.can_manage_crm(uuid) to authenticated;
grant execute on function public.can_manage_sales(uuid) to authenticated;
grant execute on function public.can_delete_crm(uuid) to authenticated;
grant execute on function public.can_manage_workspace(uuid) to authenticated;
grant execute on function public.can_manage_members(uuid) to authenticated;
grant execute on function public.can_write_contracts(uuid) to authenticated;
grant execute on function public.next_proposal_number(uuid) to authenticated;
grant execute on function public.get_public_proposal_by_token(text) to anon, authenticated;
grant execute on function public.mark_proposal_viewed_by_token(text) to anon, authenticated;
grant execute on function public.accept_proposal_by_token(text, text, text, boolean, text, text) to anon, authenticated;
grant execute on function public.reject_proposal_by_token(text, text) to anon, authenticated;
grant execute on function public.get_proposal_by_token(text) to authenticated;

grant select, insert, update, delete on public.proposal_items to authenticated;
