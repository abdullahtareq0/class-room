// Arabic-first localization with an Arabic/English toggle and RTL/LTR (feature 14).
const STR = {
  ar: {
    brand: 'إتقان', dir: 'rtl',
    // auth
    signInTitle: 'تسجيل الدخول', signInSub: 'أتقِن مهاراتك في دورات مباشرة.',
    signUpTitle: 'إنشاء حساب', signUpSub: 'اختر دورك وابدأ.',
    fullName: 'الاسم الكامل', email: 'البريد الإلكتروني', password: 'كلمة المرور',
    chooseRole: 'اختر دورك', teacher: 'مدرّب', student: 'متدرّب',
    teacherHint: 'ينشئ دورات ومهامًا', studentHint: 'ينضم ويسلّم أعماله',
    signInBtn: 'دخول', signUpBtn: 'إنشاء الحساب',
    noAccount: 'ما عندك حساب؟ أنشئ واحدًا', haveAccount: 'لديك حساب؟ سجّل الدخول',
    signOut: 'تسجيل الخروج',
    // dashboard
    teacherDash: 'دوراتي', studentDash: 'دوراتي',
    createClass: 'إنشاء دورة', joinClass: 'انضمام برمز',
    createTitle: 'دورة جديدة', className: 'اسم الدورة', classDesc: 'وصف (اختياري)',
    create: 'إنشاء', join: 'انضمام', enterCode: 'أدخل رمز الدورة', code: 'الرمز',
    members: 'عضو', tasks: 'مهمة', noClasses: 'لا توجد دورات بعد.',
    // classroom
    back: 'رجوع', classProgress: 'تقدّم الدورة', live: 'مباشر',
    goals: 'الأهداف', tabTasks: 'المهام', people: 'الأعضاء', files: 'الملفات', chat: 'المحادثة',
    add: 'إضافة', goalTitle: 'عنوان الهدف', goalDesc: 'وصف (اختياري)',
    taskTitle: 'عنوان المهمة', taskDesc: 'وصف (اختياري)', dueDate: 'موعد التسليم',
    due: 'التسليم', noDue: 'بدون موعد', markDone: 'تعليم كمنجز', doneState: 'تم الإنجاز ✓',
    upload: 'رفع ملف', finishedBy: 'أنهاها:', nobodyYet: 'لا أحد بعد',
    addStudent: 'إضافة متدرّب بالبريد', studentEmail: 'بريد المتدرّب', remove: 'إزالة',
    confirmRemove: 'إزالة هذا المتدرّب من الدورة؟',
    noFiles: 'لا توجد ملفات بعد.', download: 'تنزيل', mySubs: 'ملفاتي', allSubs: 'كل التسليمات',
    chatSub: 'رسائل الدورة — تصل مباشرة', send: 'إرسال', attach: 'إرفاق', typeMsg: 'اكتب رسالة… (Enter للإرسال)',
    attachedFile: 'أرفق ملفًا',
    // states / progress
    perTask: 'إنجاز المهمة', perStudent: 'تقدّم المتدرّب', ofTasks: 'من المهام',
    // toasts
    joined: 'انضممت للدورة بنجاح', already: 'أنت منضم لهذه الدورة مسبقًا', invalid: 'رمز غير صحيح',
    saved: 'تم الحفظ', removed: 'تمت الإزالة', uploaded: 'تم رفع الملف', tooBig: 'الحد الأقصى 20 ميجابايت',
    error: 'حدث خطأ ما', codeCopied: 'نُسخ الرمز',
    roleTeacher: 'مدرّب', roleStudent: 'متدرّب',
    // delete course + attendance
    deleteClass: 'حذف الدورة', confirmDelete: 'حذف هذه الدورة نهائيًا؟ سيُحذف كل ما فيها.', deleted: 'تم الحذف',
    attendance: 'الحضور', sessionDate: 'تاريخ الجلسة', present: 'حاضر', absent: 'غائب', attRate: 'نسبة الحضور',
    noAttendanceYet: 'لا يوجد سجل حضور بعد', absRate: 'نسبة الغياب',
    confirm: 'تأكيد', cancel: 'إلغاء',
    myStats: 'إحصائياتي', chooseCourse: 'اختر الدورة', completionRate: 'نسبة الإنجاز',
    daysAttended: 'أيام حضرتها', daysLeft: 'يوم متبقٍّ', endedLabel: 'انتهت',
    courseEnd: 'تاريخ انتهاء الدورة', endRequired: 'اختر تاريخ انتهاء الدورة أولًا',
  },
  en: {
    brand: 'Itqan', dir: 'ltr',
    signInTitle: 'Sign in', signInSub: 'Master your skills in live courses.',
    signUpTitle: 'Create account', signUpSub: 'Pick your role and start.',
    fullName: 'Full name', email: 'Email', password: 'Password',
    chooseRole: 'Choose your role', teacher: 'Instructor', student: 'Trainee',
    teacherHint: 'Creates courses & tasks', studentHint: 'Joins & submits work',
    signInBtn: 'Sign in', signUpBtn: 'Create account',
    noAccount: "No account? Create one", haveAccount: 'Have an account? Sign in',
    signOut: 'Sign out',
    teacherDash: 'My courses', studentDash: 'My courses',
    createClass: 'Create course', joinClass: 'Join with code',
    createTitle: 'New course', className: 'Course name', classDesc: 'Description (optional)',
    create: 'Create', join: 'Join', enterCode: 'Enter course code', code: 'Code',
    members: 'members', tasks: 'tasks', noClasses: 'No courses yet.',
    back: 'Back', classProgress: 'Course progress', live: 'Live',
    goals: 'Goals', tabTasks: 'Tasks', people: 'People', files: 'Files', chat: 'Chat',
    add: 'Add', goalTitle: 'Goal title', goalDesc: 'Description (optional)',
    taskTitle: 'Task title', taskDesc: 'Description (optional)', dueDate: 'Due date',
    due: 'Due', noDue: 'No due date', markDone: 'Mark as done', doneState: 'Done ✓',
    upload: 'Upload', finishedBy: 'Finished by:', nobodyYet: 'Nobody yet',
    addStudent: 'Add trainee by email', studentEmail: 'Trainee email', remove: 'Remove',
    confirmRemove: 'Remove this trainee from the course?',
    noFiles: 'No files yet.', download: 'Download', mySubs: 'My files', allSubs: 'All submissions',
    chatSub: 'Course messages — delivered live', send: 'Send', attach: 'Attach', typeMsg: 'Type a message… (Enter to send)',
    attachedFile: 'attached a file',
    perTask: 'Task completion', perStudent: 'Trainee progress', ofTasks: 'of tasks',
    joined: 'Joined the course', already: 'You already joined this course', invalid: 'Invalid code',
    saved: 'Saved', removed: 'Removed', uploaded: 'File uploaded', tooBig: 'Max size is 20 MB',
    error: 'Something went wrong', codeCopied: 'Code copied',
    roleTeacher: 'Instructor', roleStudent: 'Trainee',
    // delete course + attendance
    deleteClass: 'Delete course', confirmDelete: 'Delete this course permanently? Everything in it will be removed.', deleted: 'Deleted',
    attendance: 'Attendance', sessionDate: 'Session date', present: 'Present', absent: 'Absent', attRate: 'Attendance rate',
    noAttendanceYet: 'No attendance recorded yet', absRate: 'Absence rate',
    confirm: 'Confirm', cancel: 'Cancel',
    myStats: 'My stats', chooseCourse: 'Choose course', completionRate: 'Completion',
    daysAttended: 'Days attended', daysLeft: 'Days left', endedLabel: 'Ended',
    courseEnd: 'Course end date', endRequired: 'Pick a course end date first',
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
