// ★ ميزة الإعلانات: المدرّب يرسل إعلانًا لدورته → يظهر لكل المتدرّبين مباشرة،
// والكل يشوف إعلانات كل دوراته في الشريط الجانبي (Realtime).
import { supabase } from './supabase.js';
import { t } from './i18n.js';
import { esc, fmtDate, toast } from './ui.js';

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

// Announcements across every course the user belongs to (teacher: owns; student: joined).
export async function listForUser(profile) {
  const isTeacher = profile.role === 'teacher';
  let ids = [];
  if (isTeacher) {
    const { data } = await supabase.from('classrooms').select('id').eq('teacher_id', profile.id);
    ids = (data || []).map((c) => c.id);
  } else {
    const { data } = await supabase
      .from('classroom_members')
      .select('classroom_id')
      .eq('student_id', profile.id);
    ids = (data || []).map((c) => c.classroom_id);
  }
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('announcements')
    .select('id, title, body, created_at, classroom_id, classrooms(name), profiles(full_name)')
    .in('classroom_id', ids)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    createdAt: a.created_at,
    courseName: a.classrooms?.name || '',
    sender: a.profiles?.full_name || '؟',
  }));
}

// The teacher's own courses (for the "which course" picker).
export async function myCourses(profile) {
  if (profile.role !== 'teacher') return [];
  const { data } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('teacher_id', profile.id)
    .order('created_at', { ascending: true });
  return data || [];
}

export function subscribe(cb) {
  const ch = supabase
    .channel('announcements-feed')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, cb)
    .subscribe();
  return () => supabase.removeChannel(ch);
}

// ---------- sidebar panel ----------
let _unsub = null; // only one live announcements channel at a time

// Fills #annPanel, wires the (teacher-only) add button, and subscribes to
// realtime. Safe to call from every view — it tears down the previous channel.
export async function mountAnnouncements(profile, opts = {}) {
  if (_unsub) { _unsub(); _unsub = null; }
  const host = document.getElementById('annPanel');
  if (!host) return;
  const isTeacher = profile.role === 'teacher';
  const courses = isTeacher ? await myCourses(profile) : [];

  async function render() {
    const l = t();
    let list = [];
    try { list = await listForUser(profile); } catch (_) {}
    host.innerHTML = `
      <div class="ann-head">
        <span>📣 ${esc(l.announcements)}</span>
        ${isTeacher ? `<button class="ann-add" id="annAdd" title="${esc(l.newAnnouncement)}">＋</button>` : ''}
      </div>
      <div class="ann-list">
        ${list.length
          ? list.map((a) => `
            <div class="ann-item">
              <div class="ann-course">${esc(a.courseName)}</div>
              <div class="ann-title">${esc(a.title)}</div>
              ${a.body ? `<div class="ann-body">${esc(a.body)}</div>` : ''}
              <div class="ann-time">${esc(a.sender)} · ${esc(fmtDate(a.createdAt))}</div>
            </div>`).join('')
          : `<div class="ann-empty">${esc(l.noAnnouncements)}</div>`}
      </div>`;
    const addBtn = document.getElementById('annAdd');
    if (addBtn) addBtn.onclick = () => openDialog(render);
  }

  function openDialog(afterSave) {
    const l = t();
    if (!courses.length) { toast(l.noClasses, true); return; }
    const preselect = opts.currentClassroomId || courses[0].id;
    const bd = document.createElement('div');
    bd.className = 'cdialog-backdrop show';
    bd.innerHTML = `
      <div class="cdialog" role="dialog" aria-modal="true" style="text-align:start">
        <h3>📣 ${esc(l.newAnnouncement)}</h3>
        <div class="field"><label>${esc(l.chooseCourse)}</label>
          <select id="annCourse">${courses
            .map((c) => `<option value="${c.id}" ${c.id === preselect ? 'selected' : ''}>${esc(c.name)}</option>`)
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
          classroomId,
          senderId: profile.id,
          title,
          body: document.getElementById('annB').value.trim(),
        });
        close();
        toast(l.announcementSent);
        afterSave();
      } catch (_) {
        toast(l.error, true);
      }
    };
  }

  await render();
  _unsub = subscribe(() => render());
}
