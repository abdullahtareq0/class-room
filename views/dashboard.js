// Dashboard (foundation — friend's features 3-6): teacher lists/creates classes,
// student lists joined classes + joins by code.
import { signOut } from '../js/auth.js';
import { t } from '../js/i18n.js';
import { mount, topbar, wireTopbar, toast, esc, initial } from '../js/ui.js';
import { reroute, go } from '../js/router.js';
import { createClassroom, listForTeacher, listForStudent, joinByCode } from '../js/classrooms.js';

export async function renderDashboard(profile) {
  const l = t();
  const isTeacher = profile.role === 'teacher';

  let classes = [];
  try {
    classes = isTeacher ? await listForTeacher(profile.id) : await listForStudent(profile.id);
  } catch (e) { toast(l.error, true); }

  const right = `
    <span class="pill">${esc(isTeacher ? l.roleTeacher : l.roleStudent)}</span>
    <div class="avatar sm">${esc(initial(profile.full_name))}</div>
    <button class="btn ghost sm" id="out">${esc(l.signOut)}</button>`;

  const cards = classes.map((c) => {
    const m = c.classroom_members?.[0]?.count ?? 0;
    const tk = c.tasks?.[0]?.count ?? 0;
    return `
      <div class="card class-card" data-id="${c.id}">
        <div class="spread">
          <h3>${esc(c.name)}</h3>
          <span class="pill code">${esc(c.classroom_code)}</span>
        </div>
        <p class="muted small">${esc(c.description || '')}</p>
        <div class="class-meta">
          <span>👥 ${m} ${esc(l.members)}</span>
          <span>📋 ${tk} ${esc(l.tasks)}</span>
        </div>
      </div>`;
  }).join('');

  const action = isTeacher
    ? `<button class="btn" id="create">＋ ${esc(l.createClass)}</button>`
    : `<button class="btn" id="join">＋ ${esc(l.joinClass)}</button>`;

  mount(`
    ${topbar(right)}
    <div class="page">
      <div class="spread" style="margin-bottom:18px">
        <div><div class="kicker">${esc(l.brand)}</div><h1>${esc(isTeacher ? l.teacherDash : l.studentDash)}</h1></div>
        ${action}
      </div>
      ${classes.length ? `<div class="grid">${cards}</div>` : `<div class="empty">${esc(l.noClasses)}</div>`}
    </div>
  `);
  wireTopbar(reroute);
  document.getElementById('out').onclick = async () => { await signOut(); };

  document.querySelectorAll('.class-card').forEach((el) => {
    el.onclick = () => go('#/classroom/' + el.dataset.id);
  });

  if (isTeacher) {
    document.getElementById('create').onclick = () => openCreate(profile, l);
  } else {
    document.getElementById('join').onclick = () => openJoin(profile, l);
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
