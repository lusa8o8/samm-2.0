insert into public.org_billing (org_id, status)
select org_id, 'grandfathered'
from public.org_config
where org_id is not null
on conflict (org_id) do nothing;

update public.org_billing
set status = 'grandfathered',
    updated_at = now()
where status = 'inactive'
  and stripe_subscription_id is null
  and stripe_customer_id is null
  and created_at < timestamp with time zone '2026-05-05 19:30:00+02';
