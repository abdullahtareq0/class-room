// ★ YOUR FEATURE (13): classroom chat — history, send, and file attachments
// that also surface in the submissions list.
import { supabase } from './supabase.js';

const ATT = '[[att]]'; // marks a message that carries a file attachment

// Encode/decode attachment messages inside the plain `message` text column,
// so no schema change is needed and the file shows in both chat and files.
export function encodeAttachment(submissionId, fileName, note = '') {
  return `${ATT}${submissionId}|${fileName}|${note}`;
}
export function parseMessage(text) {
  if (!text.startsWith(ATT)) return { text };
  const [submissionId, fileName, ...rest] = text.slice(ATT.length).split('|');
  return { attachment: { submissionId, fileName }, text: rest.join('|') };
}

export async function listMessages(classroomId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, message, created_at, profiles(full_name)')
    .eq('classroom_id', classroomId)
    .order('created_at', { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data || []).map(shape);
}

export async function sendMessage({ classroomId, senderId, text }) {
  const { data, error } = await supabase
    .from('messages')
    .insert({ classroom_id: classroomId, sender_id: senderId, message: text })
    .select('id, sender_id, message, created_at, profiles(full_name)')
    .single();
  if (error) throw error;
  return shape(data);
}

// Fetch a single message by id (used when a realtime INSERT arrives without the
// joined sender name).
export async function getMessage(id) {
  const { data } = await supabase
    .from('messages')
    .select('id, sender_id, message, created_at, profiles(full_name)')
    .eq('id', id)
    .single();
  return data ? shape(data) : null;
}

function shape(r) {
  return {
    id: r.id,
    senderId: r.sender_id,
    name: r.profiles?.full_name || '؟',
    createdAt: r.created_at,
    ...parseMessage(r.message),
  };
}
