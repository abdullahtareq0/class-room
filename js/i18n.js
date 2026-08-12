// Arabic-first localization with an Arabic/English toggle and RTL/LTR (feature 14).
const STR = {
  ar: {
    brand: 'صفوف مباشرة', dir: 'rtl',
    // auth
    signInTitle: 'تسجيل الدخول', signInSub: 'ادخل إلى مساحتك التعليمية.',
    signUpTitle: 'إنشاء حساب', signUpSub: 'اختر دورك وابدأ.',
    fullName: 'الاسم الكامل', email: 'البريد الإلكتروني', password: 'كلمة المرور',
    chooseRole: 'اختر دورك', teacher: 'معلّم', student: 'طالب',
    teacherHint: 'ينشئ صفوفًا ومهامًا', studentHint: 'ينضم ويسلّم أعماله',
    signInBtn: 'دخول', signUpBtn: 'إنشاء الحساب',
    noAccount: 'ما عندك حساب؟ أنشئ واحدًا', haveAccount: 'لديك حساب؟ سجّل الدخول',
    signOut: 'تسجيل الخروج',
    // dashboard
    teacherDash: 'صفوفي', studentDash: 'صفوفي',
    createClass: 'إنشاء صف', joinClass: 'انضمام برمز',
    createTitle: 'صف جديد', className: 'اسم الصف', classDesc: 'وصف (اختياري)',
    create: 'إنشاء', join: 'انضمام', enterCode: 'أدخل رمز الصف', code: 'الرمز',
    members: 'عضو', tasks: 'مهمة', noClasses: 'لا توجد صفوف بعد.',
    // classroom
    back: 'رجوع', classProgress: 'تقدّم الصف', live: 'مباشر',
    goals: 'الأهداف', tabTasks: 'المهام', people: 'الأعضاء', files: 'الملفات', chat: 'المحادثة',
    add: 'إضافة', goalTitle: 'عنوان الهدف', goalDesc: 'وصف (اختياري)',
    taskTitle: 'عنوان المهمة', taskDesc: 'وصف (اختياري)', dueDate: 'موعد التسليم',
    due: 'التسليم', noDue: 'بدون موعد', markDone: 'تعليم كمنجز', doneState: 'تم الإنجاز ✓',
    upload: 'رفع ملف', finishedBy: 'أنهاها:', nobodyYet: 'لا أحد بعد',
    addStudent: 'إضافة طالب بالبريد', studentEmail: 'بريد الطالب', remove: 'إزالة',
    confirmRemove: 'إزالة هذا الطالب من الصف؟',
    noFiles: 'لا توجد ملفات بعد.', download: 'تنزيل', mySubs: 'ملفاتي', allSubs: 'كل التسليمات',
    chatSub: 'رسائل الصف — تصل مباشرة', send: 'إرسال', attach: 'إرفاق', typeMsg: 'اكتب رسالة… (Enter للإرسال)',
    attachedFile: 'أرفق ملفًا',
    // states / progress
    perTask: 'إنجاز المهمة', perStudent: 'تقدّم الطالب', ofTasks: 'من المهام',
    // toasts
    joined: 'انضممت للصف بنجاح', already: 'أنت منضم لهذا الصف مسبقًا', invalid: 'رمز غير صحيح',
    saved: 'تم الحفظ', removed: 'تمت الإزالة', uploaded: 'تم رفع الملف', tooBig: 'الحد الأقصى 20 ميجابايت',
    error: 'حدث خطأ ما', codeCopied: 'نُسخ الرمز',
    roleTeacher: 'معلّم', roleStudent: 'طالب',
  },
  en: {
    brand: 'Live Classroom', dir: 'ltr',
    signInTitle: 'Sign in', signInSub: 'Enter your teaching workspace.',
    signUpTitle: 'Create account', signUpSub: 'Pick your role and start.',
    fullName: 'Full name', email: 'Email', password: 'Password',
    chooseRole: 'Choose your role', teacher: 'Teacher', student: 'Student',
    teacherHint: 'Creates classes & tasks', studentHint: 'Joins & submits work',
    signInBtn: 'Sign in', signUpBtn: 'Create account',
    noAccount: "No account? Create one", haveAccount: 'Have an account? Sign in',
    signOut: 'Sign out',
    teacherDash: 'My classrooms', studentDash: 'My classrooms',
    createClass: 'Create classroom', joinClass: 'Join with code',
    createTitle: 'New classroom', className: 'Classroom name', classDesc: 'Description (optional)',
    create: 'Create', join: 'Join', enterCode: 'Enter classroom code', code: 'Code',
    members: 'members', tasks: 'tasks', noClasses: 'No classrooms yet.',
    back: 'Back', classProgress: 'Class progress', live: 'Live',
    goals: 'Goals', tabTasks: 'Tasks', people: 'People', files: 'Files', chat: 'Chat',
    add: 'Add', goalTitle: 'Goal title', goalDesc: 'Description (optional)',
    taskTitle: 'Task title', taskDesc: 'Description (optional)', dueDate: 'Due date',
    due: 'Due', noDue: 'No due date', markDone: 'Mark as done', doneState: 'Done ✓',
    upload: 'Upload', finishedBy: 'Finished by:', nobodyYet: 'Nobody yet',
    addStudent: 'Add student by email', studentEmail: 'Student email', remove: 'Remove',
    confirmRemove: 'Remove this student from the class?',
    noFiles: 'No files yet.', download: 'Download', mySubs: 'My files', allSubs: 'All submissions',
    chatSub: 'Class messages — delivered live', send: 'Send', attach: 'Attach', typeMsg: 'Type a message… (Enter to send)',
    attachedFile: 'attached a file',
    perTask: 'Task completion', perStudent: 'Student progress', ofTasks: 'of tasks',
    joined: 'Joined the class', already: 'You already joined this class', invalid: 'Invalid code',
    saved: 'Saved', removed: 'Removed', uploaded: 'File uploaded', tooBig: 'Max size is 20 MB',
    error: 'Something went wrong', codeCopied: 'Code copied',
    roleTeacher: 'Teacher', roleStudent: 'Student',
  },
};

let lang = localStorage.getItem('lang') || 'ar';

export function t() { return STR[lang]; }
export function getLang() { return lang; }
export function setLang(l) {
  lang = l; localStorage.setItem('lang', l);
  applyDir();
}
export function toggleLang() { setLang(lang === 'ar' ? 'en' : 'ar'); }
export function applyDir() {
  document.documentElement.lang = lang;
  document.documentElement.dir = STR[lang].dir;
}

// theme
let theme = localStorage.getItem('theme') || 'light';
export function getTheme() { return theme; }
export function applyTheme() { document.documentElement.dataset.theme = theme; }
export function toggleTheme() {
  theme = theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', theme); applyTheme();
}
