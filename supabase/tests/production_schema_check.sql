-- Read-only schema verification for EasyWedd Pro production.
-- Does not modify data. Run in SQL Editor after migrations.

do $$
declare
  missing text[] := '{}';
  t text;
  required_tables text[] := array[
    'profiles','workspaces','workspace_members','leads','clients','proposals','contracts',
    'projects','tasks','payments','calendar_events','automations','automation_runs',
    'activity_logs','subscriptions','workspace_templates','workspace_invitations',
    'notifications','email_deliveries','user_feedback','stripe_webhook_events',
    'contract_templates','client_portal_tokens'
  ];
  required_fns text[] := array[
    'is_platform_admin','is_workspace_member','hash_token',
    'create_onboarding_workspace','create_contract_from_proposal',
    'get_client_portal_by_token','contract_payment_totals','workspace_analytics_summary'
  ];
begin
  foreach t in array required_tables loop
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      missing := array_append(missing, 'table:' || t);
    end if;
  end loop;

  foreach t in array required_fns loop
    if not exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = t
    ) then
      missing := array_append(missing, 'function:' || t);
    end if;
  end loop;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'contracts' and column_name = 'archived_at'
  ) then
    missing := array_append(missing, 'column:contracts.archived_at');
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions' and column_name = 'stripe_price_id'
  ) then
    missing := array_append(missing, 'column:subscriptions.stripe_price_id');
  end if;

  if not exists (select 1 from storage.buckets where id = 'workspace-assets') then
    missing := array_append(missing, 'bucket:workspace-assets');
  end if;

  if cardinality(missing) > 0 then
    raise exception 'SCHEMA_CHECK_FAILED: %', array_to_string(missing, ', ');
  end if;

  raise notice 'SCHEMA_CHECK_OK';
end;
$$;
