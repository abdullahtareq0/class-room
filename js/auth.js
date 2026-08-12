// Sign up / in / out, current session + profile (PRD §13 auth.js).
import { supabase } from './supabase.js';

export async function signUp({ email, password, fullName, role }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim(), role } },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// The profile row (id, full_name, role, avatar_url) for the current session.
export async function currentUser() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, avatar_url')
    .eq('id', data.session.user.id)
    .single();
  return profile;
}
