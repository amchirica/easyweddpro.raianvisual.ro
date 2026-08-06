-- Wave 3: extend client portal payload with payments + linked project status.
-- Requires 20260805180000 (projects/payments soft-delete + currency columns).
-- Rollback: recreate get_client_portal_by_token() from 20260805170000_fix_contract_token_hash.sql.

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
  v_project jsonb;
  v_payments jsonb;
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

  select * into v_client
  from public.clients
  where id = v_tok.client_id
    and deleted_at is null;

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
    'event_location', c.event_location,
    'accepted_at', c.accepted_at,
    'has_public_link', c.public_token_hash is not null
  )
  into v_contract
  from public.contracts c
  where c.client_id = v_client.id
    and c.workspace_id = v_tok.workspace_id
    and c.deleted_at is null
    and c.archived_at is null
  order by c.updated_at desc
  limit 1;

  -- Client-safe project snapshot: never budget/cost/notes.
  select jsonb_build_object(
    'name', pr.name,
    'status', pr.status,
    'event_date', pr.event_date,
    'progress', pr.progress,
    'location', pr.location
  )
  into v_project
  from public.projects pr
  where pr.client_id = v_client.id
    and pr.workspace_id = v_tok.workspace_id
    and pr.deleted_at is null
    and pr.archived_at is null
  order by pr.updated_at desc
  limit 1;

  -- Client-safe payment schedule (subquery + jsonb_agg for stable ordering).
  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', x.id,
          'label', x.label,
          'amount', x.amount,
          'paid_amount', x.paid_amount,
          'due_date', x.due_date,
          'status', x.status,
          'currency', coalesce(x.currency, 'RON')
        )
      )
      from (
        select
          pay.id,
          pay.label,
          pay.amount,
          pay.paid_amount,
          pay.due_date,
          pay.status,
          pay.currency,
          pay.created_at
        from public.payments pay
        where pay.client_id = v_client.id
          and pay.workspace_id = v_tok.workspace_id
          and pay.deleted_at is null
          and pay.status <> 'cancelled'
        order by coalesce(pay.due_date, pay.created_at::date) asc, pay.created_at asc
      ) x
    ),
    '[]'::jsonb
  )
  into v_payments;

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
    'contract', v_contract,
    'project', v_project,
    'payments', coalesce(v_payments, '[]'::jsonb)
  );
end;
$$;

grant execute on function public.get_client_portal_by_token(text) to anon, authenticated;

comment on function public.get_client_portal_by_token(text) is
  'Client portal payload (proposal/contract/project/payments). Apply after 20260805180000.';
