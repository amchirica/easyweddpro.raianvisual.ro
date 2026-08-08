-- Fix infinite recursion on platform_admins RLS.
-- Cause: policies on platform_admins called is_platform_admin() / queried
-- platform_admins again, which re-entered the same policies.
-- Fix: SECURITY DEFINER helpers (owner bypasses RLS) + policies that never
-- re-query platform_admins directly.

-- ---------------------------------------------------------------------------
-- Safe helpers — SECURITY DEFINER, controlled search_path, owner bypasses RLS
-- ---------------------------------------------------------------------------
create or replace function public.is_platform_admin_user(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    check_user_id is not null
    and (
      exists (
        select 1
        from public.platform_admins pa
        where pa.user_id = check_user_id
          and pa.disabled_at is null
      )
      or coalesce(
        (
          select p.is_platform_admin
          from public.profiles p
          where p.id = check_user_id
        ),
        false
      )
    );
$$;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin_user(auth.uid());
$$;

create or replace function public.is_platform_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
      and pa.disabled_at is null
      and pa.role = 'platform_super_admin'
  )
  or coalesce(
    (
      select p.is_platform_admin
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.get_platform_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select pa.role
  from public.platform_admins pa
  where pa.user_id = auth.uid()
    and pa.disabled_at is null
  limit 1;
$$;

revoke all on function public.is_platform_admin_user(uuid) from public;
revoke all on function public.is_platform_admin() from public;
revoke all on function public.is_platform_super_admin() from public;
revoke all on function public.get_platform_admin_role() from public;

grant execute on function public.is_platform_admin_user(uuid) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_platform_super_admin() to authenticated;
grant execute on function public.get_platform_admin_role() to authenticated;

-- service_role already bypasses RLS; keep execute for RPC convenience
grant execute on function public.is_platform_admin_user(uuid) to service_role;
grant execute on function public.is_platform_admin() to service_role;
grant execute on function public.is_platform_super_admin() to service_role;
grant execute on function public.get_platform_admin_role() to service_role;

-- ---------------------------------------------------------------------------
-- Recreate platform_admins policies without self-referential EXISTS
-- ---------------------------------------------------------------------------
drop policy if exists "platform_admins_select_self_or_admin" on public.platform_admins;
drop policy if exists "platform_admins_write_super" on public.platform_admins;

-- Normal users: only their own row (if any). Platform admins: all rows.
create policy "platform_admins_select_self_or_admin"
  on public.platform_admins for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_platform_admin_user(auth.uid())
  );

-- Only super-admins may insert/update/delete — via helper, not a nested SELECT.
create policy "platform_admins_insert_super"
  on public.platform_admins for insert
  to authenticated
  with check (public.is_platform_super_admin());

create policy "platform_admins_update_super"
  on public.platform_admins for update
  to authenticated
  using (public.is_platform_super_admin())
  with check (public.is_platform_super_admin());

create policy "platform_admins_delete_super"
  on public.platform_admins for delete
  to authenticated
  using (public.is_platform_super_admin());

comment on function public.is_platform_admin_user(uuid) is
  'SECURITY DEFINER check for platform admin membership; safe to call from RLS.';
comment on function public.is_platform_super_admin() is
  'SECURITY DEFINER check for platform_super_admin; used by platform_admins write policies.';
