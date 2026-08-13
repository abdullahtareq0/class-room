// Classroom create / list / fetch / join.
// NOTE (foundation — your friend's features 5-6): in production, code generation
// and join validation move to Edge Functions (PRD §11). During dev (RLS off)
// these direct queries are enough to run and test.
import { supabase } from './supabase.js';

function randomCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export async function createClassroom({ name, description, teacherId, endDate }) {
  // retry until the random code is unique
  for (let i = 0; i < 6; i++) {
    const code = randomCode();
    const { data, error } = await supabase
      .from('classrooms')
      .insert({ name, description, teacher_id: teacherId, classroom_code: code, end_date: endDate || null })
      .select()
      .single();
    if (!error) return data;
    if (error.code !== '23505') throw error; // not a unique-violation → real error
  }
  throw new Error('could not generate a unique code');
}

export async function listForTeacher(teacherId) {
  const { data, error } = await supabase
    .from('classrooms')
    .select('*, classroom_members(count), tasks(count)')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function listForStudent(studentId) {
  const { data, error } = await supabase
    .from('classroom_members')
    .select('classroom:classrooms(*, classroom_members(count), tasks(count))')
    .eq('student_id', studentId);
  if (error) throw error;
  return (data || []).map((r) => r.classroom).filter(Boolean);
}

export async function getClassroom(id) {
  const { data, error } = await supabase.from('classrooms').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

// Delete a classroom the teacher owns (cascades to members/goals/tasks/… via FKs).
export async function deleteClassroom(id) {
  const { error } = await supabase.from('classrooms').delete().eq('id', id);
  if (error) throw error;
}

// Returns 'joined' | 'already' | 'invalid'
export async function joinByCode(code, studentId) {
  const { data: room } = await supabase
    .from('classrooms')
    .select('id')
    .eq('classroom_code', code.trim().toUpperCase())
    .maybeSingle();
  if (!room) return 'invalid';

  const { data: existing } = await supabase
    .from('classroom_members')
    .select('id')
    .eq('classroom_id', room.id)
    .eq('student_id', studentId)
    .maybeSingle();
  if (existing) return 'already';

  const { error } = await supabase
    .from('classroom_members')
    .insert({ classroom_id: room.id, student_id: studentId });
  if (error) return error.code === '23505' ? 'already' : 'invalid';
  return 'joined';
}

// True when the current student belongs to the classroom (used by the guard).
export async function isMember(classroomId, studentId) {
  const { data } = await supabase
    .from('classroom_members')
    .select('id')
    .eq('classroom_id', classroomId)
    .eq('student_id', studentId)
    .maybeSingle();
  return !!data;
}
