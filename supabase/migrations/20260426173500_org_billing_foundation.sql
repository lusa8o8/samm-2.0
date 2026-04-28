create table if not exists public.org_billing (
  org_id uuid primary key,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text,
  status text not null default 'inactive',
  price_id text,
  product_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.org_billing (org_id)
select org_id
from public.org_config
where org_id is not null
on conflict (org_id) do nothing;

alter table public.org_billing enable row level security;

drop policy if exists org_billing_select_by_org on public.org_billing;

create policy org_billing_select_by_org
on public.org_billing
for select
to authenticated
using (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);
