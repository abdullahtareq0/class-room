// Classroom view: shell + panels. The Goals panel is foundation (friend);
// Tasks / People / Files / Chat panels + class progress are ★ your features 8-14.
import { t } from '../js/i18n.js';
import { mount, topbar, wireTopbar, toast, esc, initial, fmtDate, fmtDay } from '../js/ui.js';
import { reroute, go } from '../js/router.js';
import { getClassroom } from '../js/classrooms.js';
import { listGoals, addGoal } from '../js/goals.js';
import { listTasks, addTask, listCompletions, markDone, unmarkDone } from '../js/tasks.js';
import { listMembers, removeMember } from '../js/members.js';
import { taskProgress, studentProgress, classProgress } from '../js/progress.js';
import { uploadSubmission, listSubmissions, signedUrl, fileExt, MAX_BYTES } from '../js/submissions.js';
import { listMessages, sendMessage, encodeAttachment } from '../js/chat.js';
import { subscribeToClassroom } from '../js/realtime.js';

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
  mount(`
    ${topbar(`<button class="btn ghost sm" id="back">${esc(l.back)} ↩</button>`)}
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
  `);
  wireTopbar(reroute);
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
  const map = { goals: goalsPanel, tasks: tasksPanel, people: peoplePanel, files: filesPanel, chat: chatPanel };
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
      if (!confirm(l.confirmRemove)) return;
      try { await removeMember(btn.dataset.remove); S.members = await listMembers(S.id); refreshHeader(S); renderPanel(S); toast(l.removed); }
      catch (e) { toast(l.error, true); }
    };
  });
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
