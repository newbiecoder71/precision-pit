alter table public.team_members
  add column if not exists access_permissions jsonb not null default '{}'::jsonb;
