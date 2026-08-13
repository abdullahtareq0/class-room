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

// إحصائيات حضور متدرّب في دورة: أيام حضرها، إجمالي الجلسات، والنسبة.
export async function studentAttendanceStats(classroomId, studentId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('session_date, student_id, present')
    .eq('classroom_id', classroomId);
  if (error) throw error;
  const rows = data || [];
  const sessions = new Set(rows.map((r) => r.session_date));   // كل جلسة سُجّل فيها حضور
  const attended = rows.filter((r) => r.student_id === studentId && r.present).length;
  const total = sessions.size;
  const rate = total ? Math.round((attended / total) * 100) : 0;
  return { attended, totalSessions: total, rate, absent: total - attended, absenceRate: total ? 100 - rate : 0 };
}

// سجلّ حضور متدرّب واحد عبر كل الجلسات (للعرض في حساب المتدرّب).
export async function studentAttendanceList(classroomId, studentId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('session_date, present')
    .eq('classroom_id', classroomId)
    .eq('student_id', studentId)
    .order('session_date', { ascending: false });
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
