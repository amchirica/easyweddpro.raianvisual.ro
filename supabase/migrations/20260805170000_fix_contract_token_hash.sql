-- Fix contract public token hashing on Supabase.
-- digest() lives in the extensions schema; functions with search_path=public
-- could not resolve it (PostgREST 404 / "digest(bytea, unknown) does not exist").

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

-- Ensure public contract RPCs can resolve hash_token + digest.
create or replace function public.get_public_contract_by_token(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
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
set search_path = public, extensions
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
set search_path = public, extensions
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

create or replace function public.get_client_portal_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
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

grant execute on function public.hash_token(text) to anon, authenticated;
grant execute on function public.get_public_contract_by_token(text) to anon, authenticated;
grant execute on function public.mark_contract_viewed_by_token(text) to anon, authenticated;
grant execute on function public.accept_contract_by_token(text, text, text, boolean, boolean, text, text, text) to anon, authenticated;
grant execute on function public.get_client_portal_by_token(text) to anon, authenticated;
