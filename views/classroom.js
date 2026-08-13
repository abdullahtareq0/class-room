// Classroom view: shell + panels. The Goals panel is foundation (friend);
// Tasks / People / Files / Chat panels + class progress are ★ your features 8-14.
import { t, toggleTheme, toggleLang, getTheme, getLang } from '../js/i18n.js';
import { mount, toast, esc, initial, fmtDate, fmtDay, confirmDialog } from '../js/ui.js';
import { signOut } from '../js/auth.js';
import { reroute, go } from '../js/router.js';

const LOGO = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/><path d="M22 10v5"/></svg>`;
const I_HOME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`;
import { getClassroom } from '../js/classrooms.js';
import { listGoals, addGoal } from '../js/goals.js';
import { listTasks, addTask, listCompletions, markDone, unmarkDone } from '../js/tasks.js';
import { listMembers, removeMember } from '../js/members.js';
import { taskProgress, studentProgress, classProgress } from '../js/progress.js';
import { uploadSubmission, listSubmissions, signedUrl, fileExt, MAX_BYTES } from '../js/submissions.js';
import { listMessages, sendMessage, encodeAttachment } from '../js/chat.js';
import { subscribeToClassroom } from '../js/realtime.js';
import { listAttendance, setAttendance } from '../js/attendance.js';
import { I_MEGA } from '../js/announcements.js';

let unsub = null; // teardown for the previous room's realtime channel

export async function renderClassroom(id, profile) {
  if (unsub) { unsub(); unsub = null; }

  const S = {
    id, profile, isTeacher: profile.role === 'teacher', tab: 'tasks',
    room: null, goals: [], tasks: [], members: [], completions: [], submissions: [], messages: [],
  };

  try {
    S.room = await getClassroom(id);
    await reloadAll(S);
  } catch (e) { toast(t().error, true); return go('#/dashboard'); }

  renderShell(S);
  renderPanel(S);

  // Live updates (feature 13 + realtime for tasks/completions/goals/files).
  unsub = subscribeToClassroom(id, {
    onGoal: async () => { S.goals = await listGoals(id); if (S.tab === 'goals') renderPanel(S); },
    onTask: async () => { S.tasks = await listTasks(id); refreshHeader(S); if (S.tab === 'tasks') renderPanel(S); },
    onCompletion: async () => { S.completions = await listCompletions(id); refreshHeader(S); if (['tasks','people'].includes(S.tab)) renderPanel(S); },
    onMember: async () => { S.members = await listMembers(id); refreshHeader(S); if (['people','tasks'].includes(S.tab)) renderPanel(S); },
    onSubmission: async () => { S.submissions = await loadSubs(S); if (S.tab === 'files') renderPanel(S); },
    onMessage: async () => { S.messages = await listMessages(id); if (S.tab === 'chat') renderPanel(S); },
  });

  window.addEventListener('hashchange', () => { if (unsub) { unsub(); unsub = null; } }, { once: true });
}

async function loadSubs(S) {
  return listSubmissions(S.id, S.isTeacher ? null : S.profile.id);
}

async function reloadAll(S) {
  [S.goals, S.tasks, S.members, S.completions, S.messages, S.submissions] = await Promise.all([
    listGoals(S.id), listTasks(S.id), listMembers(S.id), listCompletions(S.id), listMessages(S.id), loadSubs(S),
  ]);
}

