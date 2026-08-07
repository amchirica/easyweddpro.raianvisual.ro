-- Assistant events (metadata only — no question/answer text)

create table if not exists public.assistant_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  surface text not null check (surface in ('dashboard', 'admin')),
  module_key text,
  intent text,
  resolved boolean not null default false,
  provider text not null default 'knowledge',
  latency_ms integer,
  helpful boolean,
  created_at timestamptz not null default now()
);

create index if not exists assistant_events_user_created_idx
  on public.assistant_events (user_id, created_at desc);

create index if not exists assistant_events_created_idx
  on public.assistant_events (created_at desc);

create index if not exists assistant_events_module_idx
  on public.assistant_events (module_key, created_at desc);

alter table public.assistant_events enable row level security;

create policy "assistant_events_select_own_or_admin"
  on public.assistant_events for select
  to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());

create policy "assistant_events_insert_own"
  on public.assistant_events for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "assistant_events_update_own_or_admin"
  on public.assistant_events for update
  to authenticated
  using (user_id = auth.uid() or public.is_platform_admin())
  with check (user_id = auth.uid() or public.is_platform_admin());

grant select, insert, update on public.assistant_events to authenticated;
