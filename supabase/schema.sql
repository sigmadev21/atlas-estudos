-- Atlas shared content. Public visitors can read; only a user registered in
-- atlas_admins can change content. No private key or admin email is needed.

create table if not exists public.materials (
  id text primary key,
  title text not null,
  subject text not null,
  type text not null,
  description text not null default '',
  url text not null default '',
  icon text not null default '▤',
  tone text not null default 'violet',
  quiz jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.exams (
  id text primary key,
  title text not null,
  subject text not null,
  exam_date date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.atlas_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.materials enable row level security;
alter table public.exams enable row level security;
alter table public.atlas_admins enable row level security;

grant select on public.materials, public.exams to anon, authenticated;
grant insert, update, delete on public.materials, public.exams to authenticated;
revoke all on public.atlas_admins from public, anon, authenticated;

create or replace function public.is_atlas_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.atlas_admins where user_id = auth.uid()
  );
$$;

revoke all on function public.is_atlas_admin() from public;
grant execute on function public.is_atlas_admin() to authenticated;

drop policy if exists "Anyone can read materials" on public.materials;
create policy "Anyone can read materials" on public.materials
  for select to anon, authenticated using (true);
drop policy if exists "Admin manages materials" on public.materials;
create policy "Admin manages materials" on public.materials
  for all to authenticated
  using (public.is_atlas_admin())
  with check (public.is_atlas_admin());

drop policy if exists "Anyone can read exams" on public.exams;
create policy "Anyone can read exams" on public.exams
  for select to anon, authenticated using (true);
drop policy if exists "Admin manages exams" on public.exams;
create policy "Admin manages exams" on public.exams
  for all to authenticated
  using (public.is_atlas_admin())
  with check (public.is_atlas_admin());

insert into storage.buckets (id, name, public)
values ('atlas-materials', 'atlas-materials', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can read Atlas files" on storage.objects;
create policy "Anyone can read Atlas files" on storage.objects
  for select to anon, authenticated using (bucket_id = 'atlas-materials');
drop policy if exists "Admin uploads Atlas files" on storage.objects;
create policy "Admin uploads Atlas files" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'atlas-materials'
    and public.is_atlas_admin()
  );
