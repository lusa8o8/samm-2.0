create table if not exists public.waitlist_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  organization_name text,
  role text,
  team_size text,
  channels text[] not null default '{}',
  primary_use_case text not null,
  biggest_workflow_pain text not null,
  source text not null default 'website',
  status text not null default 'pending' check (status in ('pending', 'reviewing', 'approved', 'rejected', 'onboarded')),
  notes text,
  reviewed_at timestamptz,
  onboarded_org_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists waitlist_leads_status_idx on public.waitlist_leads(status);
create index if not exists waitlist_leads_created_at_idx on public.waitlist_leads(created_at desc);

alter table public.waitlist_leads enable row level security;

alter table public.waitlist_leads alter column organization_name drop not null;
