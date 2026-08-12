// Dashboard (اتجاه ٣): شريط جانبي + بانر ترحيبي + بطاقات دورات بأغلفة.
import { signOut } from '../js/auth.js';
import { t, toggleTheme, toggleLang, getTheme, getLang } from '../js/i18n.js';
import { mount, toast, esc, initial, confirmDialog } from '../js/ui.js';
import { reroute, go } from '../js/router.js';
import { createClassroom, listForTeacher, listForStudent, joinByCode, deleteClassroom } from '../js/classrooms.js';

const LOGO = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/><path d="M22 10v5"/></svg>`;
const I_HOME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`;

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
        <div class="cover">
          <span class="wm">${esc(initial(c.name))}</span>
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
  const d = dialog(`
    <h3 style="margin-bottom:14px">${esc(l.createTitle)}</h3>
    <div class="field"><label>${esc(l.className)}</label><input id="n" required /></div>
    <div class="field"><label>${esc(l.classDesc)}</label><textarea id="ds"></textarea></div>
    <button class="btn block" id="ok">${esc(l.create)}</button>`);
  d.querySelector('#ok').onclick = async () => {
    const name = d.querySelector('#n').value.trim();
    if (!name) return;
    try {
      await createClassroom({ name, description: d.querySelector('#ds').value.trim(), teacherId: profile.id });
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
