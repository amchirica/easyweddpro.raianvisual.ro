-- Wave 2: workspace_templates, invitations, logo storage
-- Rollback: drop tables/policies/bucket; remove columns if any.

-- ---------------------------------------------------------------------------
-- Workspace templates (generic)
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type text not null
    check (type in ('proposal', 'contract', 'email', 'task', 'project', 'pipeline', 'automation')),
  name text not null,
  category text not null default 'general',
  business_type text,
  content jsonb not null default '{}'::jsonb,
  variables text[] not null default '{}',
  is_default boolean not null default false,
  archived_at timestamptz,
  deleted_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_templates_workspace_type_idx
  on public.workspace_templates (workspace_id, type)
  where deleted_at is null;

create unique index if not exists workspace_templates_default_idx
  on public.workspace_templates (workspace_id, type)
  where is_default = true and deleted_at is null and archived_at is null;

alter table public.workspace_templates enable row level security;

create policy "workspace_templates_select_member"
  on public.workspace_templates for select
  using (public.is_workspace_member(workspace_id) or public.is_platform_admin());
create policy "workspace_templates_write"
  on public.workspace_templates for all
  using (public.can_manage_ops(workspace_id) or public.is_platform_admin())
  with check (public.can_manage_ops(workspace_id) or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Team invitations (token hashed)
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role text not null
    check (role in ('admin', 'manager', 'sales', 'editor', 'collaborator', 'viewer')),
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists workspace_invitations_workspace_idx
  on public.workspace_invitations (workspace_id)
  where revoked_at is null and accepted_at is null;

create unique index if not exists workspace_invitations_token_hash_idx
  on public.workspace_invitations (token_hash);

alter table public.workspace_invitations enable row level security;

create policy "workspace_invitations_select_manage"
  on public.workspace_invitations for select
  using (public.can_manage_members(workspace_id) or public.is_platform_admin());
create policy "workspace_invitations_write_manage"
  on public.workspace_invitations for all
  using (public.can_manage_members(workspace_id) or public.is_platform_admin())
  with check (public.can_manage_members(workspace_id) or public.is_platform_admin());

-- Member deactivate flag
alter table public.workspace_members
  add column if not exists disabled_at timestamptz;

-- ---------------------------------------------------------------------------
-- Logo storage bucket
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-logos',
  'workspace-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "workspace_logos_select_public"
  on storage.objects for select
  using (bucket_id = 'workspace-logos');

create policy "workspace_logos_insert_member"
  on storage.objects for insert
  with check (
    bucket_id = 'workspace-logos'
    and public.can_manage_workspace((storage.foldername(name))[1]::uuid)
  );

create policy "workspace_logos_update_member"
  on storage.objects for update
  using (
    bucket_id = 'workspace-logos'
    and public.can_manage_workspace((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'workspace-logos'
    and public.can_manage_workspace((storage.foldername(name))[1]::uuid)
  );

create policy "workspace_logos_delete_member"
  on storage.objects for delete
  using (
    bucket_id = 'workspace-logos'
    and public.can_manage_workspace((storage.foldername(name))[1]::uuid)
  );
