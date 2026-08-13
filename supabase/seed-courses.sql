-- ============================================================================
--  إعادة إنشاء الدورات الست وإسنادها لحسابك — Supabase SQL Editor → Run
--  ⚠️ بدّل 'ضع_بريدك_هنا' ببريد حساب المدرّب اللي تسجّل دخول فيه (مكان واحد).
-- ============================================================================

alter table public.classrooms add column if not exists end_date date;

-- 1) نظّف أي نسخ سابقة من هذه الدورات (بالرموز الثابتة) — آمن
delete from public.classrooms
where classroom_code in ('GITHUB','AIML26','DATA10','CLOUD5','SECR44','PMGMT1');

-- 2) أنشئها من جديد وأسندها لبريدك
insert into public.classrooms (name, description, teacher_id, classroom_code, end_date)
select
  v.name, v.description,
  (select id from public.profiles where email = 'ضع_بريدك_هنا'),
  v.code, v.end_date
from (values
  ('Git وGitHub',                     'إدارة الأكواد والعمل الجماعي على المشاريع.',    'GITHUB', date '2026-10-01'),
  ('الذكاء الاصطناعي والتعلّم الآلي',  'خوارزميات التعلّم والنماذج الذكية.',            'AIML26', date '2026-12-15'),
  ('مقدمة في تحليل البيانات',          'من جمع البيانات إلى تصوّرها واستخلاص القرارات.', 'DATA10', date '2026-11-05'),
  ('الحوسبة السحابية',                 'نشر وإدارة الأنظمة على السحابة.',              'CLOUD5', date '2026-11-20'),
  ('أمن المعلومات',                    'حماية الأنظمة والتشفير وأساسيات الأمن.',         'SECR44', date '2026-12-01'),
  ('أساسيات إدارة المشاريع',           'من تعريف النطاق إلى إدارة المخاطر والجدول.',     'PMGMT1', date '2026-10-25')
) as v(name, description, code, end_date);