/* ---------------- shell ---------------- */
function renderShell(S) {
  const l = t();
  const cp = classProgress(S.tasks.length, S.members.length, S.completions);
  const tabs = [
    ['goals', l.goals], ['tasks', l.tabTasks], ['people', l.people], ['files', l.files], ['chat', l.chat],
  ];
  if (S.isTeacher) tabs.push(['attendance', l.attendance]); // الحضور — للمدرّب فقط
  mount(`
  <div class="dash">
    <aside class="dside">
      <div class="brand"><span class="logo">${LOGO}</span>${esc(l.brand)}</div>
      <nav class="dnav">
        <button data-nav="home">${I_HOME} ${esc(l.teacherDash)}</button>
        <button data-nav="ann">${I_MEGA} ${esc(l.announcements)}</button>
      </nav>
      <div class="foot">
        <div class="me">
          <div class="avatar sm">${esc(initial(S.profile.full_name))}</div>
          <div><div style="font-weight:700;font-size:13.5px">${esc(S.profile.full_name)}</div>
            <div class="muted small">${esc(S.isTeacher ? l.roleTeacher : l.roleStudent)}</div></div>
        </div>
        <button class="btn ghost sm block" id="out">${esc(l.signOut)}</button>
      </div>
    </aside>

    <main class="dmain">
      <div class="dtop">
        <button class="btn ghost sm" id="back">${esc(l.back)} ↩</button>
        <div class="sp"></div>
        <button class="icon-btn" id="langBtn" title="Language">${getLang() === 'ar' ? 'EN' : 'ع'}</button>
        <button class="icon-btn" id="themeBtn" title="Theme">${getTheme() === 'light' ? '🌙' : '☀️'}</button>
      </div>

      <div class="room-head">
        <div class="spread">
          <div>
            <h2>${esc(S.room.name)}</h2>
            <p class="muted small">${esc(S.room.description || '')}</p>
            <div class="row" style="margin-top:6px">
              <span class="pill code" id="code">${esc(S.room.classroom_code)} ⧉</span>
              <span class="pill live">● ${esc(l.live)}</span>
            </div>
          </div>
          <div class="row">
            <div class="ring" id="cpRing" style="--p:${cp}"><b>${cp}%</b></div>
            <div class="small muted">${esc(l.classProgress)}</div>
          </div>
        </div>
      </div>
      <div class="tabs" id="tabs">
        ${tabs.map(([k, label]) => `<button class="tab ${k === S.tab ? 'active' : ''}" data-tab="${k}">${esc(label)}</button>`).join('')}
      </div>
      <div id="panel"></div>
    </main>
  </div>
  `);
  document.getElementById('out').onclick = async () => { await signOut(); };
  document.getElementById('themeBtn').onclick = () => { toggleTheme(); reroute(); };
  document.getElementById('langBtn').onclick = () => { toggleLang(); reroute(); };
  document.querySelector('[data-nav="home"]').onclick = () => go('#/dashboard');
  document.querySelector('[data-nav="ann"]').onclick = () => go('#/announcements');
  document.getElementById('back').onclick = () => go('#/dashboard');
  document.getElementById('code').onclick = () => {
    navigator.clipboard?.writeText(S.room.classroom_code); toast(l.codeCopied);
  };
  document.querySelectorAll('.tab').forEach((el) => {
    el.onclick = () => {
      S.tab = el.dataset.tab;
      document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === el));
      renderPanel(S);
    };
  });
}

function refreshHeader(S) {
  const ring = document.getElementById('cpRing');
  if (!ring) return;
  const cp = classProgress(S.tasks.length, S.members.length, S.completions);
  ring.style.setProperty('--p', cp);
  ring.querySelector('b').textContent = cp + '%';
}

function renderPanel(S) {
  const map = { goals: goalsPanel, tasks: tasksPanel, people: peoplePanel, files: filesPanel, chat: chatPanel, attendance: attendancePanel };
  (map[S.tab] || tasksPanel)(S);
}
function setPanel(html) { document.getElementById('panel').innerHTML = html; }

/* ---------------- goals (foundation) ---------------- */
function goalsPanel(S) {
  const l = t();
  const items = S.goals.map((g, i) => `
    <div class="card list-item row">
      <span class="item-num">${i + 1}</span>
      <div><b>${esc(g.title)}</b>${g.description ? `<div class="muted small">${esc(g.description)}</div>` : ''}</div>
    </div>`).join('');
  setPanel(`<div class="panel stack">
    ${S.isTeacher ? `<div class="card list-item">
      <div class="field"><label>${esc(l.goalTitle)}</label><input id="gt" /></div>
      <div class="field"><label>${esc(l.goalDesc)}</label><input id="gd" /></div>
      <button class="btn sm" id="addGoal">＋ ${esc(l.add)}</button>
    </div>` : ''}
    ${S.goals.length ? items : `<div class="empty">—</div>`}
  </div>`);
  if (S.isTeacher) document.getElementById('addGoal').onclick = async () => {
    const title = document.getElementById('gt').value.trim();
    if (!title) return;
    try { await addGoal({ classroomId: S.id, title, description: document.getElementById('gd').value.trim() }); toast(l.saved); }
    catch (e) { toast(l.error, true); }
  };
}

