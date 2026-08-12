// Hash router + auth guard (PRD §13 router.js). Entry point of the app.
import { supabase } from './supabase.js';
import { currentUser } from './auth.js';
import { applyDir, applyTheme } from './i18n.js';
import { loading } from './ui.js';
import { renderLogin } from '../views/login.js';
import { renderSignup } from '../views/signup.js';
import { renderDashboard } from '../views/dashboard.js';
import { renderClassroom } from '../views/classroom.js';

applyTheme();
applyDir();

let profile = null;

export function go(hash) { location.hash = hash; }
export function reroute() { handleRoute(); }
export function getProfile() { return profile; }

async function handleRoute() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [, path, arg] = raw.match(/^\/([^/]*)\/?(.*)$/) || [null, '', ''];

  // public routes
  if (path === 'login') return renderLogin();
  if (path === 'signup') return renderSignup();

  // guarded routes
  loading();
  profile = await currentUser();
  if (!profile) return go('#/login');

  if (path === 'classroom' && arg) return renderClassroom(arg, profile);
  return renderDashboard(profile);
}

// Restore session on load; react to sign-in/out.
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') { profile = null; go('#/login'); }
});

window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute);
handleRoute();
