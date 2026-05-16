alter table public.invites
  add column if not exists role text not null default 'Crew';

alter table public.invites
  drop constraint if exists invites_role_check;

alter table public.invites
  add constraint invites_role_check
  check (role in ('Owner', 'Driver', 'Crew Chief', 'Crew'));
