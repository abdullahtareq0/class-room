-- ============================================================================
-- Classroom Sessions — Supabase schema (run once in the SQL Editor)
-- 8 tables + trigger + realtime + storage bucket. RLS stays OFF during dev
-- (PRD §12); turn it on with real policies in phase 8.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('teacher', 'student');
  end if;
end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role user_role not null default 'student',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- create the profile automatically on sign-up (reads full_name + role from metadata)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'student')
  ) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  teacher_id uuid not null references profiles(id) on delete cascade,
  classroom_code text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists classrooms_teacher_idx on classrooms (teacher_id);

create table if not exists classroom_members (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (classroom_id, student_id)
);
create index if not exists members_student_idx on classroom_members (student_id);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now()
);
create index if not exists goals_classroom_idx on goals (classroom_id);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists tasks_classroom_idx on tasks (classroom_id);

create table if not exists task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  completed boolean not null default true,
  completed_at timestamptz not null default now(),
  unique (task_id, student_id)
);
create index if not exists completions_task_idx on task_completions (task_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references classrooms(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_classroom_idx on messages (classroom_id, created_at desc);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text,
  created_at timestamptz not null default now()
);
create index if not exists submissions_task_idx on submissions (task_id);
create index if not exists submissions_student_idx on submissions (student_id);

-- realtime
do $$ begin
  begin alter publication supabase_realtime add table messages; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table task_completions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table goals; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table tasks; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table submissions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table classroom_members; exception when duplicate_object then null; end;
end $$;

-- storage bucket for student submissions (private, 20 MB cap)
insert into storage.buckets (id, name, public, file_size_limit)
values ('student-submissions', 'student-submissions', false, 20971520)
on conflict (id) do nothing;

drop policy if exists "dev authenticated all" on storage.objects;
create policy "dev authenticated all" on storage.objects
  for all to authenticated
  using (bucket_id = 'student-submissions')
  with check (bucket_id = 'student-submissions');
