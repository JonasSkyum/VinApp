-- Vinspil: progress sync (phase 8).
-- Every table is per-user and locked down with RLS: a signed-in user only ever
-- sees and writes their own rows; the anon role has no access to progress at all.
-- Applied to project dadhgplpihnyakalicwm via the Supabase MCP; kept here for history.

-- Helper functions live outside the API-exposed schema so PostgREST never
-- publishes them as RPC endpoints.
create schema if not exists private;
revoke all on schema private from anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on signup.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Runs as the definer because auth.users inserts happen outside any user session.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- answer_log: every answer the player has given, mirrored from localStorage.
-- client_id is a deterministic hash of the record computed by the app, so a
-- re-push of the whole log is idempotent (upsert on user_id + client_id).
-- ---------------------------------------------------------------------------
create table public.answer_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id text not null,
  kind text not null check (kind in ('grape', 'region', 'style', 'map-location')),
  item_id text not null,
  tier text not null check (tier in ('1', '2', '3', '4', '5', '6', 'map')),
  correct boolean not null,
  guessed_id text,
  points integer not null check (points >= 0),
  answered_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

-- The unique index above already serves lookups by user_id (leading column).
alter table public.answer_log enable row level security;

create policy answer_log_select_own on public.answer_log
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy answer_log_insert_own on public.answer_log
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy answer_log_update_own on public.answer_log
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy answer_log_delete_own on public.answer_log
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- leitner_state: one row per learning unit ("grape:syrah", "region:rioja" ...).
-- Merge rule on login is "highest box wins"; the app merges before it pushes.
-- ---------------------------------------------------------------------------
create table public.leitner_state (
  user_id uuid not null references auth.users (id) on delete cascade,
  unit_key text not null,
  box smallint not null check (box between 1 and 5),
  reviewed_at timestamptz not null,
  due_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, unit_key)
);

alter table public.leitner_state enable row level security;

create policy leitner_state_select_own on public.leitner_state
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy leitner_state_insert_own on public.leitner_state
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy leitner_state_update_own on public.leitner_state
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy leitner_state_delete_own on public.leitner_state
  for delete to authenticated
  using (user_id = (select auth.uid()));

create trigger leitner_state_set_updated_at
  before update on public.leitner_state
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- daily_results: one row per played daily challenge.
-- ---------------------------------------------------------------------------
create table public.daily_results (
  user_id uuid not null references auth.users (id) on delete cascade,
  date_key date not null,
  style_id text not null,
  total integer not null check (total >= 0),
  max integer not null check (max > 0),
  tiers jsonb not null default '[]'::jsonb,
  played_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (user_id, date_key)
);

alter table public.daily_results enable row level security;

create policy daily_results_select_own on public.daily_results
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy daily_results_insert_own on public.daily_results
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy daily_results_update_own on public.daily_results
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy daily_results_delete_own on public.daily_results
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- heartbeat: a single public row a scheduled GitHub Action reads so the free
-- project sees API traffic and is not paused for inactivity. Read-only for anon.
-- ---------------------------------------------------------------------------
create table public.heartbeat (
  id smallint primary key check (id = 1),
  created_at timestamptz not null default now()
);

alter table public.heartbeat enable row level security;

create policy heartbeat_select_public on public.heartbeat
  for select to anon, authenticated
  using (true);

insert into public.heartbeat (id) values (1);