/* ---------------- tasks (★ features 8-10) ---------------- */
function tasksPanel(S) {
  const l = t();
  const rows = S.tasks.map((k) => {
    const finishers = S.completions.filter((c) => c.taskId === k.id && c.completed);
    const mineDone = finishers.some((c) => c.studentId === S.profile.id);
    const pctTask = taskProgress(k.id, S.completions, S.members.length);
    const due = k.due_date ? `${esc(l.due)}: ${esc(fmtDay(k.due_date))}` : esc(l.noDue);

    const studentActions = !S.isTeacher ? `
      <div class="row" style="margin-top:10px;gap:8px">
        <button class="btn sm ${mineDone ? 'ok' : ''}" data-done="${k.id}" data-on="${mineDone ? 1 : 0}">
          ${mineDone ? esc(l.doneState) : '✓ ' + esc(l.markDone)}
        </button>
        <button class="btn ghost sm" data-upload="${k.id}">↥ ${esc(l.upload)}</button>
      </div>` : '';

    const teacherProgress = S.isTeacher ? `
      <div style="margin-top:10px">
        <div class="spread small muted"><span>${esc(l.perTask)}</span><span>${finishers.length}/${S.members.length} · ${pctTask}%</span></div>
        <div class="bar" style="margin-top:4px"><span style="width:${pctTask}%"></span></div>
      </div>` : '';

    const faces = `<div class="faces"><span class="small muted">${esc(l.finishedBy)}</span>${
      finishers.length ? finishers.map((c) => `<span class="face">${esc(c.name)}</span>`).join('')
                       : `<span class="small muted">${esc(l.nobodyYet)}</span>`}</div>`;

    return `<div class="card list-item">
      <div class="spread"><b>${esc(k.title)}</b><span class="small muted">${due}</span></div>
      ${k.description ? `<div class="muted small" style="margin-top:2px">${esc(k.description)}</div>` : ''}
      ${teacherProgress}${studentActions}${faces}
    </div>`;
  }).join('');

  setPanel(`<div class="panel stack">
    ${S.isTeacher ? `<div class="card list-item">
      <div class="field"><label>${esc(l.taskTitle)}</label><input id="tt" /></div>
      <div class="field"><label>${esc(l.taskDesc)}</label><input id="td" /></div>
      <div class="field"><label>${esc(l.dueDate)}</label><input id="tdue" type="date" /></div>
      <button class="btn sm" id="addTask">＋ ${esc(l.add)}</button>
    </div>` : ''}
    ${S.tasks.length ? rows : `<div class="empty">—</div>`}
    <input type="file" id="fileInput" hidden />
  </div>`);

  if (S.isTeacher) document.getElementById('addTask').onclick = async () => {
    const title = document.getElementById('tt').value.trim();
    if (!title) return;
    const due = document.getElementById('tdue').value;
    try {
      await addTask({ classroomId: S.id, title, description: document.getElementById('td').value.trim(), dueDate: due ? new Date(due).toISOString() : null });
      toast(l.saved);
    } catch (e) { toast(l.error, true); }
  };

  // student: mark done / undo
  document.querySelectorAll('[data-done]').forEach((btn) => {
    btn.onclick = async () => {
      const taskId = btn.dataset.done;
      try {
        if (btn.dataset.on === '1') await unmarkDone(taskId, S.profile.id);
        else await markDone(taskId, S.profile.id);
        S.completions = await listCompletions(S.id); refreshHeader(S); renderPanel(S);
      } catch (e) { toast(l.error, true); }
    };
  });

  // student: upload against a task
  document.querySelectorAll('[data-upload]').forEach((btn) => {
    btn.onclick = () => {
      const input = document.getElementById('fileInput');
      input.onchange = async () => {
        const file = input.files[0]; input.value = '';
        if (!file) return;
        if (file.size > MAX_BYTES) return toast(l.tooBig, true);
        try {
          await uploadSubmission({ classroomId: S.id, taskId: btn.dataset.upload, studentId: S.profile.id, file });
          S.submissions = await loadSubs(S); toast(l.uploaded);
        } catch (e) { toast(e.message === 'too-big' ? l.tooBig : l.error, true); }
      };
      input.click();
    };
  });
}

