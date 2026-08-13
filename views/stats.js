// صفحة "إحصائياتي" للمتدرّب: بطاقة لكل دورة فيها حضوره وإنجازه وأيامه والمتبقّي.
import { signOut } from '../js/auth.js';
import { t, toggleTheme, toggleLang, getTheme, getLang } from '../js/i18n.js';
import { mount, toast, esc, initial } from '../js/ui.js';
import { reroute, go } from '../js/router.js';
import { listForStudent } from '../js/classrooms.js';
import { studentAttendanceStats } from '../js/attendance.js';
import { listTasks, listCompletions } from '../js/tasks.js';
import { studentProgress } from '../js/progress.js';

const LOGO = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/><path d="M22 10v5"/></svg>`;
const I_HOME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`;
const I_CHART = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>`;

export async function renderStats(profile) {
  const l = t();
  let classes = [];
  try { classes = await listForStudent(profile.id); } catch (e) { toast(l.error, true); }

  mount(`
  <div class="dash">
    <aside class="dside">
      <div class="brand"><span class="logo">${LOGO}</span>${esc(l.brand)}</div>
      <nav class="dnav">
        <button data-nav="home">${I_HOME} ${esc(l.teacherDash)}</button>
        <button class="on" data-nav="stats">${I_CHART} ${esc(l.myStats)}</button>
      </nav>
      <div class="foot">
        <div class="me">
          <div class="avatar sm">${esc(initial(profile.full_name))}</div>
          <div><div style="font-weight:700;font-size:13.5px">${esc(profile.full_name)}</div>
            <div class="muted small">${esc(l.roleStudent)}</div></div>
        </div>
        <button class="btn ghost sm block" id="out">${esc(l.signOut)}</button>
      </div>
    </aside>

    <main class="dmain">
      <div class="dtop">
        <div class="sp"></div>
        <button class="icon-btn" id="langBtn">${getLang() === 'ar' ? 'EN' : 'ع'}</button>
        <button class="icon-btn" id="themeBtn">${getTheme() === 'light' ? '🌙' : '☀️'}</button>
      </div>
      <div class="eyebrow">${esc(l.roleStudent)}</div>
      <h1>${esc(l.myStats)}</h1>
      <div class="sub">تقدّمك في كل دورة.</div>

      <div id="statsList" class="stack" style="margin-top:22px;max-width:840px">
        ${classes.length ? '' : `<div class="empty">${esc(l.noClasses)}</div>`}
      </div>
    </main>
  </div>`);

  document.getElementById('out').onclick = async () => { await signOut(); };
  document.getElementById('themeBtn').onclick = () => { toggleTheme(); reroute(); };
  document.getElementById('langBtn').onclick = () => { toggleLang(); reroute(); };
  document.querySelector('[data-nav="home"]').onclick = () => go('#/dashboard');

  // بطاقة لكل دورة، تُملأ إحصائياتها بشكل مستقل
  const list = document.getElementById('statsList');
  for (const c of classes) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'padding:18px;cursor:pointer';
    card.innerHTML = `
      <div class="spread" style="margin-bottom:12px">
        <div style="font-weight:800;font-size:17px">${esc(c.name)}</div>
        <span class="pill code">${esc(c.classroom_code)}</span>
      </div>
      <div class="mystats"><div class="loading" style="grid-column:1/-1">…</div></div>`;
    card.onclick = () => go('#/classroom/' + c.id);   // اضغط لفتح الدورة
    list.appendChild(card);
    fillCourseStats(card.querySelector('.mystats'), c, profile, l);
  }
}

async function fillCourseStats(box, c, profile, l) {
  let att = { attended: 0, rate: 0 }, tasks = [], comps = [];
  try {
    [att, tasks, comps] = await Promise.all([
      studentAttendanceStats(c.id, profile.id),
      listTasks(c.id),
      listCompletions(c.id),
    ]);
  } catch (e) { /* تجاهل — نعرض أصفارًا */ }

  const progress = studentProgress(profile.id, comps, tasks.length);

  let daysCell;
  if (c.end_date) {
    const diff = Math.ceil((new Date(c.end_date) - new Date()) / 86400000);
    daysCell = diff > 0
      ? `<div class="n">${diff}</div><div class="l">${esc(l.daysLeft)}</div>`
      : `<div class="n">✓</div><div class="l">${esc(l.endedLabel)}</div>`;
  } else {
    daysCell = `<div class="n">—</div><div class="l">${esc(l.daysLeft)}</div>`;
  }

  box.innerHTML = `
    <div class="mystat"><div class="n">${att.rate}%</div><div class="l">${esc(l.attRate)}</div></div>
    <div class="mystat"><div class="n">${att.absenceRate}%</div><div class="l">${esc(l.absRate)}</div></div>
    <div class="mystat"><div class="n">${progress}%</div><div class="l">${esc(l.completionRate)}</div></div>
    <div class="mystat"><div class="n">${att.attended}</div><div class="l">${esc(l.daysAttended)}</div></div>
    <div class="mystat">${daysCell}</div>`;
}
