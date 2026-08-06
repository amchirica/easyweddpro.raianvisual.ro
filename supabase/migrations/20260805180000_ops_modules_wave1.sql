-- Wave 1 ops modules: contracts archive, calendar, projects, tasks, payments
-- Rollback notes: drop added columns/constraints/functions; restore prior check constraints.

-- ---------------------------------------------------------------------------
-- Helper role checks
-- ---------------------------------------------------------------------------
create or replace function public.can_write_ops(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_workspace_role(
    p_workspace_id,
    array['owner', 'admin', 'manager', 'sales', 'editor']
  );
$$;

create or replace function public.can_manage_ops(p_workspace_id uuid)
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

create or replace function public.can_write_payments(p_workspace_id uuid)
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

-- ---------------------------------------------------------------------------
-- Contracts: archive
-- ---------------------------------------------------------------------------
alter table public.contracts
  add column if not exists archived_at timestamptz;

create index if not exists contracts_archived_idx
  on public.contracts (workspace_id, archived_at)
  where archived_at is not null;

-- ---------------------------------------------------------------------------
-- Calendar events
-- ---------------------------------------------------------------------------
alter table public.calendar_events
  add column if not exists description text,
  add column if not exists all_day boolean not null default false,
  add column if not exists location text,
  add column if not exists client_id uuid references public.clients (id) on delete set null,
  add column if not exists project_id uuid references public.projects (id) on delete set null,
  add column if not exists contract_id uuid references public.contracts (id) on delete set null,
  add column if not exists member_ids uuid[] not null default '{}',
  add column if not exists status text not null default 'confirmed',
  add column if not exists notes text,
  add column if not exists reminder_at timestamptz,
  add column if not exists recurrence jsonb,
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

alter table public.calendar_events drop constraint if exists calendar_events_status_check;
alter table public.calendar_events
  add constraint calendar_events_status_check
  check (status in ('confirmed', 'tentative', 'cancelled'));

alter table public.calendar_events drop constraint if exists calendar_events_time_check;
alter table public.calendar_events
  add constraint calendar_events_time_check
  check (ends_at >= starts_at);

create index if not exists calendar_events_workspace_starts_idx
  on public.calendar_events (workspace_id, starts_at)
  where deleted_at is null;

create index if not exists calendar_events_client_idx
  on public.calendar_events (workspace_id, client_id)
  where deleted_at is null;

drop policy if exists "calendar_workspace_all" on public.calendar_events;
create policy "calendar_select_member"
  on public.calendar_events for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "calendar_insert_ops"
  on public.calendar_events for insert
  with check (public.can_write_ops(workspace_id) or public.is_platform_admin());
create policy "calendar_update_ops"
  on public.calendar_events for update
  using (public.can_write_ops(workspace_id) or public.is_platform_admin())
  with check (public.can_write_ops(workspace_id) or public.is_platform_admin());
create policy "calendar_delete_ops"
  on public.calendar_events for delete
  using (public.can_manage_ops(workspace_id) or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
alter table public.projects
  add column if not exists proposal_id uuid references public.proposals (id) on delete set null,
  add column if not exists contract_id uuid references public.contracts (id) on delete set null,
  add column if not exists pipeline_key text not null default 'generic',
  add column if not exists location text,
  add column if not exists notes text,
  add column if not exists documents jsonb not null default '[]'::jsonb,
  add column if not exists budget numeric(12, 2) not null default 0,
  add column if not exists cost numeric(12, 2) not null default 0,
  add column if not exists estimated_revenue numeric(12, 2) not null default 0,
  add column if not exists currency text not null default 'RON',
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

create unique index if not exists projects_contract_unique_idx
  on public.projects (workspace_id, contract_id)
  where contract_id is not null and deleted_at is null;

create index if not exists projects_status_idx
  on public.projects (workspace_id, status)
  where deleted_at is null;

drop policy if exists "projects_workspace_all" on public.projects;
create policy "projects_select_member"
  on public.projects for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "projects_insert_ops"
  on public.projects for insert
  with check (public.can_write_ops(workspace_id) or public.is_platform_admin());
create policy "projects_update_ops"
  on public.projects for update
  using (public.can_write_ops(workspace_id) or public.is_platform_admin())
  with check (public.can_write_ops(workspace_id) or public.is_platform_admin());
create policy "projects_delete_ops"
  on public.projects for delete
  using (public.can_manage_ops(workspace_id) or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Tasks: expand statuses/priorities
-- ---------------------------------------------------------------------------
update public.tasks set priority = 'normal' where priority = 'medium';
update public.tasks set status = 'in_progress' where status = 'doing';

alter table public.tasks drop constraint if exists tasks_priority_check;
alter table public.tasks drop constraint if exists tasks_status_check;

alter table public.tasks
  add column if not exists client_id uuid references public.clients (id) on delete set null,
  add column if not exists calendar_event_id uuid references public.calendar_events (id) on delete set null,
  add column if not exists notes text,
  add column if not exists subtasks jsonb not null default '[]'::jsonb,
  add column if not exists completed_at timestamptz,
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists deleted_at timestamptz;

alter table public.tasks
  alter column priority set default 'normal',
  alter column status set default 'todo';

alter table public.tasks
  add constraint tasks_priority_check
  check (priority in ('low', 'normal', 'high', 'urgent'));

alter table public.tasks
  add constraint tasks_status_check
  check (status in ('todo', 'in_progress', 'blocked', 'done', 'cancelled'));

create index if not exists tasks_assignee_idx
  on public.tasks (workspace_id, assignee_id)
  where deleted_at is null;

create index if not exists tasks_due_idx
  on public.tasks (workspace_id, due_date)
  where deleted_at is null;

drop policy if exists "tasks_workspace_all" on public.tasks;
create policy "tasks_select_member"
  on public.tasks for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "tasks_insert_member"
  on public.tasks for insert
  with check (
    public.has_workspace_role(
      workspace_id,
      array['owner', 'admin', 'manager', 'sales', 'editor', 'collaborator']
    )
    or public.is_platform_admin()
  );
create policy "tasks_update_member"
  on public.tasks for update
  using (
    public.has_workspace_role(
      workspace_id,
      array['owner', 'admin', 'manager', 'sales', 'editor', 'collaborator']
    )
    or public.is_platform_admin()
  )
  with check (
    public.has_workspace_role(
      workspace_id,
      array['owner', 'admin', 'manager', 'sales', 'editor', 'collaborator']
    )
    or public.is_platform_admin()
  );
create policy "tasks_delete_ops"
  on public.tasks for delete
  using (public.can_manage_ops(workspace_id) or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------------
update public.payments set method = 'bank_transfer' where method = 'transfer';

alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments drop constraint if exists payments_status_check;

alter table public.payments
  add column if not exists project_id uuid references public.projects (id) on delete set null,
  add column if not exists reference text,
  add column if not exists notes text,
  add column if not exists proof_url text,
  add column if not exists currency text not null default 'RON',
  add column if not exists paid_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists deleted_at timestamptz;

alter table public.payments
  add constraint payments_method_check
  check (method is null or method in ('cash', 'bank_transfer', 'card', 'online', 'other'));

alter table public.payments
  add constraint payments_status_check
  check (status in ('pending', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'));

alter table public.payments drop constraint if exists payments_amount_nonneg;
alter table public.payments
  add constraint payments_amount_nonneg check (amount >= 0);

alter table public.payments drop constraint if exists payments_paid_nonneg;
alter table public.payments
  add constraint payments_paid_nonneg check (paid_amount >= 0);

create index if not exists payments_contract_idx
  on public.payments (workspace_id, contract_id)
  where deleted_at is null;

create index if not exists payments_due_idx
  on public.payments (workspace_id, due_date)
  where deleted_at is null;

drop policy if exists "payments_workspace_all" on public.payments;
create policy "payments_select_member"
  on public.payments for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "payments_insert_write"
  on public.payments for insert
  with check (public.can_write_payments(workspace_id) or public.is_platform_admin());
create policy "payments_update_write"
  on public.payments for update
  using (public.can_write_payments(workspace_id) or public.is_platform_admin())
  with check (public.can_write_payments(workspace_id) or public.is_platform_admin());
create policy "payments_delete_manage"
  on public.payments for delete
  using (public.can_manage_ops(workspace_id) or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Payment totals RPC (numeric, server-side)
-- ---------------------------------------------------------------------------
create or replace function public.contract_payment_totals(
  p_workspace_id uuid,
  p_contract_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_contract_total numeric(12, 2);
  v_paid numeric(12, 2);
  v_pending numeric(12, 2);
  v_overdue numeric(12, 2);
begin
  if not public.is_workspace_member(p_workspace_id) and not public.is_platform_admin() then
    raise exception 'forbidden';
  end if;

  select coalesce(total, 0) into v_contract_total
  from public.contracts
  where id = p_contract_id
    and workspace_id = p_workspace_id
    and deleted_at is null;

  if v_contract_total is null then
    raise exception 'contract_not_found';
  end if;

  select
    coalesce(sum(case when status in ('paid', 'partial') then paid_amount else 0 end), 0),
    coalesce(sum(case when status in ('pending', 'partial', 'overdue') then greatest(amount - paid_amount, 0) else 0 end), 0),
    coalesce(sum(case when status = 'overdue' or (status in ('pending', 'partial') and due_date < current_date)
      then greatest(amount - paid_amount, 0) else 0 end), 0)
  into v_paid, v_pending, v_overdue
  from public.payments
  where workspace_id = p_workspace_id
    and contract_id = p_contract_id
    and deleted_at is null
    and status <> 'cancelled';

  return jsonb_build_object(
    'contract_total', v_contract_total,
    'paid', v_paid,
    'remaining', greatest(v_contract_total - v_paid, 0),
    'pending', v_pending,
    'overdue', v_overdue
  );
end;
$$;

grant execute on function public.contract_payment_totals(uuid, uuid) to authenticated;

comment on function public.contract_payment_totals is
  'Server-side payment totals for a contract. Rollback: drop function.';
