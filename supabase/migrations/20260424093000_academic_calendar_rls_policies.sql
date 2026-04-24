-- Enforce org-scoped access for academic_calendar and explicitly allow
-- authenticated users to delete their own org's calendar windows.

alter table public.academic_calendar enable row level security;

drop policy if exists academic_calendar_select_by_org on public.academic_calendar;
drop policy if exists academic_calendar_insert_by_org on public.academic_calendar;
drop policy if exists academic_calendar_update_by_org on public.academic_calendar;
drop policy if exists academic_calendar_delete_by_org on public.academic_calendar;

create policy academic_calendar_select_by_org
on public.academic_calendar
for select
to authenticated
using (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);

create policy academic_calendar_insert_by_org
on public.academic_calendar
for insert
to authenticated
with check (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);

create policy academic_calendar_update_by_org
on public.academic_calendar
for update
to authenticated
using (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
)
with check (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);

create policy academic_calendar_delete_by_org
on public.academic_calendar
for delete
to authenticated
using (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);
