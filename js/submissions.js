// ★ YOUR FEATURE (12): student file upload + submissions list.
// Teacher sees every file; a student sees only their own (PRD §9).
import { supabase } from './supabase.js';

const BUCKET = 'student-submissions';
export const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

function safeName(name) {
  return name.replace(/[^\w.\-]+/g, '_').slice(-80);
}

// Upload bytes then record metadata. If the metadata insert fails, delete the
// object so Storage and the DB never drift apart (PRD §9).
export async function uploadSubmission({ classroomId, taskId, studentId, file }) {
  if (file.size > MAX_BYTES) throw new Error('too-big');
  const path = `${classroomId}/${taskId}/${studentId}/${Date.now()}-${safeName(file.name)}`;

  const up = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (up.error) throw up.error;

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      task_id: taskId,
      student_id: studentId,
      file_name: file.name,
      file_path: path,
      file_type: file.type || null,
    })
    .select('*')
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([path]); // no orphan object
    throw error;
  }
  return data;
}

// All submissions for the classroom's tasks. When forStudentId is passed, only
// that student's rows are returned (the student view).
export async function listSubmissions(classroomId, forStudentId = null) {
  let q = supabase
    .from('submissions')
    .select('id, task_id, student_id, file_name, file_path, file_type, created_at, profiles(full_name), tasks!inner(classroom_id, title)')
    .eq('tasks.classroom_id', classroomId)
    .order('created_at', { ascending: false });
  if (forStudentId) q = q.eq('student_id', forStudentId);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    taskId: r.task_id,
    studentId: r.student_id,
    fileName: r.file_name,
    filePath: r.file_path,
    fileType: r.file_type,
    createdAt: r.created_at,
    student: r.profiles?.full_name || '؟',
    taskTitle: r.tasks?.title || '',
  }));
}

// Short-lived link generated at render time — never stored (PRD §9).
export async function signedUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

export function fileExt(name) {
  const m = String(name).match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toUpperCase() : 'FILE';
}
