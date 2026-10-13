-- شغّل هذا الملف مرة وحدة في Supabase → SQL Editor

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  client text,
  location text,
  status text not null default 'open' check (status in ('open', 'closed')),
  pdf_path text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.walls (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  width_cm numeric,
  height_cm numeric,
  materials text[] not null default '{}',
  notes text,
  photo_path text,
  created_at timestamptz not null default now()
);
create index if not exists walls_project_idx on public.walls (project_id);

-- كل مستخدم يشوف بياناته فقط
alter table public.projects enable row level security;
alter table public.walls enable row level security;

create policy "own projects" on public.projects for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own walls" on public.walls for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- تخزين خاص للصور والـ PDF (غير عام — الوصول بروابط موقّعة مؤقتة)
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "own files read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files update" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
