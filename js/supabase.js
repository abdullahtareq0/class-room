// Creates and exports the single Supabase client (PRD §13).
// The anon key is a public client key; RLS (phase 8) protects the data.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://gzkdzevihrnuimgopovg.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6a2R6ZXZpaHJudWltZ29wb3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MjA0NjgsImV4cCI6MjEwMjA5NjQ2OH0.zQBHC4T3GOEc75APIcbr776lgj4ZewmNajw_Ww8bBNk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
