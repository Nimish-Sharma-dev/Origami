-- ============================================================
-- ORIGAMI — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Tables ──────────────────────────────────────────────────

-- Users (extends Supabase auth.users)
create table if not exists public.users (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text not null,
  name          text,
  avatar_url    text,
  github_username text,
  github_connected boolean default false,
  college       text,
  degree        text,
  specialization text,
  cgpa          text,
  graduation_year text,
  created_at    timestamptz default now()
);

-- Repositories
create table if not exists public.repositories (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.users(id) on delete cascade not null,
  repo_name     text not null,
  full_name     text,
  description   text,
  languages     jsonb default '{}',
  topics        text[] default '{}',
  stars         integer default 0,
  forks         integer default 0,
  readme_content text,
  complexity_score integer default 0,
  is_pinned     boolean default false,
  html_url      text,
  created_at    timestamptz,
  updated_at    timestamptz,
  unique(user_id, repo_name)
);

-- Skills
create table if not exists public.skills (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id) on delete cascade not null,
  skill_name      text not null,
  category        text default 'Tools',
  confidence_score integer default 50,
  source          text default 'manual', -- 'github' | 'manual' | 'ai_detected'
  created_at      timestamptz default now(),
  unique(user_id, skill_name)
);

-- Certifications
create table if not exists public.certifications (
  id             uuid default uuid_generate_v4() primary key,
  user_id        uuid references public.users(id) on delete cascade not null,
  title          text not null,
  issuer         text,
  issue_date     text,
  credential_url text,
  created_at     timestamptz default now()
);

-- Experiences
create table if not exists public.experiences (
  id             uuid default uuid_generate_v4() primary key,
  user_id        uuid references public.users(id) on delete cascade not null,
  role           text not null,
  organization   text,
  duration       text,
  description    text,
  is_current     boolean default false,
  created_at     timestamptz default now()
);

-- Resumes
create table if not exists public.resumes (
  id             uuid default uuid_generate_v4() primary key,
  user_id        uuid references public.users(id) on delete cascade not null,
  template       text default 'faang-classic',
  latex_content  text,
  pdf_url        text,
  ats_score      integer default 0,
  created_at     timestamptz default now()
);

-- Roadmap nodes
create table if not exists public.roadmap_nodes (
  id             text primary key, -- "{user_id}_{node_id}"
  user_id        uuid references public.users(id) on delete cascade not null,
  title          text not null,
  description    text,
  status         text default 'recommended', -- 'completed'|'in-progress'|'recommended'|'locked'
  priority       integer default 0,
  category       text default 'Other',
  parent_id      text,
  resources      text[],
  created_at     timestamptz default now()
);

-- ── Indexes ──────────────────────────────────────────────────

create index if not exists idx_repos_user on public.repositories(user_id);
create index if not exists idx_skills_user on public.skills(user_id);
create index if not exists idx_certs_user on public.certifications(user_id);
create index if not exists idx_exps_user on public.experiences(user_id);
create index if not exists idx_resumes_user on public.resumes(user_id);
create index if not exists idx_roadmap_user on public.roadmap_nodes(user_id);

-- ── Row Level Security ────────────────────────────────────────

alter table public.users           enable row level security;
alter table public.repositories    enable row level security;
alter table public.skills          enable row level security;
alter table public.certifications  enable row level security;
alter table public.experiences     enable row level security;
alter table public.resumes         enable row level security;
alter table public.roadmap_nodes   enable row level security;

-- Users: read/write own row only
create policy "Users: read own" on public.users for select using (auth.uid() = id);
create policy "Users: insert own" on public.users for insert with check (auth.uid() = id);
create policy "Users: update own" on public.users for update using (auth.uid() = id);

-- Generic pattern: users own their data
create policy "Repos: own data" on public.repositories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Skills: own data" on public.skills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Certs: own data" on public.certifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Exps: own data" on public.experiences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Resumes: own data" on public.resumes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Roadmap: own data" on public.roadmap_nodes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Storage Buckets ──────────────────────────────────────────

-- Run these in: Supabase Dashboard → Storage → New Bucket
-- OR via SQL:

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

-- Storage policy: users can upload/read their own files
create policy "Resume files: upload own"
  on storage.objects for insert
  with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Resume files: read own"
  on storage.objects for select
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Resume files: delete own"
  on storage.objects for delete
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── Auth Trigger — auto-create user profile ──────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url, github_username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username')
  )
  on conflict (id) do update set
    name = excluded.name,
    avatar_url = excluded.avatar_url,
    github_username = coalesce(excluded.github_username, public.users.github_username);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
