create table if not exists public.samm_chat_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  thread_key text not null default 'web:samm:primary',
  role text not null,
  mode text not null default 'planning',
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_samm_chat_messages_org_thread_created
on public.samm_chat_messages (org_id, thread_key, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'samm_chat_messages_role_check'
  ) then
    alter table public.samm_chat_messages
      add constraint samm_chat_messages_role_check
      check (role in ('user', 'coordinator'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'samm_chat_messages_mode_check'
  ) then
    alter table public.samm_chat_messages
      add constraint samm_chat_messages_mode_check
      check (mode in ('planning', 'execution'));
  end if;
end $$;

alter table public.samm_chat_messages enable row level security;

drop policy if exists samm_chat_messages_select_by_org on public.samm_chat_messages;
drop policy if exists samm_chat_messages_insert_by_org on public.samm_chat_messages;
drop policy if exists samm_chat_messages_delete_by_org on public.samm_chat_messages;

create policy samm_chat_messages_select_by_org
on public.samm_chat_messages
for select
to authenticated
using (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);

create policy samm_chat_messages_insert_by_org
on public.samm_chat_messages
for insert
to authenticated
with check (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);

create policy samm_chat_messages_delete_by_org
on public.samm_chat_messages
for delete
to authenticated
using (
  org_id = (nullif(auth.jwt() -> 'app_metadata' ->> 'org_id', ''))::uuid
);
