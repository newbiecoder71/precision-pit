alter table public.teams
  add column if not exists setup_visibility_preferences jsonb,
  add column if not exists checklist_visibility_preferences jsonb;
