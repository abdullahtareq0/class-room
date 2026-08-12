// ★ YOUR FEATURE (11): classroom members + remove a student (teacher only).
import { supabase } from './supabase.js';

export async function listMembers(classroomId) {
  const { data, error } = await supabase
    .from('classroom_members')
    .select('id, student_id, joined_at, profiles(id, full_name, avatar_url)')
    .eq('classroom_id', classroomId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => ({
    membershipId: r.id,
    studentId: r.student_id,
    name: r.profiles?.full_name || '؟',
    avatarUrl: r.profiles?.avatar_url || null,
  }));
}

export async function removeMember(membershipId) {
  const { error } = await supabase.from('classroom_members').delete().eq('id', membershipId);
  if (error) throw error;
}
