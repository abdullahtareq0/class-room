# Classroom Sessions — صفوف مباشرة

تطبيق ويب لجلسات تعليمية حيّة (Vanilla JS + Supabase). المعلم يفتح صفًا ويشارك رمزه،
والطلاب ينضمّون ليشتغلوا على المهام، يرفعون أعمالهم، ويتحادثون — كل شيء مباشر بدون تحديث الصفحة.

عربي RTL أول مع تبديل للإنجليزية LTR، وتصميم دافئ ذهبي مطابق للـ UI المعتمد.

## المزايا
- تسجيل/دخول ببريد وكلمة مرور + اختيار دور (معلّم/طالب) + استعادة الجلسة.
- المعلم ينشئ صفًا برمز فريد؛ الطالب ينضم بالرمز.
- الأهداف والمهام (بموعد تسليم).
- تعليم المهمة كمنجزة + ظهور أسماء من أنهاها للجميع.
- نِسب التقدّم: لكل مهمة، لكل طالب، وللصف كاملًا.
- إدارة الأعضاء (إزالة طالب).
- رفع الملفات + جدول التسليمات (المعلم يرى الكل، الطالب ملفاته فقط) عبر Supabase Storage.
- محادثة الصف مباشرة (Realtime) مع إرسال بـ Enter وإرفاق ملف يظهر في المحادثة والتسليمات.

## التشغيل محليًا
التطبيق يستخدم ES Modules فلازم يُخدَّم عبر http (مو `file://`):
```bash
python -m http.server 5500
```
ثم افتح: <http://localhost:5500>

## إعداد Supabase (مرة واحدة)
1. أنشئ مشروع Supabase.
2. الصق [`supabase/schema.sql`](supabase/schema.sql) في SQL Editor وشغّله (٨ جداول + trigger + Realtime + bucket).
3. (للتجربة) عطّل «Confirm email» في Authentication ليعمل التسجيل فورًا.
4. ضع `Project URL` و`anon key` في [`js/supabase.js`](js/supabase.js).
   > مفتاح anon علني وآمن للعميل؛ RLS يحمي البيانات (مرحلة ٨).

## البنية
```
index.html
css/style.css
js/     supabase · auth · router · i18n · ui · classrooms · goals
        tasks · progress · members · submissions · chat · realtime
views/  login · signup · dashboard · classroom
supabase/schema.sql
```

## ملاحظة للفريق
RLS مطفّي أثناء التطوير (حسب الـ PRD §12) لأن قراءات المستخدمين المتبادلة
(الأعضاء، أسماء المحادثة، «أنهاها») تحتاجه مطفّيًا. يُفعّل مع سياسات حقيقية في مرحلة ٨.
