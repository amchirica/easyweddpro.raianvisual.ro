-- EasyWedd Pro — contracts MVP + portal tokens + public RPCs
-- Apply after 20260805140000_roles_and_proposals.sql

-- ===========================================================================
-- 1. Extend contracts
-- ===========================================================================
alter table public.contracts
  add column if not exists lead_id uuid references public.leads (id) on delete set null,
  add column if not exists contract_number text,
  add column if not exists currency text not null default 'RON',
  add column if not exists subtotal numeric(12, 2) not null default 0,
  add column if not exists discount_amount numeric(12, 2) not null default 0,
  add column if not exists tax_amount numeric(12, 2) not null default 0,
  add column if not exists total numeric(12, 2) not null default 0,
  add column if not exists deposit_amount numeric(12, 2) not null default 0,
  add column if not exists remaining_amount numeric(12, 2) not null default 0,
  add column if not exists valid_from date,
  add column if not exists valid_until date,
  add column if not exists event_location text,
  add column if not exists public_token text,
  add column if not exists public_token_hash text,
  add column if not exists public_token_expires_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists viewed_at timestamptz,
  add column if not exists accepted_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists terms text,
  add column if not exists snapshot jsonb,
  add column if not exists acceptance jsonb,
  add column if not exists contract_content_hash text,
  add column if not exists previous_contract_id uuid references public.contracts (id) on delete set null,
  add column if not exists template_id uuid,
  add column if not exists metadata jsonb default '{}'::jsonb;

-- Sync legacy amount/deposit into new columns where needed
update public.contracts
set
  total = coalesce(nullif(total, 0), amount, 0),
  subtotal = coalesce(nullif(subtotal, 0), amount, 0),
  deposit_amount = coalesce(nullif(deposit_amount, 0), deposit, 0),
  remaining_amount = greatest(
    coalesce(nullif(total, 0), amount, 0) - coalesce(nullif(deposit_amount, 0), deposit, 0),
    0
  )
where total = 0 or remaining_amount = 0;

alter table public.contracts drop constraint if exists contracts_status_check;

-- Migrate legacy statuses before applying the new check constraint
update public.contracts set status = 'published' where status = 'sent';
update public.contracts set status = 'accepted' where status in ('active', 'completed');

alter table public.contracts
  add constraint contracts_status_check
  check (status in ('draft', 'published', 'viewed', 'accepted', 'expired', 'cancelled', 'superseded'));

alter table public.contracts
  drop constraint if exists contracts_money_nonneg;
alter table public.contracts
  add constraint contracts_money_nonneg
  check (
    subtotal >= 0 and discount_amount >= 0 and tax_amount >= 0
    and total >= 0 and deposit_amount >= 0 and remaining_amount >= 0
  );

create unique index if not exists contracts_workspace_number_uidx
  on public.contracts (workspace_id, contract_number)
  where contract_number is not null and deleted_at is null;

create unique index if not exists contracts_public_token_hash_uidx
  on public.contracts (public_token_hash)
  where public_token_hash is not null;

create index if not exists contracts_workspace_status_idx
  on public.contracts (workspace_id, status)
  where deleted_at is null;

create index if not exists contracts_client_idx
  on public.contracts (workspace_id, client_id)
  where deleted_at is null;

create index if not exists contracts_proposal_idx
  on public.contracts (proposal_id)
  where proposal_id is not null;

-- Ensure version has default
alter table public.contracts
  alter column version set default 1;

-- ===========================================================================
-- 2. Contract templates
-- ===========================================================================
create table if not exists public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  category text not null default 'general',
  content jsonb not null default '{}'::jsonb,
  terms text,
  variables text[] default '{}',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contract_templates_workspace_idx
  on public.contract_templates (workspace_id);

alter table public.contract_templates enable row level security;

create policy "contract_templates_select_member"
  on public.contract_templates for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "contract_templates_write"
  on public.contract_templates for all
  using (public.can_write_contracts(workspace_id))
  with check (public.can_write_contracts(workspace_id));

alter table public.contracts
  drop constraint if exists contracts_template_id_fkey;
