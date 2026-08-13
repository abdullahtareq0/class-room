-- ميزة الإعلانات: جدول + فهرس + بث مباشر. شغّله مرة واحدة في SQL Editor.
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);
create index if not exists announcements_classroom_idx
  on public.announcements (classroom_id, created_at desc);

do $$ begin
  begin alter publication supabase_realtime add table public.announcements;
  exception when duplicate_object then null; end;
end $$;
