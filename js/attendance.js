// Attendance (تحضير المتدرّبين): read + set present/absent per session date.
import { supabase } from './supabase.js';

// Attendance records for one classroom on a given date (YYYY-MM-DD).
export async function listAttendance(classroomId, date) {
  const { data, error } = await supabase
    .from('attendance')
    .select('student_id, present')
    .eq('classroom_id', classroomId)
    .eq('session_date', date);
  if (error) throw error;
  return data || [];
}

// Mark a trainee present/absent for a date (upsert on the unique key).
export async function setAttendance({ classroomId, studentId, date, present }) {
  const { error } = await supabase
    .from('attendance')
    .upsert(
      { classroom_id: classroomId, student_id: studentId, session_date: date, present },
      { onConflict: 'classroom_id,student_id,session_date' },
    );
  if (error) throw error;
}
