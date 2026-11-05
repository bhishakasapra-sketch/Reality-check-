-- ════════════════════════════════════════════════════════════════════
--  Reality Check — database schema
--  Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run
--  Safe to re-run: every statement is idempotent.
-- ════════════════════════════════════════════════════════════════════

-- ── Profiles: one per user, created automatically on sign-up ─────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Explorer' check (char_length(display_name) between 1 and 40),
  xp           integer not null default 0,
  created_at   timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Explorer'), 40)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Events: the only way XP is earned (users can't edit xp directly) ─
create table if not exists public.events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('econ','biz','env','save','compare','chal','chal_reasoned','ai','badge','daily')),
  created_at timestamptz not null default now()
);
create index if not exists events_user_idx on public.events (user_id, created_at desc);

-- Keep in sync with XP in lib/progress.ts
create or replace function public.xp_for(k text) returns integer language sql immutable as $$
  select case k
    when 'econ' then 10 when 'biz' then 10 when 'env' then 10 when 'save' then 15
    when 'compare' then 20 when 'chal' then 30 when 'chal_reasoned' then 10
    when 'ai' then 5 when 'badge' then 25 else 0 end
$$;

-- Anti-farming rules: same event kind at most once every 3 seconds,
-- at most 10 badge awards ever, at most 1,500 XP per day.
create or replace function public.apply_event_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  gained integer := public.xp_for(new.kind);
  today  integer;
begin
  if exists (select 1 from events where user_id = new.user_id and kind = new.kind
             and created_at > now() - interval '3 seconds') then
    return null;                                    -- silently drop the duplicate
  end if;
  if new.kind = 'badge' and (select count(*) from events where user_id = new.user_id and kind = 'badge') >= 10 then
    return null;
  end if;
  select coalesce(sum(public.xp_for(kind)), 0) into today
    from events where user_id = new.user_id and created_at > date_trunc('day', now());
  if today + gained > 1500 then gained := greatest(0, 1500 - today); end if;
  update profiles set xp = xp + gained where id = new.user_id;
  return new;
end $$;

drop trigger if exists events_apply_xp on public.events;
create trigger events_apply_xp before insert on public.events
  for each row execute function public.apply_event_xp();

-- ── Saved simulations and history (private) ──────────────────────────
create table if not exists public.simulations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  module     text not null check (module in ('economics','business','environment','challenges')),
  name       text not null check (char_length(name) between 1 and 120),
  params     jsonb not null default '{}'::jsonb check (pg_column_size(params) < 8000),
  created_at timestamptz not null default now()
);
create index if not exists simulations_user_idx on public.simulations (user_id, created_at desc);

create table if not exists public.history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  module     text not null check (module in ('economics','business','environment','challenges')),
  name       text not null check (char_length(name) between 1 and 160),
  params     jsonb check (params is null or pg_column_size(params) < 8000),
  created_at timestamptz not null default now()
);
create index if not exists history_user_idx on public.history (user_id, created_at desc);

-- ── Challenge responses: choice is counted publicly, reasoning stays private ─
create table if not exists public.challenge_responses (
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  challenge_id text not null check (char_length(challenge_id) <= 40),
  choice       text not null check (char_length(choice) <= 40),
  reasoning    text not null default '' check (char_length(reasoning) <= 4000),
  words        integer not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

-- ── Row Level Security ───────────────────────────────────────────────
alter table public.profiles            enable row level security;
alter table public.events              enable row level security;
alter table public.simulations         enable row level security;
alter table public.history             enable row level security;
alter table public.challenge_responses enable row level security;

drop policy if exists "read own profile"   on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
-- users may change their display name, never their xp
revoke update on public.profiles from authenticated, anon;
grant  update (display_name) on public.profiles to authenticated;

drop policy if exists "own events read"   on public.events;
drop policy if exists "own events insert" on public.events;
create policy "own events read"   on public.events for select using (auth.uid() = user_id);
create policy "own events insert" on public.events for insert with check (auth.uid() = user_id);

do $$ declare t text; begin
  foreach t in array array['simulations','history','challenge_responses'] loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format('create policy "own rows" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- ── Public aggregates (exposed through functions, never raw rows) ─────
create or replace function public.challenge_tallies()
returns table (challenge_id text, choice text, n bigint)
language sql stable security definer set search_path = public as $$
  select challenge_id, choice, count(*) from challenge_responses group by 1, 2
$$;

create or replace function public.leaderboard(lim integer default 10)
returns table (display_name text, xp integer, is_me boolean)
language sql stable security definer set search_path = public as $$
  select display_name, xp, id = auth.uid() from profiles
  where xp > 0 order by xp desc, created_at asc limit least(greatest(lim, 1), 50)
$$;

revoke all on function public.challenge_tallies() from public;
revoke all on function public.leaderboard(integer) from public;
grant execute on function public.challenge_tallies() to anon, authenticated;
grant execute on function public.leaderboard(integer) to authenticated;
