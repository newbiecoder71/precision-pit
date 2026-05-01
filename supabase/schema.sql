create extension if not exists "pgcrypto";

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.teams
  add column if not exists driver_name text,
  add column if not exists crew_chief_name text,
  add column if not exists racing_type text,
  add column if not exists race_car_type text,
  add column if not exists car_class text,
  add column if not exists engine_type text,
  add column if not exists fuel_type text,
  add column if not exists carburetor_type text;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  full_name text,
  role text not null check (role in ('Owner', 'Driver', 'Crew Chief', 'Crew')),
  status text not null default 'active' check (status in ('active')),
  created_at timestamptz not null default now(),
  unique (team_id, email)
);

alter table public.team_members
  drop constraint if exists team_members_role_check;

alter table public.team_members
  add constraint team_members_role_check
  check (role in ('Owner', 'Driver', 'Crew Chief', 'Crew'));

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

create or replace function public.is_team_leader(target_team_id uuid)
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
  )
  or exists (
    select 1
    from public.team_members member
    where member.team_id = target_team_id
      and member.user_id = auth.uid()
      and member.status = 'active'
      and member.role = 'Driver'
  );
$$;

create or replace function public.update_team_member_role(target_member_id uuid, next_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_team_id uuid;
  current_target_user_id uuid;
  current_target_role text;
  acting_member_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if next_role not in ('Owner', 'Driver', 'Crew Chief', 'Crew') then
    raise exception 'Invalid team-member role.';
  end if;

  select member.team_id, member.user_id, member.role
  into current_team_id, current_target_user_id, current_target_role
  from public.team_members member
  where member.id = target_member_id
    and member.status = 'active'
  limit 1;

  if current_team_id is null then
    raise exception 'Team member not found.';
  end if;

  select member.role
  into acting_member_role
  from public.team_members member
  where member.team_id = current_team_id
    and member.user_id = auth.uid()
    and member.status = 'active'
  limit 1;

  if acting_member_role not in ('Owner', 'Driver') then
    raise exception 'Only the team owner or driver can change team-member roles.';
  end if;

  if current_target_role = next_role then
    return;
  end if;

  if next_role = 'Owner' then
    if current_target_user_id is null then
      raise exception 'Only active joined members can become the team owner.';
    end if;

    update public.team_members
    set role = case when id = target_member_id then 'Owner' else 'Crew' end
    where team_id = current_team_id
      and role = 'Owner';

    update public.teams
    set owner_user_id = current_target_user_id
    where id = current_team_id;

    return;
  end if;

  if current_target_role = 'Owner' then
    raise exception 'Choose Owner on another member to transfer ownership.';
  end if;

  update public.team_members
  set role = next_role
  where id = target_member_id;
end;
$$;

create or replace function public.update_team_member_role(next_role text, target_member_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  select public.update_team_member_role(target_member_id, next_role);
$$;

create or replace function public.change_team_member_role(
  p_target_member_id uuid,
  p_next_role text
)
returns void
language sql
security definer
set search_path = public
as $$
  select public.update_team_member_role(p_target_member_id, p_next_role);
$$;

create or replace function public.change_team_member_role(
  p_next_role text,
  p_target_member_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  select public.update_team_member_role(p_target_member_id, p_next_role);
$$;

create or replace function public.change_team_member_role_v2(
  p_target_member_id uuid,
  p_next_role text
)
returns void
language sql
security definer
set search_path = public
as $$
  select public.update_team_member_role(p_target_member_id, p_next_role);
$$;

create or replace function public.change_team_member_role_v3(
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  next_target_member_id uuid;
  next_role text;
begin
  next_target_member_id := nullif(trim(p_payload ->> 'targetMemberId'), '')::uuid;
  next_role := nullif(trim(p_payload ->> 'nextRole'), '');

  if next_target_member_id is null or next_role is null then
    raise exception 'Missing role update details.';
  end if;

  perform public.update_team_member_role(next_target_member_id, next_role);
end;
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
drop policy if exists "teams_update_for_leader" on public.teams;
create policy "teams_update_for_leader"
on public.teams
for update
to authenticated
using (public.is_team_leader(id))
with check (public.is_team_leader(id));

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
    role in ('Crew', 'Driver', 'Crew Chief')
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
drop policy if exists "team_members_update_self_or_leader" on public.team_members;
create policy "team_members_update_self_or_leader"
on public.team_members
for update
to authenticated
using (
  public.is_team_leader(team_id) or user_id = auth.uid()
)
with check (
  public.is_team_leader(team_id) or user_id = auth.uid()
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
