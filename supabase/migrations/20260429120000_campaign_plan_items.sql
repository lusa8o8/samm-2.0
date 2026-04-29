-- Persist the user-approved campaign content plan that Pipeline C executes.

create extension if not exists pgcrypto;

create table if not exists public.campaign_plan_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  calendar_event_id uuid,
  pipeline_run_id uuid,
  inbox_item_id uuid,
  slot_id text not null,
  scheduled_for date not null,
  channel text not null,
  role text not null,
  content_type text not null,
  visual_need text not null default 'text_only',
  title_seed text not null default '',
  rationale text not null default '',
  countdown_label text,
  status text not null default 'committed',
  content_registry_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaign_plan_items_org_date
on public.campaign_plan_items (org_id, scheduled_for);

create index if not exists idx_campaign_plan_items_run
on public.campaign_plan_items (pipeline_run_id);

create unique index if not exists idx_campaign_plan_items_run_slot
on public.campaign_plan_items (pipeline_run_id, slot_id)
where pipeline_run_id is not null;

alter table public.campaign_plan_items enable row level security;

drop policy if exists campaign_plan_items_select_by_org on public.campaign_plan_items;
drop policy if exists campaign_plan_items_insert_by_org on public.campaign_plan_items;
drop policy if exists campaign_plan_items_update_by_org on public.campaign_plan_items;
drop policy if exists campaign_plan_items_delete_by_org on public.campaign_plan_items;

create policy campaign_plan_items_select_by_org
on public.campaign_plan_items
for select
to authenticated
using (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);

create policy campaign_plan_items_insert_by_org
on public.campaign_plan_items
for insert
to authenticated
with check (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);

create policy campaign_plan_items_update_by_org
on public.campaign_plan_items
for update
to authenticated
using (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
)
with check (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);

create policy campaign_plan_items_delete_by_org
on public.campaign_plan_items
for delete
to authenticated
using (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);

alter table public.content_registry drop constraint if exists content_registry_platform_check;

alter table public.content_registry
  add constraint content_registry_platform_check
  check (platform = any (array[
    'facebook',
    'instagram',
    'linkedin',
    'whatsapp',
    'youtube',
    'email',
    'studyhub',
    'ambassador',
    'design_brief'
  ]));
