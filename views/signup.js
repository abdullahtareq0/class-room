// Signup view with role choice (foundation — friend's features 1-2).
import { signUp, signIn } from '../js/auth.js';
import { t } from '../js/i18n.js';
import { mount, topbar, wireTopbar, toast, esc } from '../js/ui.js';
import { reroute, go } from '../js/router.js';

export function renderSignup() {
  const l = t();
  let role = 'teacher';

  mount(`
    ${topbar()}
    <div class="auth-wrap">
      <div class="card auth-card">
        <h1>${esc(l.signUpTitle)}</h1>
        <p class="muted" style="margin-bottom:18px">${esc(l.signUpSub)}</p>
        <form id="f">
          <div class="field"><label>${esc(l.fullName)}</label><input id="name" required placeholder="${esc(l.fullName)}" /></div>
          <div class="field"><label>${esc(l.email)}</label><input id="email" type="email" required placeholder="you@example.com" /></div>
          <div class="field"><label>${esc(l.password)}</label><input id="password" type="password" required minlength="6" /></div>
          <label class="small" style="font-weight:600;color:var(--muted)">${esc(l.chooseRole)}</label>
          <div class="role-grid" id="roles">
            <div class="role-opt active" data-role="teacher">
              <div class="emoji">🧑‍🏫</div><div class="t">${esc(l.teacher)}</div><div class="h">${esc(l.teacherHint)}</div>
            </div>
            <div class="role-opt" data-role="student">
              <div class="emoji">🧑‍🎓</div><div class="t">${esc(l.student)}</div><div class="h">${esc(l.studentHint)}</div>
            </div>
          </div>
          <button class="btn block" id="submit" type="submit">${esc(l.signUpBtn)}</button>
        </form>
        <div class="divider"></div>
        <a href="#/login">${esc(l.haveAccount)}</a>
      </div>
    </div>
  `);
  wireTopbar(reroute);

  document.querySelectorAll('.role-opt').forEach((el) => {
    el.onclick = () => {
      document.querySelectorAll('.role-opt').forEach((x) => x.classList.remove('active'));
      el.classList.add('active');
      role = el.dataset.role;
    };
  });

  document.getElementById('f').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submit');
    btn.disabled = true;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const res = await signUp({ email, password, fullName: document.getElementById('name').value, role });
      if (!res.session) {
        // email confirmation is on; try an immediate sign-in for dev convenience
        try { await signIn({ email, password }); } catch (_) {
          toast('تم إنشاء الحساب — فعّله من بريدك أو عطّل تأكيد البريد في Supabase', true);
          btn.disabled = false; return;
        }
      }
      go('#/dashboard');
    } catch (err) {
      toast(err.message || l.error, true);
      btn.disabled = false;
    }
  };
}
