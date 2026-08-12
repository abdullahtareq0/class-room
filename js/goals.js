// Goals: read + add (foundation — your friend's feature 7).
import { supabase } from './supabase.js';

export async function listGoals(classroomId) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('classroom_id', classroomId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function addGoal({ classroomId, title, description }) {
  const { data, error } = await supabase
    .from('goals')
    .insert({ classroom_id: classroomId, title, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}
