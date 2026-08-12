// ★ YOUR FEATURE (8-9): tasks with due date + completions ("finished by").
import { supabase } from './supabase.js';

export async function listTasks(classroomId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('classroom_id', classroomId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addTask({ classroomId, title, description, dueDate }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      classroom_id: classroomId,
      title,
      description: description || null,
      due_date: dueDate || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Every completion for the classroom's tasks, with the student's name so the
// UI can show "finished by …" to everyone (feature 9).
export async function listCompletions(classroomId) {
  const { data, error } = await supabase
    .from('task_completions')
    .select('id, task_id, student_id, completed, completed_at, profiles(full_name), tasks!inner(classroom_id)')
    .eq('tasks.classroom_id', classroomId);
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id,
    taskId: r.task_id,
    studentId: r.student_id,
    completed: r.completed,
    name: r.profiles?.full_name || '؟',
  }));
}

// Idempotent: a second click updates the existing row (unique task_id+student_id).
export async function markDone(taskId, studentId) {
  const { error } = await supabase
    .from('task_completions')
    .upsert(
      { task_id: taskId, student_id: studentId, completed: true, completed_at: new Date().toISOString() },
      { onConflict: 'task_id,student_id' },
    );
  if (error) throw error;
}

export async function unmarkDone(taskId, studentId) {
  const { error } = await supabase
    .from('task_completions')
    .delete()
    .eq('task_id', taskId)
    .eq('student_id', studentId);
  if (error) throw error;
}