/* ---------------- people (★ feature 11) ---------------- */
function peoplePanel(S) {
  const l = t();
  const rows = S.members.map((m) => {
    const p = studentProgress(m.studentId, S.completions, S.tasks.length);
    return `<div class="card list-item spread">
      <div class="row">
        <div class="avatar sm">${esc(initial(m.name))}</div>
        <div><b>${esc(m.name)}</b><div class="small muted">${esc(l.perStudent)}: ${p}% ${esc(l.ofTasks)}</div></div>
      </div>
      <div class="row" style="gap:10px">
        <div class="bar" style="width:120px"><span style="width:${p}%"></span></div>
        ${S.isTeacher ? `<button class="btn danger sm" data-remove="${m.membershipId}" data-name="${esc(m.name)}">× ${esc(l.remove)}</button>` : ''}
      </div>
    </div>`;
  }).join('');
  setPanel(`<div class="panel stack">${S.members.length ? rows : `<div class="empty">${esc(l.nobodyYet)}</div>`}</div>`);

  document.querySelectorAll('[data-remove]').forEach((btn) => {
    btn.onclick = async () => {
      const ok = await confirmDialog({ title: l.remove, message: l.confirmRemove, confirmText: l.remove });
      if (!ok) return;
      try { await removeMember(btn.dataset.remove); S.members = await listMembers(S.id); refreshHeader(S); renderPanel(S); toast(l.removed); }
      catch (e) { toast(l.error, true); }
    };
  });
}

/* ---------------- attendance (تحضير المتدرّبين — للمدرّب) ---------------- */
function attendancePanel(S) {
  const l = t();
  if (!S.attDate) S.attDate = new Date().toISOString().slice(0, 10); // اليوم افتراضيًا

  setPanel(`<div class="panel att-wrap">
    <div class="att-bar">
      <div><div style="font-weight:800;font-size:16px">${esc(l.attendance)}</div>
        <div class="small muted">${esc(l.sessionDate)}</div></div>
      <input type="date" id="attDate" value="${S.attDate}" />
    </div>
    <div class="att-stats" id="attStats"></div>
    <div id="attList" class="stack"></div>
  </div>`);

  const paint = async () => {
    let recs = [];
    try { recs = await listAttendance(S.id, S.attDate); } catch (e) { toast(l.error, true); }
    const byId = {};
    recs.forEach((r) => { byId[r.student_id] = r.present; });

    const present = S.members.filter((m) => byId[m.studentId] === true).length;
    const absent = S.members.filter((m) => byId[m.studentId] === false).length;
    const total = S.members.length;
    const rate = total ? Math.round((present / total) * 100) : 0;

    document.getElementById('attStats').innerHTML = `
      <div class="att-stat ok"><div class="n">${present}</div><div class="l">${esc(l.present)}</div></div>
      <div class="att-stat no"><div class="n">${absent}</div><div class="l">${esc(l.absent)}</div></div>
      <div class="att-stat rate"><div class="n">${rate}%</div><div class="l">${esc(l.attRate)}</div></div>`;

    const list = document.getElementById('attList');
    if (!total) { list.innerHTML = `<div class="empty">${esc(l.nobodyYet)}</div>`; return; }
    list.innerHTML = S.members.map((m) => {
      const st = byId[m.studentId];
      return `<div class="att-row">
        <div class="row"><div class="avatar sm">${esc(initial(m.name))}</div><b>${esc(m.name)}</b></div>
        <div class="seg">
          <button class="${st === true ? 'on-p' : ''}" data-att="1" data-sid="${m.studentId}">${esc(l.present)}</button>
          <button class="${st === false ? 'on-a' : ''}" data-att="0" data-sid="${m.studentId}">${esc(l.absent)}</button>
        </div>
      </div>`;
    }).join('');

    list.querySelectorAll('[data-sid]').forEach((btn) => {
      btn.onclick = async () => {
        try {
          await setAttendance({ classroomId: S.id, studentId: btn.dataset.sid, date: S.attDate, present: btn.dataset.att === '1' });
          await paint();
        } catch (e) { toast(l.error, true); }
      };
    });
  };

  document.getElementById('attDate').onchange = (e) => { S.attDate = e.target.value; paint(); };
  paint();
}

