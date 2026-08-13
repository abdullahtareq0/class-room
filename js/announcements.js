// ★ ميزة الإعلانات: المدرّب يرسل إعلانًا لدورته → يظهر لكل المتدرّبين مباشرة.
// تُعرض في صفحة مستقلة (#/announcements)، ويوصل لها الطالب عبر زر الجرس 🔔.
import { supabase } from './supabase.js';
import { t, getLang, getTheme, toggleTheme, toggleLang } from './i18n.js';
import { esc, fmtDate, toast, mount, initial } from './ui.js';
import { go, reroute } from './router.js';
import { signOut } from './auth.js';

const LOGO = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/><path d="M22 10v5"/></svg>`;
const I_HOME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/></svg>`;
export const I_MEGA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`;
export const I_BELL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`;

// ---------- data ----------
export async function createAnnouncement({ classroomId, senderId, title, body }) {
  const { data, error } = await supabase
    .from('announcements')
    .insert({ classroom_id: classroomId, sender_id: senderId, title, body: body || null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Announcements across every course the user belongs to (teacher owns / student joined).
export async function listForUser(profile) {
  const isTeacher = profile.role === 'teacher';
  let ids = [];
  if (isTeacher) {
    const { data } = await supabase.from('classrooms').select('id').eq('teacher_id', profile.id);
    ids = (data || []).map((c) => c.id);
  } else {
    const { data } = await supabase
      .from('classroom_members').select('classroom_id').eq('student_id', profile.id);
    ids = (data || []).map((c) => c.classroom_id);
  }
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, created_at, classroom_id, classrooms(name), profiles(full_name)')
    .in('classroom_id', ids)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map((a) => ({
    id: a.id, title: a.title, body: a.body, createdAt: a.created_at,
    courseName: a.classrooms?.name || '', sender: a.profiles?.full_name || '؟',
  }));
}

export async function countForUser(profile) {
  try { return (await listForUser(profile)).length; } catch (_) { return 0; }
}

export async function myCourses(profile) {
  if (profile.role !== 'teacher') return [];
  const { data } = await supabase
    .from('classrooms').select('id, name').eq('teacher_id', profile.id).order('created_at');
  return data || [];
}

export function subscribe(cb) {
  const ch = supabase
    .channel('announcements-feed')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, cb)
    .subscribe();
  return () => supabase.removeChannel(ch);
}

// ---------- notification bell (dropdown of latest announcements) ----------
// Shows the latest few announcements; clicking any (or "view all") opens the
// full announcements page where the complete details are shown.
// unread tracking (per user, in localStorage) — reading an announcement clears it
function readKey(uid) { return 'ann_read_' + uid; }
function getRead(uid) {
  try { return new Set(JSON.parse(localStorage.getItem(readKey(uid)) || '[]')); }
  catch (_) { return new Set(); }
}
export function markRead(uid, id) {
  const s = getRead(uid);
  if (!s.has(id)) { s.add(id); localStorage.setItem(readKey(uid), JSON.stringify([...s])); }
}
export async function unreadCount(profile) {
  try {
    const list = await listForUser(profile);
    const read = getRead(profile.id);
    return list.filter((a) => !read.has(a.id)).length;
  } catch (_) { return 0; }
}

// Shared bell button markup (students only) — used on every student view so the
// icon stays consistent everywhere.
export function bellHtml(profile) {
  if (profile.role === 'teacher') return '';
  const l = t();
  return `<button class="icon-btn bell" id="bellBtn" title="${esc(l.announcements)}">${I_BELL}<span class="bell-dot" id="bellDot" hidden></span></button>`;
}

// A plain red dot (no number): visible when there is any unread announcement.
function setDot(show) {
  const d = document.getElementById('bellDot');
  if (d) d.hidden = !show;
}
function refreshDot(profile) {
  unreadCount(profile).then((n) => setDot(n > 0));
}

// badge:false is passed on the announcements page itself (which clears the dot
// on its own), so the shared wireBell doesn't re-show it.
export function wireBell(profile, { badge = true } = {}) {
  const bell = document.getElementById('bellBtn');
  if (!bell) return;

  if (badge) refreshDot(profile);

  let drop = null;
  const close = () => {
    if (!drop) return;
    drop.remove(); drop = null;
    document.removeEventListener('click', onDoc, true);
  };
  const onDoc = (e) => {
    if (drop && !drop.contains(e.target) && !bell.contains(e.target)) close();
  };

  bell.onclick = (e) => {
    e.stopPropagation();
    if (drop) { close(); return; }
    const l = t();
    // open instantly with a loading state, then fill (never block on the network)
    drop = document.createElement('div');
    drop.className = 'bell-drop';
    drop.innerHTML = `
      <div class="bell-drop-head">📣 ${esc(l.latestAnnouncements)}</div>
      <div class="bell-drop-list" id="bellList">
        <div class="empty" style="padding:26px"><div class="spin"></div></div>
      </div>`;
    document.body.appendChild(drop);

    // position under the bell
    const r = bell.getBoundingClientRect();
    drop.style.top = `${r.bottom + 8}px`;
    drop.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - 328))}px`;
    setTimeout(() => document.addEventListener('click', onDoc, true), 0);

    listForUser(profile).then((list) => {
      const host = drop && drop.querySelector('#bellList');
      if (!host) return;
      const top = list.slice(0, 6);
      const read = getRead(profile.id);
      host.innerHTML = top.length
        ? top.map((a) => `
          <button class="bell-item ${read.has(a.id) ? '' : 'unread'}" data-id="${esc(a.id)}">
            <span class="ann-course">${esc(a.courseName)}</span>
            <div class="bell-item-title">${esc(a.title)}</div>
            ${a.body ? `<div class="bell-item-body">${esc(a.body)}</div>` : ''}
            <div class="ann-time">${esc(fmtDate(a.createdAt))}</div>
          </button>`).join('')
        : `<div class="empty" style="padding:26px 12px">${esc(l.noAnnouncements)}</div>`;
      host.querySelectorAll('.bell-item').forEach((el) => {
        el.onclick = () => {
          markRead(profile.id, el.dataset.id);
          refreshDot(profile);
          close();
          go('#/announcements');
        };
      });
    }).catch(() => {
      const host = drop && drop.querySelector('#bellList');
      if (host) host.innerHTML = `<div class="empty" style="padding:26px 12px">${esc(l.error)}</div>`;
    });
  };
}

// ---------- create dialog (reused) ----------
export function openAnnouncementDialog(profile, courses, { preselect, afterSave } = {}) {
  const l = t();
  if (!courses.length) { toast(l.noClasses, true); return; }
  const sel = preselect || courses[0].id;
  const bd = document.createElement('div');
  bd.className = 'cdialog-backdrop show';
  bd.innerHTML = `
    <div class="cdialog" role="dialog" aria-modal="true" style="text-align:start">
      <h3>📣 ${esc(l.newAnnouncement)}</h3>
      <div class="field"><label>${esc(l.chooseCourse)}</label>
        <select id="annCourse">${courses
          .map((c) => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`)
          .join('')}</select></div>
      <div class="field"><label>${esc(l.annTitle)}</label><input id="annT" autocomplete="off" /></div>
      <div class="field"><label>${esc(l.annBody)}</label><textarea id="annB" rows="3"></textarea></div>
      <div class="cdialog-acts">
        <button class="btn" id="annSend">${esc(l.sendAnnouncement)}</button>
        <button class="btn ghost" id="annCancel">${esc(l.cancel)}</button>
      </div>
    </div>`;
  document.body.appendChild(bd);
  const close = () => bd.remove();
  bd.onclick = (e) => { if (e.target === bd) close(); };
  document.getElementById('annCancel').onclick = close;
  document.getElementById('annT').focus();
  document.getElementById('annSend').onclick = async () => {
    const classroomId = document.getElementById('annCourse').value;
    const title = document.getElementById('annT').value.trim();
    if (!classroomId || !title) return;
    try {
      await createAnnouncement({
        classroomId, senderId: profile.id, title,
        body: document.getElementById('annB').value.trim(),
      });
      close(); toast(l.announcementSent); afterSave && afterSave();
    } catch (_) { toast(l.error, true); }
  };
}

// ---------- full page (#/announcements) ----------
let _unsub = null;

export async function renderAnnouncementsPage(profile) {
  if (_unsub) { _unsub(); _unsub = null; }
  const l = t();
  const isTeacher = profile.role === 'teacher';
  const courses = isTeacher ? await myCourses(profile) : [];

  mount(`
  <div class="dash">
    <aside class="dside">
      <div class="brand"><span class="logo">${LOGO}</span>${esc(l.brand)}</div>
      <nav class="dnav">
        <button data-nav="home">${I_HOME} ${esc(l.teacherDash)}</button>
        <button class="on" data-nav="ann">${I_MEGA} ${esc(l.announcements)}</button>
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
        <button class="btn ghost sm" id="back">${esc(l.back)} ↩</button>
        <div class="sp"></div>
        ${bellHtml(profile)}
        <button class="icon-btn" id="langBtn" title="Language">${getLang() === 'ar' ? 'EN' : 'ع'}</button>
        <button class="icon-btn" id="themeBtn" title="Theme">${getTheme() === 'light' ? '🌙' : '☀️'}</button>
      </div>
      <div class="spread" style="margin:6px 4px 16px">
        <h2 style="font-size:22px">📣 ${esc(l.announcements)}</h2>
        ${isTeacher ? `<button class="btn sm" id="annNew">＋ ${esc(l.newAnnouncement)}</button>` : ''}
      </div>
      <div id="annCards" class="ann-cards"></div>
    </main>
  </div>`);

  document.getElementById('out').onclick = async () => { await signOut(); };
  document.getElementById('back').onclick = () => go('#/dashboard');
  document.getElementById('themeBtn').onclick = () => { toggleTheme(); reroute(); };
  document.getElementById('langBtn').onclick = () => { toggleLang(); reroute(); };
  document.querySelector('[data-nav="home"]').onclick = () => go('#/dashboard');
  wireBell(profile, { badge: false });
  const newBtn = document.getElementById('annNew');
  if (newBtn) newBtn.onclick = () => openAnnouncementDialog(profile, courses, { afterSave: renderList });

  async function renderList() {
    const host = document.getElementById('annCards');
    if (!host) return;
    let list = [];
    try { list = await listForUser(profile); } catch (_) {}
    // being on this page means the user is seeing every announcement → mark them
    // all read so the notification dot clears everywhere.
    list.forEach((a) => markRead(profile.id, a.id));
    setDot(false);
    host.innerHTML = list.length
      ? list.map((a) => `
        <div class="ann-card">
          <div class="ann-card-top">
            <span class="ann-course">${esc(a.courseName)}</span>
            <span class="ann-time">${esc(a.sender)} · ${esc(fmtDate(a.createdAt))}</span>
          </div>
          <div class="ann-card-title">${esc(a.title)}</div>
          ${a.body ? `<div class="ann-card-body">${esc(a.body)}</div>` : ''}
        </div>`).join('')
      : `<div class="empty">${esc(l.noAnnouncements)}</div>`;
  }

  await renderList();
  _unsub = subscribe(() => renderList());
  window.addEventListener('hashchange', () => { if (_unsub) { _unsub(); _unsub = null; } }, { once: true });
}
