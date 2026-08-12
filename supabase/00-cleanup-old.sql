-- ============================================================================
--  تنظيف المخطّط القديم (حقّي) قبل توحيد القاعدة على مخطّط أحمد.
--  الترتيب: 1) شغّل هذا الملف   2) شغّل schema.sql   3) أنشئ حسابًا جديدًا
--  تنبيه: هذا يمسح جداول التجربة القديمة (بيانات تجريبية فقط).
-- ============================================================================

-- جداولي القديمة
drop table if exists public.objectives    cascade;
drop table if exists public.class_members cascade;
drop table if exists public.classes       cascade;

-- دوالي القديمة
drop function if exists public.create_class(text)       cascade;
drop function if exists public.join_class_by_code(text) cascade;
drop function if exists public.is_class_owner(uuid)     cascade;
drop function if exists public.is_class_member(uuid)    cascade;

-- قفل الدور القديم
drop trigger  if exists lock_role on public.profiles;
drop function if exists public.prevent_role_change() cascade;

-- جدول profiles القديم (سيُعاد إنشاؤه في schema.sql بشكل أحمد: مع full_name + enum)
drop table if exists public.profiles cascade;
