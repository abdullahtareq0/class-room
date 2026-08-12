// ★ YOUR FEATURE (13, shared): one Realtime channel per classroom (PRD §10).
// Keep the returned unsubscribe function and call it when leaving the view,
// otherwise leaked channels duplicate messages in the UI.
import { supabase } from './supabase.js';

export function subscribeToClassroom(classroomId, handlers) {
  const channel = supabase.channel('classroom:' + classroomId);

  const onScoped = (table, cb) =>
    channel.on('postgres_changes',
      { event: '*', schema: 'public', table, filter: 'classroom_id=eq.' + classroomId },
      (payload) => cb && cb(payload));

  onScoped('messages', handlers.onMessage);
  onScoped('goals', handlers.onGoal);
  onScoped('tasks', handlers.onTask);
  onScoped('classroom_members', handlers.onMember);

  // task_completions and submissions have no classroom_id column, so the client
  // filters incoming rows against task ids already loaded for the open class.
  channel.on('postgres_changes',
    { event: '*', schema: 'public', table: 'task_completions' },
    (payload) => handlers.onCompletion && handlers.onCompletion(payload));
  channel.on('postgres_changes',
    { event: '*', schema: 'public', table: 'submissions' },
    (payload) => handlers.onSubmission && handlers.onSubmission(payload));

  channel.subscribe();
  return () => supabase.removeChannel(channel);
}