alter table public.contracts
  add constraint contracts_template_id_fkey
  foreign key (template_id) references public.contract_templates (id) on delete set null;

-- ===========================================================================
-- 3. Client portal tokens (hashed)
-- ===========================================================================
create table if not exists public.client_portal_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists client_portal_tokens_client_idx
  on public.client_portal_tokens (client_id)
  where revoked_at is null;

alter table public.client_portal_tokens enable row level security;

create policy "portal_tokens_select_member"
  on public.client_portal_tokens for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "portal_tokens_write"
  on public.client_portal_tokens for all
  using (public.can_manage_crm(workspace_id) or public.can_write_contracts(workspace_id))
  with check (public.can_manage_crm(workspace_id) or public.can_write_contracts(workspace_id));

-- ===========================================================================
-- 4. Counters + helpers
-- ===========================================================================
create or replace function public.next_contract_number(p_workspace_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year text := to_char(timezone('utc', now()), 'YYYY');
  v_key text := 'contract_' || v_year;
  v_next bigint;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if not public.can_write_contracts(p_workspace_id) then
    raise exception 'forbidden';
  end if;

  insert into public.workspace_counters (workspace_id, counter_key, current_value)
  values (p_workspace_id, v_key, 1)
  on conflict (workspace_id, counter_key)
  do update set current_value = public.workspace_counters.current_value + 1
  returning current_value into v_next;

  return 'CTR-' || v_year || '-' || lpad(v_next::text, 4, '0');
end;
$$;

create extension if not exists pgcrypto with schema extensions;

create or replace function public.hash_token(p_token text)
returns text
language sql
immutable
parallel safe
set search_path = public, extensions
as $$
  select encode(
    extensions.digest(convert_to(trim(p_token), 'UTF8'), 'sha256'::text),
    'hex'
  );
$$;

-- ===========================================================================
-- 5. Create contract from accepted proposal (atomic)
-- ===========================================================================
create or replace function public.create_contract_from_proposal(p_proposal_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_prop public.proposals%rowtype;
  v_contract_id uuid;
  v_client_name text;
  v_ws_name text;
  v_deposit numeric(12,2);
  v_remaining numeric(12,2);
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_prop
  from public.proposals
  where id = p_proposal_id and deleted_at is null
  for update;

  if not found then
    raise exception 'proposal_not_found';
  end if;

  if not public.can_write_contracts(v_prop.workspace_id) then
    raise exception 'forbidden';
  end if;

  if v_prop.status <> 'accepted' then
    raise exception 'proposal_not_accepted';
  end if;

  if v_prop.contract_id is not null then
    return v_prop.contract_id;
  end if;

  declare
    v_client_email text;
    v_client_phone text;
    v_ws_email text;
    v_ws_phone text;
    v_items jsonb;
    v_services jsonb;
  begin
  select name, email, phone into v_client_name, v_client_email, v_client_phone
  from public.clients where id = v_prop.client_id;
  select name, null::text, null::text into v_ws_name, v_ws_email, v_ws_phone
  from public.workspaces where id = v_prop.workspace_id;

  v_deposit := round(coalesce(v_prop.total, 0) * 0.30, 2);
  v_remaining := greatest(coalesce(v_prop.total, 0) - v_deposit, 0);
  v_items := coalesce(v_prop.snapshot -> 'items', '[]'::jsonb);

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'name', coalesce(i ->> 'name', 'Serviciu'),
      'description', i ->> 'description',
      'quantity', coalesce((i ->> 'quantity')::numeric, 1),
      'unitPrice', coalesce((i ->> 'unit_price')::numeric, (i ->> 'unitPrice')::numeric, 0),
      'discount', coalesce((i ->> 'discount')::numeric, 0),
      'lineTotal', coalesce((i ->> 'line_total')::numeric, (i ->> 'lineTotal')::numeric, 0)
    )
  ), '[]'::jsonb)
  into v_services
  from jsonb_array_elements(v_items) as i;

  insert into public.contracts (
    workspace_id, client_id, lead_id, proposal_id, title, status, currency,
    subtotal, discount_amount, tax_amount, total, deposit_amount, remaining_amount,
    amount, deposit, event_date, terms, snapshot, content, created_by, version
  ) values (
    v_prop.workspace_id,
    v_prop.client_id,
    v_prop.lead_id,
    v_prop.id,
    'Contract — ' || v_prop.title,
    'draft',
    coalesce(v_prop.currency, 'RON'),
    coalesce(v_prop.subtotal, v_prop.total, 0),
    coalesce(v_prop.discount_amount, 0),
    coalesce(v_prop.tax_amount, 0),
    coalesce(v_prop.total, 0),
    v_deposit,
    v_remaining,
    coalesce(v_prop.total, 0),
    v_deposit,
    coalesce((v_prop.snapshot ->> 'event_date')::date, null),
    v_prop.terms,
    jsonb_build_object(
      'source', 'proposal',
      'proposal_id', v_prop.id,
      'proposal_number', v_prop.proposal_number,
      'proposal_accepted_at', v_prop.accepted_at,
      'provider', jsonb_build_object('name', v_ws_name, 'email', v_ws_email, 'phone', v_ws_phone),
      'client', jsonb_build_object('name', v_client_name, 'email', v_client_email, 'phone', v_client_phone),
      'items', v_services,
      'sections', jsonb_build_object(
        'provider_obligations', 'Furnizorul va presta serviciile descrise în anexă.',
        'client_obligations', 'Clientul va respecta termenele de plată și programul agreat.',
        'delivery', 'Livrarea se face conform termenilor ofertei acceptate.',
        'cancellation', 'Anularea se face conform clauzelor din termeni.',
        'force_majeure', 'Cazurile de forță majoră suspendă obligațiile pe durata evenimentului.',
        'copyright', 'Drepturile de autor asupra materialelor rămân ale furnizorului, cu licență de uz personal pentru client.',
        'privacy', 'Datele personale sunt prelucrate conform politicii de confidențialitate.',
        'special_clauses', ''
      ),
      'currency', coalesce(v_prop.currency, 'RON'),
      'subtotal', coalesce(v_prop.subtotal, 0),
      'discount_amount', coalesce(v_prop.discount_amount, 0),
      'tax_amount', coalesce(v_prop.tax_amount, 0),
      'total', coalesce(v_prop.total, 0),
      'deposit_amount', v_deposit,
      'remaining_amount', v_remaining,
      'terms', v_prop.terms,
      'title', 'Contract — ' || v_prop.title,
      'version', 1
    ),
    jsonb_build_object(
      'provider', jsonb_build_object('name', coalesce(v_ws_name, ''), 'email', v_ws_email, 'phone', v_ws_phone),
      'client', jsonb_build_object('name', coalesce(v_client_name, ''), 'email', v_client_email, 'phone', v_client_phone),
      'services', v_services,
      'installments', jsonb_build_array(
        jsonb_build_object('label', 'Avans', 'amount', v_deposit),
        jsonb_build_object('label', 'Restant', 'amount', v_remaining)
      ),
      'sections', jsonb_build_object(
        'provider_obligations', 'Furnizorul va presta serviciile descrise în anexă.',
        'client_obligations', 'Clientul va respecta termenele de plată și programul agreat.',
        'delivery', 'Livrarea se face conform termenilor ofertei acceptate.',
        'cancellation', 'Anularea se face conform clauzelor din termeni.',
        'force_majeure', 'Cazurile de forță majoră suspendă obligațiile pe durata evenimentului.',
        'copyright', 'Drepturile de autor asupra materialelor rămân ale furnizorului, cu licență de uz personal pentru client.',
        'privacy', 'Datele personale sunt prelucrate conform politicii de confidențialitate.',
        'special_clauses', '',
        'notes', ''
      )
    ),
    v_uid,
    1
  )
  returning id into v_contract_id;
  end;

  update public.proposals
  set contract_id = v_contract_id, updated_at = now()
  where id = v_prop.id;

  insert into public.activity_logs (
    workspace_id, actor_id, entity_type, entity_id, action, title, description, metadata
  ) values
    (
      v_prop.workspace_id, v_uid, 'proposal', v_prop.id, 'proposal.converted_to_contract',
      'Ofertă convertită în contract', 'Contract draft creat din ofertă acceptată.',
      jsonb_build_object('contract_id', v_contract_id)
    ),
    (
      v_prop.workspace_id, v_uid, 'contract', v_contract_id, 'contract.created_from_proposal',
      'Contract creat din ofertă', coalesce(v_prop.proposal_number, v_prop.title),
      jsonb_build_object('proposal_id', v_prop.id)
    );

  return v_contract_id;
