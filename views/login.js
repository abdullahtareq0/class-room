// Login view (foundation — friend's features 1-2). Kept minimal to run/test.
import { signIn } from '../js/auth.js';
import { t } from '../js/i18n.js';
import { mount, topbar, wireTopbar, toast, esc } from '../js/ui.js';
import { reroute, go } from '../js/router.js';

export function renderLogin() {
  const l = t();
  mount(`
    ${topbar()}
    <div class="auth-wrap">
      <div class="card auth-card">
        <h1>${esc(l.signInTitle)}</h1>
        <p class="muted" style="margin-bottom:18px">${esc(l.signInSub)}</p>
        <form id="f">
          <div class="field"><label>${esc(l.email)}</label><input id="email" type="email" required placeholder="teacher@example.com" /></div>
          <div class="field"><label>${esc(l.password)}</label><input id="password" type="password" required /></div>
          <button class="btn block" id="submit" type="submit">${esc(l.signInBtn)}</button>
        </form>
        <div class="divider"></div>
        <a href="#/signup">${esc(l.noAccount)}</a>
      </div>
    </div>
  `);
  wireTopbar(reroute);

  document.getElementById('f').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit');
    btn.disabled = true;
    try {
      await signIn({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
      });
      go('#/dashboard');
    } catch (err) {
      toast(err.message || l.error, true);
      btn.disabled = false;
    }
  };
}
