-- Atlas shared content. Replace YOUR_ADMIN_EMAIL with the email used by the admin's Supabase Auth account.
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

alter table public.materials enable row level security;
alter table public.exams enable row level security;

grant select on public.materials, public.exams to anon, authenticated;
grant insert, update, delete on public.materials, public.exams to authenticated;

drop policy if exists "Anyone can read materials" on public.materials;
create policy "Anyone can read materials" on public.materials
  for select to anon, authenticated using (true);
drop policy if exists "Admin manages materials" on public.materials;
create policy "Admin manages materials" on public.materials
  for all to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('YOUR_ADMIN_EMAIL'))
  with check (lower(auth.jwt() ->> 'email') = lower('YOUR_ADMIN_EMAIL'));

drop policy if exists "Anyone can read exams" on public.exams;
create policy "Anyone can read exams" on public.exams
  for select to anon, authenticated using (true);
drop policy if exists "Admin manages exams" on public.exams;
create policy "Admin manages exams" on public.exams
  for all to authenticated
  using (lower(auth.jwt() ->> 'email') = lower('YOUR_ADMIN_EMAIL'))
  with check (lower(auth.jwt() ->> 'email') = lower('YOUR_ADMIN_EMAIL'));

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
    and lower(auth.jwt() ->> 'email') = lower('YOUR_ADMIN_EMAIL')
  );
