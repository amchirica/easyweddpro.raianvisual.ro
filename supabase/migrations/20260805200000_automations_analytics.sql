-- Wave 3: automations engine + analytics RPCs
-- Rollback: drop automation_runs / functions / columns.

alter table public.automations
  add column if not exists conditions jsonb not null default '[]'::jsonb,
  add column if not exists actions jsonb not null default '[]'::jsonb,
  add column if not exists description text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz,
  add column if not exists created_by uuid references auth.users (id) on delete set null;

drop policy if exists "automations_workspace_all" on public.automations;
create policy "automations_select_member"
  on public.automations for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "automations_write_manage"
  on public.automations for all
  using (public.can_manage_ops(workspace_id) or public.is_platform_admin())
  with check (public.can_manage_ops(workspace_id) or public.is_platform_admin());

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  trigger_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'success', 'failed', 'skipped')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists automation_runs_idempotency_idx
  on public.automation_runs (workspace_id, idempotency_key);

create index if not exists automation_runs_automation_idx
  on public.automation_runs (automation_id, started_at desc);

alter table public.automation_runs enable row level security;

create policy "automation_runs_select_member"
  on public.automation_runs for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "automation_runs_write_manage"
  on public.automation_runs for all
  using (public.can_manage_ops(workspace_id) or public.is_platform_admin())
  with check (public.can_manage_ops(workspace_id) or public.is_platform_admin());

-- Analytics aggregates (grouped by currency, no FX conversion)
create or replace function public.workspace_analytics_summary(
  p_workspace_id uuid,
  p_from date default null,
  p_to date default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_from timestamptz;
  v_to timestamptz;
  v_result jsonb;
begin
  if not public.is_workspace_member(p_workspace_id) and not public.is_platform_admin() then
    raise exception 'forbidden';
  end if;

  v_from := coalesce(p_from::timestamptz, now() - interval '90 days');
  v_to := coalesce((p_to + 1)::timestamptz, now());

  select jsonb_build_object(
    'leads_created', (
      select count(*) from public.leads
      where workspace_id = p_workspace_id and deleted_at is null
        and created_at >= v_from and created_at < v_to
    ),
    'leads_by_source', coalesce((
      select jsonb_object_agg(coalesce(source, 'unknown'), cnt)
      from (
        select source, count(*)::int as cnt
        from public.leads
        where workspace_id = p_workspace_id and deleted_at is null
          and created_at >= v_from and created_at < v_to
        group by source
      ) s
    ), '{}'::jsonb),
    'proposals_sent', (
      select count(*) from public.proposals
      where workspace_id = p_workspace_id and deleted_at is null
        and status in ('sent', 'viewed', 'accepted', 'rejected', 'expired')
        and created_at >= v_from and created_at < v_to
    ),
    'proposals_accepted', (
      select count(*) from public.proposals
      where workspace_id = p_workspace_id and deleted_at is null
        and status = 'accepted'
        and accepted_at >= v_from and accepted_at < v_to
    ),
    'contracts_created', (
      select count(*) from public.contracts
      where workspace_id = p_workspace_id and deleted_at is null
        and created_at >= v_from and created_at < v_to
    ),
    'contracts_accepted', (
      select count(*) from public.contracts
      where workspace_id = p_workspace_id and deleted_at is null
        and status = 'accepted'
        and accepted_at >= v_from and accepted_at < v_to
    ),
    'contracted_by_currency', coalesce((
      select jsonb_object_agg(currency, total)
      from (
        select currency, sum(total)::numeric as total
        from public.contracts
        where workspace_id = p_workspace_id and deleted_at is null
          and status = 'accepted'
          and accepted_at >= v_from and accepted_at < v_to
        group by currency
      ) c
    ), '{}'::jsonb),
    'collected_by_currency', coalesce((
      select jsonb_object_agg(currency, total)
      from (
        select currency, sum(paid_amount)::numeric as total
        from public.payments
        where workspace_id = p_workspace_id and deleted_at is null
          and status in ('paid', 'partial')
          and coalesce(paid_at, updated_at) >= v_from
          and coalesce(paid_at, updated_at) < v_to
        group by currency
      ) p
    ), '{}'::jsonb),
    'outstanding_by_currency', coalesce((
      select jsonb_object_agg(currency, total)
      from (
        select currency, sum(greatest(amount - paid_amount, 0))::numeric as total
        from public.payments
        where workspace_id = p_workspace_id and deleted_at is null
          and status in ('pending', 'partial', 'overdue')
        group by currency
      ) o
    ), '{}'::jsonb),
    'active_projects', (
      select count(*) from public.projects
      where workspace_id = p_workspace_id and deleted_at is null
        and archived_at is null
        and status <> 'completed'
    ),
    'overdue_tasks', (
      select count(*) from public.tasks
      where workspace_id = p_workspace_id and deleted_at is null
        and status not in ('done', 'cancelled')
        and due_date is not null and due_date < current_date
    ),
    'upcoming_events', (
      select count(*) from public.calendar_events
      where workspace_id = p_workspace_id and deleted_at is null
        and starts_at >= now()
        and starts_at < now() + interval '30 days'
        and status <> 'cancelled'
    )
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.workspace_analytics_summary(uuid, date, date) to authenticated;
