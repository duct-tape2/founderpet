-- FounderPet Phase 2: production-grade events, idempotency, and trust-weighted leaderboard inputs.
-- Run in Supabase SQL editor after the initial project is created.

create table if not exists public.founder_profiles (
  id text primary key,
  handle text not null unique,
  display_name text,
  project_name text,
  avatar_emoji text default '🥚',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.founder_events (
  id text primary key,
  user_id text not null references public.founder_profiles(id) on delete cascade,
  kind text not null check (kind in (
    'task_started',
    'task_done',
    'task_blocked',
    'approval',
    'revenue',
    'lead',
    'views',
    'github_commit',
    'published_content',
    'agent_run',
    'integration_connected'
  )),
  source text not null,
  value numeric not null default 1 check (value >= 0),
  currency text,
  verified boolean not null default false,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  external_id text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists founder_events_source_external_id_idx
  on public.founder_events(user_id, source, external_id)
  where external_id is not null;

create index if not exists founder_events_user_occurred_at_idx
  on public.founder_events(user_id, occurred_at desc);

create index if not exists founder_events_kind_source_idx
  on public.founder_events(kind, source);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists founder_profiles_touch_updated_at on public.founder_profiles;
create trigger founder_profiles_touch_updated_at
before update on public.founder_profiles
for each row execute function public.touch_updated_at();

create or replace view public.founder_event_rollup_v1 as
select
  p.id as user_id,
  p.handle,
  p.display_name,
  p.project_name,
  p.avatar_emoji,
  count(e.id) as event_count,
  coalesce(sum(e.value) filter (where e.kind = 'revenue'), 0) as total_revenue,
  coalesce(sum(e.value) filter (where e.kind = 'revenue' and e.verified), 0) as verified_revenue,
  coalesce(sum(e.value) filter (where e.kind = 'revenue' and e.occurred_at >= now() - interval '30 days'), 0) as revenue_30d,
  count(distinct e.source) as source_count,
  max(e.occurred_at) as last_signal_at
from public.founder_profiles p
left join public.founder_events e on e.user_id = p.id
group by p.id, p.handle, p.display_name, p.project_name, p.avatar_emoji;

alter table public.founder_profiles enable row level security;
alter table public.founder_events enable row level security;

-- Public profile/leaderboard reads are intentional. Event writes should go through signed API routes
-- using SUPABASE_SERVICE_ROLE_KEY, not directly from the browser.
drop policy if exists "founder profiles are publicly readable" on public.founder_profiles;
create policy "founder profiles are publicly readable"
  on public.founder_profiles for select
  using (true);

drop policy if exists "founder events are publicly readable for leaderboard" on public.founder_events;
create policy "founder events are publicly readable for leaderboard"
  on public.founder_events for select
  using (true);

-- Optional authenticated owner policies. Keep service-role route as the source of truth for writes.
drop policy if exists "service role can manage founder profiles" on public.founder_profiles;
create policy "service role can manage founder profiles"
  on public.founder_profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service role can manage founder events" on public.founder_events;
create policy "service role can manage founder events"
  on public.founder_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
