-- Background jobs infrastructure: cron_runs, workspace_statistics, notification idempotency.
-- Rollback: drop tables/indexes/columns added below (non-destructive to legal docs).

-- ---------------------------------------------------------------------------
-- cron_runs — execution journal (no secrets / PII)
-- ---------------------------------------------------------------------------
create table if not exists public.cron_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  success boolean not null default false,
  processed integer not null default 0,
  errors integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cron_runs_job_started_idx
  on public.cron_runs (job, started_at desc);

create index if not exists cron_runs_started_idx
  on public.cron_runs (started_at desc);

alter table public.cron_runs enable row level security;

create policy "cron_runs_admin_select"
  on public.cron_runs for select
  using (public.is_platform_admin());

-- Inserts/updates via service role only (no public write policies).

comment on table public.cron_runs is 'Background job execution journal for Cloudflare cron / internal runners.';

-- ---------------------------------------------------------------------------
-- workspace_statistics — pre-aggregated dashboard snapshot
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_statistics (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  snapshot_date date not null default (timezone('utc', now()))::date,
  leads_count integer not null default 0,
  leads_won_count integer not null default 0,
  conversion_rate numeric(8, 4),
  contracts_count integer not null default 0,
  contracts_accepted_count integer not null default 0,
  revenue_by_currency jsonb not null default '{}'::jsonb,
  outstanding_by_currency jsonb not null default '{}'::jsonb,
  overdue_payments_count integer not null default 0,
  active_projects_count integer not null default 0,
  overdue_tasks_count integer not null default 0,
  upcoming_events_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_statistics_computed_idx
  on public.workspace_statistics (computed_at desc);

alter table public.workspace_statistics enable row level security;

create policy "workspace_statistics_select_member"
  on public.workspace_statistics for select
  using (public.is_workspace_member(workspace_id));

create policy "workspace_statistics_admin_select"
  on public.workspace_statistics for select
  using (public.is_platform_admin());

comment on table public.workspace_statistics is 'Cron-built analytics snapshot per workspace; dashboard reads this first.';

-- ---------------------------------------------------------------------------
-- notifications.idempotency_key — prevent duplicate cron fan-out
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists idempotency_key text;

create unique index if not exists notifications_idempotency_uidx
  on public.notifications (workspace_id, user_id, idempotency_key)
  where idempotency_key is not null;

-- ---------------------------------------------------------------------------
-- Helpful indexes for cron scanners (idempotent)
-- ---------------------------------------------------------------------------
create index if not exists payments_due_scan_idx
  on public.payments (due_date, status)
  where deleted_at is null and status in ('pending', 'partial');

create index if not exists tasks_due_scan_idx
  on public.tasks (due_date, status)
  where deleted_at is null and status not in ('done', 'cancelled');

create index if not exists calendar_events_starts_scan_idx
  on public.calendar_events (starts_at)
  where deleted_at is null and status <> 'cancelled';

create index if not exists proposals_expiry_scan_idx
  on public.proposals (public_token_expires_at)
  where public_token is not null;

create index if not exists contracts_token_expiry_scan_idx
  on public.contracts (public_token_expires_at)
  where public_token_hash is not null;

create index if not exists client_portal_tokens_expiry_idx
  on public.client_portal_tokens (expires_at)
  where revoked_at is null;

create index if not exists workspace_invitations_expiry_idx
  on public.workspace_invitations (expires_at)
  where accepted_at is null and revoked_at is null;