end;
$$;

-- ===========================================================================
-- 6. Public contract RPCs (hash lookup)
-- ===========================================================================
create or replace function public.get_public_contract_by_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_row public.contracts%rowtype;
  v_ws public.workspaces%rowtype;
  v_client public.clients%rowtype;
  v_effective text;
begin
  if p_token is null or length(trim(p_token)) < 24 then
    return null;
  end if;

  v_hash := public.hash_token(p_token);

  select * into v_row
  from public.contracts
  where public_token_hash = v_hash
    and deleted_at is null
  limit 1;

  if not found then
    return null;
  end if;

  if v_row.status = 'draft' then
    return null;
  end if;

  if v_row.public_token_expires_at is not null and v_row.public_token_expires_at < now() then
    v_effective := 'expired';
  elsif v_row.status = 'cancelled' then
    v_effective := 'cancelled';
  elsif v_row.status = 'superseded' then
    v_effective := 'superseded';
  elsif v_row.status = 'accepted' then
    v_effective := 'accepted';
  elsif v_row.valid_until is not null
     and v_row.valid_until < (timezone('utc', now()))::date
     and v_row.status not in ('accepted', 'cancelled', 'superseded') then
    v_effective := 'expired';
  else
    v_effective := v_row.status;
  end if;

  select * into v_ws from public.workspaces where id = v_row.workspace_id;
  select * into v_client from public.clients where id = v_row.client_id;

  return jsonb_build_object(
    'id', v_row.id,
    'contract_number', v_row.contract_number,
    'title', v_row.title,
    'status', v_effective,
    'currency', v_row.currency,
    'subtotal', v_row.subtotal,
    'discount_amount', v_row.discount_amount,
    'tax_amount', v_row.tax_amount,
    'total', v_row.total,
    'deposit_amount', v_row.deposit_amount,
    'remaining_amount', v_row.remaining_amount,
    'event_date', v_row.event_date,
    'event_location', v_row.event_location,
    'valid_until', v_row.valid_until,
    'published_at', v_row.published_at,
    'accepted_at', v_row.accepted_at,
    'version', v_row.version,
    'terms', v_row.terms,
    'content', v_row.content,
    'snapshot', v_row.snapshot,
    'contract_content_hash', v_row.contract_content_hash,
    'provider_name', v_ws.name,
    'brand_accent', v_ws.brand_accent,
    'logo_url', v_ws.logo_url,
    'client_name', coalesce(v_client.name, v_row.snapshot ->> 'client_name'),
    'client_email', v_client.email,
    'acceptance', case when v_row.status = 'accepted' then
      jsonb_build_object(
        'full_name', v_row.acceptance ->> 'full_name',
        'accepted_at', v_row.accepted_at,
        'document_hash', v_row.acceptance ->> 'document_hash'
      )
    else null end
  );
