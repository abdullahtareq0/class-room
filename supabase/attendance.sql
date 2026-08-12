-- ============================================================================
--  ميزة الحضور (تحضير المتدرّبين) — شغّله مرة واحدة في Supabase SQL Editor
--  (RLS مطفّي أثناء التطوير، مثل باقي جداول أحمد)
-- ============================================================================

create table if not exists attendance (
  id            uuid primary key default gen_random_uuid(),
  classroom_id  uuid not null references classrooms(id) on delete cascade,
  student_id    uuid not null references profiles(id)   on delete cascade,
  session_date  date not null default current_date,
  present       boolean not null default true,
  marked_at     timestamptz not null default now(),
  unique (classroom_id, student_id, session_date)
);

create index if not exists attendance_class_date_idx
  on attendance (classroom_id, session_date);

-- تحديثات مباشرة (اختياري — يبقي الحضور متزامنًا)
do $$ begin
  begin alter publication supabase_realtime add table attendance; exception when duplicate_object then null; end;
end $$;
