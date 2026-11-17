// 共用 UI 小工具：元素建立、Toast、對話框、飄字、提示音
import * as store from './store.js';

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) { if (kid == null || kid === false) continue; el.append(kid.nodeType ? kid : document.createTextNode(kid)); }
  return el;
}
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const reducedMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 音效 / 震動 ----------
let actx = null;
export function beep(kind = 'step') {
  const s = store.getState();
  if (s && s.settings.sound === false) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const seq = kind === 'done' ? [[659, 0], [784, .14], [988, .28]] : kind === 'level' ? [[523, 0], [659, .12], [784, .24], [1047, .36]] : [[740, 0]];
    for (const [f, t] of seq) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      const t0 = actx.currentTime + t;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.16, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      o.connect(g).connect(actx.destination);
      o.start(t0); o.stop(t0 + 0.3);
    }
  } catch (e) { /* 無音效支援 */ }
}
export function vibrate(p) { try { if (navigator.vibrate && store.getState().settings.sound !== false) navigator.vibrate(p); } catch (e) { /* noop */ } }

// ---------- Toast ----------
let toastTimer = null;
export function toast(msg, { action, ms = 3000 } = {}) {
  let host = $('#toast');
  if (!host) { host = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(host); }
  clearTimeout(toastTimer);
  host.innerHTML = '';
  const box = h('div', { class: 'toast-box' }, h('span', { text: msg }));
  if (action) box.append(h('button', { class: 'toast-act', text: action.label, onclick: () => { clearTimeout(toastTimer); host.classList.remove('show'); action.fn(); } }));
  host.append(box);
  requestAnimationFrame(() => host.classList.add('show'));
  toastTimer = setTimeout(() => host.classList.remove('show'), ms);
}

// ---------- 對話框 ----------
export function modal({ title, body, actions = [{ label: '好', primary: true, value: true }], cancelValue = null, className = '' }) {
  return new Promise((resolve) => {
    const prev = document.activeElement;
    const done = (v) => { back.remove(); document.removeEventListener('keydown', onKey); if (prev && prev.focus) try { prev.focus(); } catch (e) { /* */ } resolve(v); };
    const btns = actions.map((a) => h('button', { class: 'btn ' + (a.primary ? 'btn-primary' : a.danger ? 'btn-danger' : 'btn-ghost'), text: a.label, onclick: () => done(typeof a.value === 'function' ? a.value() : a.value) }));
    const dlg = h('div', { class: 'modal ' + className, role: 'dialog', 'aria-modal': 'true' },
      title ? h('h3', { text: title }) : null,
      h('div', { class: 'modal-body' }, body),
      h('div', { class: 'modal-actions' }, btns));
    const back = h('div', { class: 'modal-back', onclick: (e) => { if (e.target === back) done(cancelValue); } }, dlg);
    const onKey = (e) => { if (e.key === 'Escape') done(cancelValue); };
    document.addEventListener('keydown', onKey);
    document.body.append(back);
    const first = $('input', dlg) || btns[btns.length - 1];
    setTimeout(() => first && first.focus(), 30);
  });
}
export const confirmDialog = (message, okLabel = '確定', { danger = false, title } = {}) =>
  modal({ title, body: h('p', { text: message }), cancelValue: false, actions: [{ label: '取消', value: false }, { label: okLabel, primary: !danger, danger, value: true }] });
export const alertDialog = (message, title) => modal({ title, body: h('p', { text: message }), actions: [{ label: '好', primary: true, value: true }] });

export function promptName({ title, message, value, rerollFn }) {
  const input = h('input', { class: 'text-input', type: 'text', maxlength: '12', value, 'aria-label': '名字' });
  const row = h('div', { class: 'name-row' }, input);
  if (rerollFn) row.append(h('button', { class: 'btn btn-ghost dice', type: 'button', 'aria-label': '換一個名字', text: '🎲', onclick: () => { input.value = rerollFn(); } }));
  return modal({
    title, body: h('div', null, message ? h('p', { text: message }) : null, row), cancelValue: null,
    actions: [{ label: '確定', primary: true, value: () => (input.value || '').trim() || value }],
  });
}

// ---------- 飄字 ----------
export function floatText(text, anchor, cls = '') {
  const r = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: innerWidth / 2 - 20, top: innerHeight / 2, width: 40, height: 0 };
  const el = h('div', { class: 'float-xp ' + cls, text });
  el.style.left = Math.round(r.left + r.width / 2) + 'px';
  el.style.top = Math.round(r.top + Math.min(r.height / 2, 30)) + 'px';
  document.body.append(el);
  setTimeout(() => el.remove(), 1400);
}

// ---------- 慶祝 ----------
export function confetti(host) {
  if (reducedMotion()) return;
  const cols = ['#ffb347', '#ff6f91', '#6fcf97', '#56ccf2', '#bb6bd9', '#f2c94c'];
  for (let i = 0; i < 36; i++) {
    const s = h('i', { class: 'confetti' });
    s.style.left = Math.random() * 100 + '%';
    s.style.background = cols[i % cols.length];
    s.style.animationDelay = (Math.random() * 0.8).toFixed(2) + 's';
    s.style.animationDuration = (1.8 + Math.random() * 1.6).toFixed(2) + 's';
    s.style.transform = `rotate(${Math.random() * 360}deg)`;
    host.append(s);
  }
}
export function celebrate({ title, subtitle, node, button = '太棒了！', sound = 'level' }) {
  return new Promise((resolve) => {
    const back = h('div', { class: 'celebrate', role: 'dialog', 'aria-modal': 'true' },
      h('div', { class: 'celebrate-card' }, h('div', { class: 'celebrate-stage' }, node), h('h2', { text: title }), h('p', { text: subtitle }),
        h('button', { class: 'btn btn-primary', text: button, onclick: () => { back.remove(); resolve(); } })));
    confetti(back);
    document.body.append(back);
    beep(sound); vibrate([60, 40, 60]);
    setTimeout(() => $('button', back)?.focus(), 50);
  });
}
