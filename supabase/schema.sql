create extension if not exists "pgcrypto";

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.teams
  add column if not exists racing_type text,
  add column if not exists race_car_type text;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  full_name text,
  role text not null check (role in ('Owner', 'Crew')),
  status text not null default 'active' check (status in ('active')),
  created_at timestamptz not null default now(),
  unique (team_id, email)
);

create unique index if not exists team_members_team_user_unique
  on public.team_members (team_id, user_id)
  where user_id is not null;

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  email text not null,
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by_user_id uuid not null references auth.users (id) on delete cascade,
  accepted_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table if not exists public.race_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  title text not null,
  track_name text not null,
  event_date date not null,
  created_by_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.race_nights (
  id text primary key,
  team_id uuid not null references public.teams (id) on delete cascade,
  event_id text not null,
  event_title text not null,
  track_name text not null,
  event_date date not null,
  status text not null check (status in ('active', 'completed', 'rainout')),
  created_by_user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members member
    where member.team_id = target_team_id
      and member.user_id = auth.uid()
      and member.status = 'active'
  );
$$;

create or replace function public.is_team_owner(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.teams team
    where team.id = target_team_id
      and team.owner_user_id = auth.uid()
  );
$$;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.invites enable row level security;
alter table public.race_events enable row level security;
alter table public.race_nights enable row level security;

drop policy if exists "teams_select_for_members" on public.teams;
create policy "teams_select_for_members"
on public.teams
for select
to authenticated
using (
  owner_user_id = auth.uid() or public.is_team_member(id)
);

drop policy if exists "teams_insert_for_owner" on public.teams;
create policy "teams_insert_for_owner"
on public.teams
for insert
to authenticated
with check (owner_user_id = auth.uid());

drop policy if exists "teams_update_for_owner" on public.teams;
create policy "teams_update_for_owner"
on public.teams
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "team_members_select_for_same_team" on public.team_members;
create policy "team_members_select_for_same_team"
on public.team_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_team_member(team_id)
  or public.is_team_owner(team_id)
);

drop policy if exists "team_members_insert_for_owner_creation" on public.team_members;
create policy "team_members_insert_for_owner_creation"
on public.team_members
for insert
to authenticated
with check (
  (
    role = 'Owner'
    and user_id = auth.uid()
    and public.is_team_owner(team_id)
  )
  or (
    role = 'Crew'
    and user_id = auth.uid()
    and lower(email) = public.current_user_email()
    and exists (
      select 1
      from public.invites invite
      where invite.team_id = team_members.team_id
        and lower(invite.email) = lower(team_members.email)
        and invite.status = 'pending'
    )
  )
);

drop policy if exists "team_members_update_self_or_owner" on public.team_members;
create policy "team_members_update_self_or_owner"
on public.team_members
for update
to authenticated
using (
  public.is_team_owner(team_id) or user_id = auth.uid()
)
with check (
  public.is_team_owner(team_id) or user_id = auth.uid()
);

drop policy if exists "invites_select_for_owner_or_invited_user" on public.invites;
create policy "invites_select_for_owner_or_invited_user"
on public.invites
for select
to authenticated
using (
  public.is_team_owner(team_id) or lower(email) = public.current_user_email()
);

drop policy if exists "invites_insert_for_owner" on public.invites;
create policy "invites_insert_for_owner"
on public.invites
for insert
to authenticated
with check (
  invited_by_user_id = auth.uid() and public.is_team_owner(team_id)
);

drop policy if exists "invites_update_for_owner_or_invited_user" on public.invites;
create policy "invites_update_for_owner_or_invited_user"
on public.invites
for update
to authenticated
using (
  public.is_team_owner(team_id) or lower(email) = public.current_user_email()
)
with check (
  public.is_team_owner(team_id) or lower(email) = public.current_user_email()
);

drop policy if exists "race_events_select_for_team_members" on public.race_events;
create policy "race_events_select_for_team_members"
on public.race_events
for select
to authenticated
using (
  public.is_team_member(team_id) or public.is_team_owner(team_id)
);

drop policy if exists "race_events_insert_for_team_members" on public.race_events;
create policy "race_events_insert_for_team_members"
on public.race_events
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and (public.is_team_member(team_id) or public.is_team_owner(team_id))
);

drop policy if exists "race_events_update_for_team_members" on public.race_events;
create policy "race_events_update_for_team_members"
on public.race_events
for update
to authenticated
using (
  public.is_team_member(team_id) or public.is_team_owner(team_id)
)
with check (
  public.is_team_member(team_id) or public.is_team_owner(team_id)
);

drop policy if exists "race_events_delete_for_team_members" on public.race_events;
create policy "race_events_delete_for_team_members"
on public.race_events
for delete
to authenticated
using (
  public.is_team_member(team_id) or public.is_team_owner(team_id)
);

drop policy if exists "race_nights_select_for_team_members" on public.race_nights;
create policy "race_nights_select_for_team_members"
on public.race_nights
for select
to authenticated
using (
  public.is_team_member(team_id) or public.is_team_owner(team_id)
);

drop policy if exists "race_nights_insert_for_team_members" on public.race_nights;
create policy "race_nights_insert_for_team_members"
on public.race_nights
for insert
to authenticated
with check (
  created_by_user_id = auth.uid()
  and (public.is_team_member(team_id) or public.is_team_owner(team_id))
);

drop policy if exists "race_nights_update_for_team_members" on public.race_nights;
create policy "race_nights_update_for_team_members"
on public.race_nights
for update
to authenticated
using (
  public.is_team_member(team_id) or public.is_team_owner(team_id)
)
with check (
  public.is_team_member(team_id) or public.is_team_owner(team_id)
);

drop policy if exists "race_nights_delete_for_team_members" on public.race_nights;
create policy "race_nights_delete_for_team_members"
on public.race_nights
for delete
to authenticated
using (
  public.is_team_member(team_id) or public.is_team_owner(team_id)
);
