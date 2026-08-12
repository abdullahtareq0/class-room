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
    <div class="brand"><span class="logo">C</span>${esc(l.brand)}</div>
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