/* ---------------- files / submissions (★ feature 12) ---------------- */
function filesPanel(S) {
  const l = t();
  const rows = S.submissions.map((s) => `
    <div class="card list-item spread" data-open="${esc(s.filePath)}">
      <div class="row">
        <span class="item-num">${esc(fileExt(s.fileName))}</span>
        <div><b>${esc(s.fileName)}</b><div class="small muted">${esc(s.taskTitle)} · ${esc(s.student)} · ${esc(fmtDate(s.createdAt))}</div></div>
      </div>
      <button class="btn soft sm">↧ ${esc(l.download)}</button>
    </div>`).join('');
  setPanel(`<div class="panel stack">
    <div class="small muted">${esc(S.isTeacher ? l.allSubs : l.mySubs)}</div>
    ${S.submissions.length ? rows : `<div class="empty">${esc(l.noFiles)}</div>`}
  </div>`);

  document.querySelectorAll('[data-open]').forEach((el) => {
    el.onclick = async () => {
      try { const url = await signedUrl(el.dataset.open); window.open(url, '_blank'); }
      catch (e) { toast(l.error, true); }
    };
  });
}

/* ---------------- chat (★ feature 13) ---------------- */
function chatPanel(S) {
  const l = t();
  const bubbles = S.messages.map((m) => {
    const me = m.senderId === S.profile.id;
    const att = m.attachment ? `<a class="att" data-sub="${esc(m.attachment.submissionId)}">↥ ${esc(m.attachment.fileName)}</a>` : '';
    const body = m.text ? `<div>${esc(m.text)}</div>` : (m.attachment ? `<div class="small">${esc(l.attachedFile)}</div>` : '');
    return `<div class="msg ${me ? 'me' : ''}">
      ${me ? '' : `<div class="avatar sm">${esc(initial(m.name))}</div>`}
      <div class="bubble"><div class="who">${esc(m.name)} · ${esc(fmtDate(m.createdAt))}</div>${body}${att}</div>
    </div>`;
  }).join('');

  const taskOptions = S.tasks.map((k) => `<option value="${k.id}">${esc(k.title)}</option>`).join('');

  setPanel(`<div class="chat">
    <div class="chat-scroll" id="scroll">${S.messages.length ? bubbles : `<div class="empty">${esc(l.chatSub)}</div>`}</div>
    <div class="composer">
      ${S.tasks.length ? `<select id="attTask" title="${esc(l.tabTasks)}" style="max-width:130px">${taskOptions}</select>` : ''}
      <button class="icon-btn" id="attBtn" title="${esc(l.attach)}">↥</button>
      <textarea id="msg" rows="1" placeholder="${esc(l.typeMsg)}"></textarea>
      <button class="btn" id="sendBtn">${esc(l.send)}</button>
    </div>
    <input type="file" id="chatFile" hidden />
  </div>`);

  const scroll = document.getElementById('scroll');
  scroll.scrollTop = scroll.scrollHeight;

  // resolve attachment links to signed URLs on click
  document.querySelectorAll('[data-sub]').forEach((a) => {
    a.onclick = async () => {
      try {
        const s = S.submissions.find((x) => x.id === a.dataset.sub);
        if (!s) return toast(l.error, true);
        window.open(await signedUrl(s.filePath), '_blank');
      } catch (e) { toast(l.error, true); }
    };
  });

  const box = document.getElementById('msg');
  const send = async () => {
    const text = box.value.trim();
    if (!text) return;
    box.value = '';
    try { await sendMessage({ classroomId: S.id, senderId: S.profile.id, text }); }
    catch (e) { toast(l.error, true); }
  };
  document.getElementById('sendBtn').onclick = send;
  box.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  // attach a file: upload as a submission (shows in Files) + post a chat message
  document.getElementById('attBtn').onclick = () => {
    if (!S.tasks.length) return toast(l.tabTasks + ' …', true);
    const input = document.getElementById('chatFile');
    input.onchange = async () => {
      const file = input.files[0]; input.value = '';
      if (!file) return;
      if (file.size > MAX_BYTES) return toast(l.tooBig, true);
      const taskId = document.getElementById('attTask').value;
      try {
        const sub = await uploadSubmission({ classroomId: S.id, taskId, studentId: S.profile.id, file });
        S.submissions = await loadSubs(S);
        await sendMessage({ classroomId: S.id, senderId: S.profile.id, text: encodeAttachment(sub.id, file.name, box.value.trim()) });
        box.value = ''; toast(l.uploaded);
      } catch (e) { toast(e.message === 'too-big' ? l.tooBig : l.error, true); }
    };
    input.click();
  };
}
