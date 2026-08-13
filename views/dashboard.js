// Dashboard (اتجاه ٣): شريط جانبي + بانر ترحيبي + بطاقات دورات بأغلفة.
import { signOut } from '../js/auth.js';
import { t, toggleTheme, toggleLang, getTheme, getLang } from '../js/i18n.js';
import { mount, toast, esc, initial, confirmDialog } from '../js/ui.js';
import { reroute, go } from '../js/router.js';
import { createClassroom, listForTeacher, listForStudent, joinByCode, deleteClassroom } from '../js/classrooms.js';

const LOGO = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/><path d="M22 10v5"/></svg>`;
const I_HOME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`;
const I_CHART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>`;

// أيقونة موضوع الغلاف — تُختار من كلمات اسم الدورة
const SVG = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const TOPIC_ICONS = [
  [/git|github/i,                          SVG('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="8" r="3"/><path d="M6 9v6M18 11a9 9 0 0 1-9 9"/>')],
  [/ذكاء|اصطناع|تعلّ?م الآلي|machine|\bai\b|ml/i, SVG('<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>')],
  [/قواعد|database|\bsql\b/i,              SVG('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>')],
  [/بيانات|data|تحليل|analytic|إحصاء/i,    SVG('<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/>')],
  [/سحاب|cloud/i,                          SVG('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>')],
  [/أمن|امن|سيبر|security|cyber/i,         SVG('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>')],
  [/شبك|network/i,                         SVG('<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4M12 12H5v4M12 12h7v4"/>')],
  [/ويب|web|برمج|تطوير|code|javascript|python|java|c\+\+/i, SVG('<path d="M8 6 2 12l6 6M16 6l6 6-6 6M14 4l-4 16"/>')],
  [/مشروع|إدار|management|project/i,       SVG('<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>')],
];
const I_DEFAULT = SVG('<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/>');
function topicIcon(name) {
  const hit = TOPIC_ICONS.find(([re]) => re.test(name || ''));
  return hit ? hit[1] : I_DEFAULT;
}
// لون ثابت للدورة من عائلة البترولي (1..6) مشتق من معرّفها
function toneOf(c) {
  const s = c.id || c.name || '';
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 6) + 1;
}

export async function renderDashboard(profile) {
  const l = t();
  const isTeacher = profile.role === 'teacher';
  const first = (profile.full_name || '').split(' ')[0] || '';

  let classes = [];
  try {
    classes = isTeacher ? await listForTeacher(profile.id) : await listForStudent(profile.id);
  } catch (e) { toast(l.error, true); }

  const totalMembers = classes.reduce((s, c) => s + (c.classroom_members?.[0]?.count ?? 0), 0);

  const cards = classes.map((c) => {
    const m = c.classroom_members?.[0]?.count ?? 0;
    const tk = c.tasks?.[0]?.count ?? 0;
    return `
      <div class="ccard" data-id="${c.id}">
        <div class="cover tone-${toneOf(c)}">
          <span class="topic">${topicIcon(c.name)}</span>
          <span class="code">${esc(c.classroom_code)}</span>
          ${isTeacher ? `<button class="del" data-del="${c.id}" title="${esc(l.deleteClass)}">🗑</button>` : ''}
        </div>
        <div class="b">
          <h3>${esc(c.name)}</h3>
          ${c.description ? `<p>${esc(c.description)}</p>` : ''}
          <div class="meta">
            <span>👥 ${m} ${esc(l.members)}</span>
            <span>📋 ${tk} ${esc(l.tasks)}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  const hero = isTeacher ? `
    <div class="k">${esc(l.brand)} · ${esc(l.roleTeacher)}</div>
    <h1>أهلًا ${esc(first)} 👋</h1>
    <p>تابع دوراتك، أنشئ الجلسات، وسجّل الحضور.</p>
    <div class="stats">
      <div class="stat"><b>${classes.length}</b><span>${esc(l.teacherDash)}</span></div>
      <div class="stat"><b>${totalMembers}</b><span>${esc(l.members)}</span></div>
    </div>
    <button class="cta" id="heroCreate">＋ ${esc(l.createClass)}</button>` : `
    <div class="k">${esc(l.brand)} · ${esc(l.roleStudent)}</div>
    <h1>أهلًا ${esc(first)} 👋</h1>
    <p>انضم إلى دوراتك وتابع مهامك في مكان واحد.</p>
    <div class="stats"><div class="stat"><b>${classes.length}</b><span>${esc(l.studentDash)}</span></div></div>
    <button class="cta" id="heroJoin">＋ ${esc(l.joinClass)}</button>`;

  mount(`
  <div class="dash">
    <aside class="dside">
      <div class="brand"><span class="logo">${LOGO}</span>${esc(l.brand)}</div>
      <nav class="dnav">
        <button class="on" data-nav="home">${I_HOME} ${esc(l.teacherDash)}</button>
        ${!isTeacher ? `<button data-nav="stats">${I_CHART} ${esc(l.myStats)}</button>` : ''}
      </nav>
      <div class="foot">
        <div class="me">
          <div class="avatar sm">${esc(initial(profile.full_name))}</div>
          <div><div style="font-weight:700;font-size:13.5px">${esc(profile.full_name)}</div>
            <div class="muted small">${esc(isTeacher ? l.roleTeacher : l.roleStudent)}</div></div>
        </div>
        <button class="btn ghost sm block" id="out">${esc(l.signOut)}</button>
      </div>
    </aside>

    <main class="dmain">
      <div class="dtop">
        <div class="sp"></div>
        <button class="icon-btn" id="langBtn" title="Language">${getLang() === 'ar' ? 'EN' : 'ع'}</button>
        <button class="icon-btn" id="themeBtn" title="Theme">${getTheme() === 'light' ? '🌙' : '☀️'}</button>
      </div>

      <section class="hero">${hero}</section>

      <div class="spread" style="margin:0 4px 14px">
        <h2 style="font-size:19px">${esc(l.teacherDash)}</h2>
        <button class="btn sm" id="${isTeacher ? 'create' : 'join'}">＋ ${esc(isTeacher ? l.createClass : l.joinClass)}</button>
      </div>
      ${classes.length ? `<div class="ccards">${cards}</div>` : `<div class="empty">${esc(l.noClasses)}</div>`}
    </main>
  </div>`);

  // toggles + logout
  document.getElementById('out').onclick = async () => { await signOut(); };
  document.getElementById('themeBtn').onclick = () => { toggleTheme(); reroute(); };
  document.getElementById('langBtn').onclick = () => { toggleLang(); reroute(); };
  const navStats = document.querySelector('[data-nav="stats"]'); if (navStats) navStats.onclick = () => go('#/stats');

  // open a course
  document.querySelectorAll('.ccard').forEach((el) => {
    el.onclick = () => go('#/classroom/' + el.dataset.id);
  });

  // delete a course (teacher)
  document.querySelectorAll('[data-del]').forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const ok = await confirmDialog({ title: l.deleteClass, message: l.confirmDelete, confirmText: l.deleteClass });
      if (!ok) return;
      try { await deleteClassroom(btn.dataset.del); toast(l.deleted); reroute(); }
      catch (_) { toast(l.error, true); }
    };
  });

  // create / join (header button + hero button)
  if (isTeacher) {
    const open = () => openCreate(profile, l);
    document.getElementById('create').onclick = open;
    const hc = document.getElementById('heroCreate'); if (hc) hc.onclick = open;
  } else {
    const open = () => openJoin(profile, l);
    document.getElementById('join').onclick = open;
    const hj = document.getElementById('heroJoin'); if (hj) hj.onclick = open;
  }
}

