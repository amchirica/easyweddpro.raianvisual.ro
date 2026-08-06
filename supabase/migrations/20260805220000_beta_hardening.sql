-- Beta hardening: notifications, email deliveries, feedback, stripe fields, storage assets
-- Rollback notes: drop new tables/policies/columns; restore previous storage policies.

-- ---------------------------------------------------------------------------
-- Subscriptions: Stripe entitlement fields
-- ---------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists stripe_price_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists trial_end timestamptz,
  add column if not exists billing_interval text
    check (billing_interval is null or billing_interval in ('month', 'year'));

create index if not exists subscriptions_stripe_customer_idx
  on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists subscriptions_stripe_subscription_idx
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- ---------------------------------------------------------------------------
-- Notifications (in-app)
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  action_url text,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists notifications_workspace_idx
  on public.notifications (workspace_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
  on public.notifications for select
  using (auth.uid() = user_id or public.is_platform_admin());

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id or public.is_platform_admin());

-- Inserts happen via security definer helpers / service path from server actions using member client
-- with workspace membership check in app layer. Allow insert for workspace members writing to same workspace users.
create policy "notifications_insert_member"
  on public.notifications for insert
  with check (
    public.is_workspace_member(workspace_id)
    and (
      user_id = auth.uid()
      or public.has_workspace_role(workspace_id, array['owner', 'admin', 'manager'])
      or public.is_platform_admin()
    )
  );

-- ---------------------------------------------------------------------------
-- Email deliveries (Resend journal)
-- ---------------------------------------------------------------------------
create table if not exists public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  recipient text not null,
  template text not null,
  entity_type text,
  entity_id uuid,
  provider_message_id text,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'skipped')),
  sent_at timestamptz,
  failed_at timestamptz,
  error_code text,
  error_message text,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists email_deliveries_idempotency_idx
  on public.email_deliveries (idempotency_key);

create index if not exists email_deliveries_workspace_idx
  on public.email_deliveries (workspace_id, created_at desc);

alter table public.email_deliveries enable row level security;

create policy "email_deliveries_select_manage"
  on public.email_deliveries for select
  using (
    (workspace_id is not null and public.can_manage_workspace(workspace_id))
    or public.is_platform_admin()
  );

create policy "email_deliveries_insert_member"
  on public.email_deliveries for insert
  with check (
    workspace_id is null
    or public.is_workspace_member(workspace_id)
    or public.is_platform_admin()
  );

create policy "email_deliveries_update_manage"
  on public.email_deliveries for update
  using (
    (workspace_id is not null and public.can_manage_workspace(workspace_id))
    or public.is_platform_admin()
  )
  with check (
    (workspace_id is not null and public.can_manage_workspace(workspace_id))
    or public.is_platform_admin()
  );

-- ---------------------------------------------------------------------------
-- User feedback (beta)
-- ---------------------------------------------------------------------------
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  type text not null check (type in ('bug', 'idea', 'unclear', 'general')),
  message text not null,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  page_url text,
  status text not null default 'new'
    check (status in ('new', 'triaged', 'resolved', 'dismissed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_status_idx
  on public.user_feedback (status, created_at desc);

alter table public.user_feedback enable row level security;

create policy "user_feedback_insert_auth"
  on public.user_feedback for insert
  with check (auth.uid() = user_id);

create policy "user_feedback_select_own_or_admin"
  on public.user_feedback for select
  using (auth.uid() = user_id or public.is_platform_admin());

create policy "user_feedback_update_admin"
  on public.user_feedback for update
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Stripe webhook event idempotency
-- ---------------------------------------------------------------------------
create table if not exists public.stripe_webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now(),
  payload_summary jsonb not null default '{}'::jsonb
);

alter table public.stripe_webhook_events enable row level security;

create policy "stripe_webhook_events_admin_select"
  on public.stripe_webhook_events for select
  using (public.is_platform_admin());

-- Inserts via service role / security definer only in practice; allow platform admin insert for tests
create policy "stripe_webhook_events_admin_insert"
  on public.stripe_webhook_events for insert
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Storage: workspace-assets (logos + controlled documents)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-assets',
  'workspace-assets',
  true,
  2097152,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/pdf',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {workspace_id}/logo.webp | {workspace_id}/documents/...
create policy "workspace_assets_select_public"
  on storage.objects for select
  using (bucket_id = 'workspace-assets');

create policy "workspace_assets_insert_member"
  on storage.objects for insert
  with check (
    bucket_id = 'workspace-assets'
    and public.can_manage_workspace((storage.foldername(name))[1]::uuid)
  );

create policy "workspace_assets_update_member"
  on storage.objects for update
  using (
    bucket_id = 'workspace-assets'
    and public.can_manage_workspace((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'workspace-assets'
    and public.can_manage_workspace((storage.foldername(name))[1]::uuid)
  );

create policy "workspace_assets_delete_member"
  on storage.objects for delete
  using (
    bucket_id = 'workspace-assets'
    and public.can_manage_workspace((storage.foldername(name))[1]::uuid)
  );

comment on table public.notifications is 'In-app notifications per user/workspace.';
comment on table public.email_deliveries is 'Resend delivery journal with idempotency.';
comment on table public.user_feedback is 'Beta feedback from authenticated users.';
