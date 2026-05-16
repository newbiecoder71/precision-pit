create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text,
  team_name text,
  platform_preference text not null default 'Either'
    check (platform_preference in ('iPhone', 'Android', 'Either')),
  notes text,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;