function dialog(innerHtml) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.45);display:grid;place-items:center;z-index:50;padding:16px';
  wrap.innerHTML = `<div class="card" style="max-width:420px;width:100%;padding:22px">${innerHtml}</div>`;
  wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
  document.body.appendChild(wrap);
  return wrap;
}

function openCreate(profile, l) {
  const today = new Date().toISOString().slice(0, 10);
  const d = dialog(`
    <h3 style="margin-bottom:14px">${esc(l.createTitle)}</h3>
    <div class="field"><label>${esc(l.className)}</label><input id="n" required /></div>
    <div class="field"><label>${esc(l.classDesc)}</label><textarea id="ds"></textarea></div>
    <div class="field"><label>${esc(l.courseEnd)}</label><input id="end" type="date" min="${today}" required /></div>
    <button class="btn block" id="ok">${esc(l.create)}</button>`);
  // اختيار من التقويم فقط — امنع الكتابة اليدوية
  d.querySelector('#end').addEventListener('keydown', (e) => e.preventDefault());
  d.querySelector('#ok').onclick = async () => {
    const name = d.querySelector('#n').value.trim();
    const endDate = d.querySelector('#end').value;
    if (!name) return;
    if (!endDate) { toast(l.endRequired, true); return; }
    try {
      await createClassroom({ name, description: d.querySelector('#ds').value.trim(), teacherId: profile.id, endDate });
      d.remove(); toast(l.saved); reroute();
    } catch (e) { toast(l.error, true); }
  };
}

function openJoin(profile, l) {
  const d = dialog(`
    <h3 style="margin-bottom:14px">${esc(l.joinClass)}</h3>
    <div class="field"><label>${esc(l.enterCode)}</label><input id="c" style="text-transform:uppercase;letter-spacing:2px" maxlength="6" /></div>
    <button class="btn block" id="ok">${esc(l.join)}</button>`);
  d.querySelector('#ok').onclick = async () => {
    const code = d.querySelector('#c').value.trim();
    if (!code) return;
    try {
      const res = await joinByCode(code, profile.id);
      if (res === 'joined') { d.remove(); toast(l.joined); reroute(); }
      else if (res === 'already') toast(l.already, true);
      else toast(l.invalid, true);
    } catch (e) { toast(l.error, true); }
  };
}
