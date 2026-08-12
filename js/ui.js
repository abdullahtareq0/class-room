// Rendering helpers: escaping, dates, toasts, small builders (PRD §13 ui.js).
import { t, getLang, toggleLang, toggleTheme, getTheme } from './i18n.js';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function initial(name) {
  const s = String(name || '؟').trim();
  return s ? s[0].toUpperCase() : '؟';
}

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const locale = getLang() === 'ar' ? 'ar-SA' : 'en-US';
  return d.toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function fmtDay(iso) {
  if (!iso) return '';
  const locale = getLang() === 'ar' ? 'ar-SA' : 'en-US';
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

let toastTimer;
export function toast(msg, isError = false) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show' + (isError ? ' err' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = 'toast'), 2600);
}

export function mount(html) {
  document.getElementById('app').innerHTML = html;
}

export function loading() {
  mount('<div class="center-load"><div class="spin"></div></div>');
}

// Shared top bar with brand + language/theme toggles + optional right slot.
export function topbar(rightHtml = '') {
  const l = t();
  return `
  <div class="topbar">
    <div class="brand"><span class="logo"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5"/><path d="M22 10v5"/></svg></span>${esc(l.brand)}</div>
    <div class="tools">
      <button class="icon-btn" id="langBtn" title="Language">${getLang() === 'ar' ? 'EN' : 'ع'}</button>
      <button class="icon-btn" id="themeBtn" title="Theme">${getTheme() === 'light' ? '🌙' : '☀️'}</button>
      ${rightHtml}
    </div>
  </div>`;
}

// Wire the global toggles that appear in the top bar.
export function wireTopbar(onChange) {
  const lang = document.getElementById('langBtn');
  const theme = document.getElementById('themeBtn');
  if (lang) lang.onclick = () => { toggleLang(); onChange(); };
  if (theme) theme.onclick = () => { toggleTheme(); onChange(); };
}

// Elegant confirm dialog (يعوّض confirm() المتصفح). يُرجع Promise<boolean>.
const ICON_TRASH = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
const ICON_ASK = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>`;

export function confirmDialog({ title, message, confirmText, cancelText, danger = true } = {}) {
  const l = t();
  return new Promise((resolve) => {
    const bd = document.createElement('div');
    bd.className = 'cdialog-backdrop';
    bd.innerHTML = `
      <div class="cdialog" role="dialog" aria-modal="true">
        <div class="cdialog-ic ${danger ? 'danger' : ''}">${danger ? ICON_TRASH : ICON_ASK}</div>
        <h3>${esc(title || '')}</h3>
        <p>${esc(message || '')}</p>
        <div class="cdialog-acts">
          <button class="btn ${danger ? 'danger' : ''}" data-yes>${esc(confirmText || l.confirm)}</button>
          <button class="btn ghost" data-no>${esc(cancelText || l.cancel)}</button>
        </div>
      </div>`;
    document.body.appendChild(bd);
    requestAnimationFrame(() => bd.classList.add('show'));

    const done = (val) => {
      bd.classList.remove('show');
      setTimeout(() => bd.remove(), 260);
      document.removeEventListener('keydown', onKey);
      resolve(val);
    };
    const onKey = (e) => { if (e.key === 'Escape') done(false); };
    document.addEventListener('keydown', onKey);
    bd.querySelector('[data-yes]').onclick = () => done(true);
    bd.querySelector('[data-no]').onclick = () => done(false);
    bd.onclick = (e) => { if (e.target === bd) done(false); };
    bd.querySelector('[data-yes]').focus();
  });
}