end;
$$;

create or replace function public.mark_contract_viewed_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text := public.hash_token(p_token);
  v_id uuid;
  v_workspace_id uuid;
  v_status text;
  v_viewed_at timestamptz;
begin
  select id, workspace_id, status, viewed_at
  into v_id, v_workspace_id, v_status, v_viewed_at
  from public.contracts
  where public_token_hash = v_hash
    and deleted_at is null
    and status in ('published', 'viewed')
  for update;

  if not found then
    return public.get_public_contract_by_token(p_token);
  end if;

  if v_viewed_at is null then
    update public.contracts
    set
      viewed_at = now(),
      status = case when status = 'published' then 'viewed' else status end,
      updated_at = now()
    where id = v_id;

    insert into public.activity_logs (
      workspace_id, actor_id, entity_type, entity_id, action, title, description, metadata
    ) values (
      v_workspace_id, null, 'contract', v_id, 'contract.viewed',
      'Contract vizualizat',
      'Clientul a deschis linkul public al contractului.',
      jsonb_build_object('source', 'public_token')
    );
  end if;

  return public.get_public_contract_by_token(p_token);
end;
$$;

create or replace function public.accept_contract_by_token(
  p_token text,
  p_full_name text,
  p_email text,
  p_accepted_terms boolean,
  p_accepted_privacy boolean default true,
  p_document_hash text default null,
  p_ip text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text := public.hash_token(p_token);
  v_row public.contracts%rowtype;
  v_recent int;
begin
  if coalesce(p_accepted_terms, false) is not true then
    raise exception 'terms_required';
  end if;
  if coalesce(p_accepted_privacy, false) is not true then
    raise exception 'privacy_required';
  end if;
  if p_full_name is null or length(trim(p_full_name)) < 2 then
    raise exception 'name_required';
  end if;
  if p_email is null or position('@' in p_email) = 0 then
    raise exception 'email_required';
  end if;

  -- Soft rate limit: max 10 acceptance attempts / token / 10 minutes via activity
  select count(*) into v_recent
  from public.activity_logs
  where action = 'contract.accept_attempt'
    and metadata ->> 'token_hash_prefix' = left(v_hash, 12)
    and created_at > now() - interval '10 minutes';

  if v_recent >= 10 then
    raise exception 'rate_limited';
  end if;

  insert into public.activity_logs (
    workspace_id, actor_id, entity_type, entity_id, action, title, description, metadata
  )
  select c.workspace_id, null, 'contract', c.id, 'contract.accept_attempt',
    'Încercare acceptare contract', 'Cerere publică de acceptare.',
    jsonb_build_object('token_hash_prefix', left(v_hash, 12))
  from public.contracts c
  where c.public_token_hash = v_hash
  limit 1;

  select * into v_row
  from public.contracts
  where public_token_hash = v_hash
    and deleted_at is null
  for update;

  if not found or v_row.status = 'draft' then
    raise exception 'contract_not_found';
  end if;

  if v_row.status = 'accepted' then
    return jsonb_build_object('ok', true, 'status', 'accepted', 'already', true);
  end if;

  if v_row.status in ('cancelled', 'superseded') then
    raise exception 'contract_not_acceptable';
  end if;

  if v_row.public_token_expires_at is not null and v_row.public_token_expires_at < now() then
    raise exception 'contract_expired';
  end if;

  if v_row.valid_until is not null
     and v_row.valid_until < (timezone('utc', now()))::date then
    raise exception 'contract_expired';
  end if;

  if p_document_hash is not null
     and v_row.contract_content_hash is not null
     and p_document_hash <> v_row.contract_content_hash then
    raise exception 'hash_mismatch';
  end if;

  update public.contracts
  set
    status = 'accepted',
    accepted_at = now(),
    updated_at = now(),
    acceptance = jsonb_build_object(
      'full_name', trim(p_full_name),
      'email', lower(trim(p_email)),
      'accepted_terms', true,
      'accepted_privacy', true,
      'accepted_at', now(),
      'ip', nullif(trim(coalesce(p_ip, '')), ''),
      'user_agent', left(nullif(trim(coalesce(p_user_agent, '')), ''), 400),
      'document_hash', coalesce(p_document_hash, v_row.contract_content_hash),
      'version', v_row.version,
      'kind', 'digital_acceptance'
    )
  where id = v_row.id
    and status not in ('accepted', 'cancelled', 'superseded');

  if not found then
    -- Concurrent accept won the race
    return jsonb_build_object('ok', true, 'status', 'accepted', 'already', true);
  end if;

  insert into public.activity_logs (
    workspace_id, actor_id, entity_type, entity_id, action, title, description, metadata
  ) values (
    v_row.workspace_id, null, 'contract', v_row.id, 'contract.accepted',
    'Contract acceptat',
    'Acceptare digitală a contractului de către client.',
    jsonb_build_object(
      'email', lower(trim(p_email)),
      'full_name', trim(p_full_name),
      'version', v_row.version
    )
  );

  return jsonb_build_object('ok', true, 'status', 'accepted', 'already', false);
end;
$$;

-- ===========================================================================
-- 7. Portal RPC
-- ===========================================================================
create or replace function public.get_client_portal_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
  v_tok public.client_portal_tokens%rowtype;
  v_client public.clients%rowtype;
  v_ws public.workspaces%rowtype;
  v_proposal jsonb;
  v_contract jsonb;
begin
  if p_token is null or length(trim(p_token)) < 24 then
    return null;
  end if;

  v_hash := public.hash_token(p_token);

  select * into v_tok
  from public.client_portal_tokens
  where token_hash = v_hash
    and revoked_at is null
  limit 1;

  if not found then
    return null;
  end if;

  if v_tok.expires_at is not null and v_tok.expires_at < now() then
    return null;
  end if;

  update public.client_portal_tokens
  set last_accessed_at = now()
  where id = v_tok.id;

  select * into v_client from public.clients where id = v_tok.client_id and deleted_at is null;
  if not found then
    return null;
  end if;

  select * into v_ws from public.workspaces where id = v_tok.workspace_id;

  select jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'status', p.status,
    'total', p.total,
    'currency', p.currency,
    'proposal_number', p.proposal_number,
    'valid_until', p.valid_until
  )
  into v_proposal
  from public.proposals p
  where p.client_id = v_client.id
    and p.workspace_id = v_tok.workspace_id
    and p.deleted_at is null
  order by p.updated_at desc
  limit 1;

  select jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'status', c.status,
    'total', c.total,
    'deposit_amount', c.deposit_amount,
    'remaining_amount', c.remaining_amount,
    'currency', c.currency,
    'contract_number', c.contract_number,
    'event_date', c.event_date,
    'accepted_at', c.accepted_at,
    'has_public_link', c.public_token_hash is not null
  )
  into v_contract
  from public.contracts c
  where c.client_id = v_client.id
    and c.workspace_id = v_tok.workspace_id
    and c.deleted_at is null
  order by c.updated_at desc
  limit 1;

  insert into public.activity_logs (
    workspace_id, actor_id, entity_type, entity_id, action, title, description, metadata
  ) values (
    v_tok.workspace_id, null, 'client', v_client.id, 'portal.accessed',
    'Acces portal client', 'Portal accesat prin token.',
    jsonb_build_object('source', 'portal_token')
  );

  return jsonb_build_object(
    'client', jsonb_build_object(
      'name', v_client.name,
      'email', v_client.email,
      'event_date', v_client.event_date,
      'event_type', v_client.event_type,
      'city', v_client.city
    ),
    'provider', jsonb_build_object(
      'name', v_ws.name,
      'brand_accent', v_ws.brand_accent,
      'logo_url', v_ws.logo_url,
      'city', v_ws.city
    ),
    'proposal', v_proposal,
    'contract', v_contract
  );
end;
$$;

-- ===========================================================================
-- 8. Grants
-- ===========================================================================
grant select, insert, update, delete on public.contract_templates to authenticated;
grant select, insert, update, delete on public.client_portal_tokens to authenticated;

grant execute on function public.next_contract_number(uuid) to authenticated;
grant execute on function public.hash_token(text) to anon, authenticated;
grant execute on function public.create_contract_from_proposal(uuid) to authenticated;
grant execute on function public.get_public_contract_by_token(text) to anon, authenticated;
grant execute on function public.mark_contract_viewed_by_token(text) to anon, authenticated;
grant execute on function public.accept_contract_by_token(text, text, text, boolean, boolean, text, text, text) to anon, authenticated;
grant execute on function public.get_client_portal_by_token(text) to anon, authenticated;
