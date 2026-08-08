-- Annual price = monthly × 11 (pay for 11 months, get 12 months access).
-- Previous seed used monthly × 10.

update public.plan_versions
set
  price_yearly = case plan_id
    when 'free' then 0
    when 'solo' then 79 * 11
    when 'studio' then 179 * 11
    when 'agency' then 349 * 11
    else coalesce(price_monthly, 0) * 11
  end
where is_current = true;
