-- Chạy file này trong Supabase → SQL Editor.
-- Mỗi dòng thuộc về một người dùng (user_id); RLS đảm bảo không ai đọc/ghi dữ liệu của người khác.

create table if not exists public.ai_accounts (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.projects (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists ai_accounts_user_idx on public.ai_accounts(user_id);
create index if not exists projects_user_idx on public.projects(user_id);

alter table public.ai_accounts enable row level security;
alter table public.projects enable row level security;

drop policy if exists "own rows" on public.ai_accounts;
create policy "own rows" on public.ai_accounts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rows" on public.projects;
create policy "own rows" on public.projects
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
