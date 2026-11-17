// 引導式計時器：全螢幕逐步指示 + 倒數環 + 提示音/震動
import { h, beep, vibrate } from './ui.js';

export function normalizeSteps(act) {
  const raw = (act.steps && act.steps.length) ? act.steps : [act.summary || act.name];
  const fixed = raw.map((s) => (typeof s === 'string' ? { text: s, sec: 0 } : { text: s.text, sec: s.sec || 0 }));
  const used = fixed.reduce((n, s) => n + s.sec, 0);
  const free = fixed.filter((s) => !s.sec);
  const left = Math.max(free.length * 5, (act.durationSec || 30) - used);
  free.forEach((s) => { s.sec = Math.max(5, Math.round(left / free.length)); });
  return fixed;
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.ceil(s) % 60).padStart(2, '0')}`;

export function startTimer(act, { onComplete, cat } = {}) {
  const steps = normalizeSteps(act);
  const total = steps.reduce((n, s) => n + s.sec, 0);
  let idx = 0, remaining = steps[0].sec, paused = false, last = performance.now(), iv = null, wake = null, finished = false;
  const R = 96, C = 2 * Math.PI * R;

  const ringWrap = h('div', { class: 'ring-wrap', html: `<svg class="ring" viewBox="0 0 220 220" aria-hidden="true"><circle class="ring-bg" cx="110" cy="110" r="${R}"/><circle class="ring-fg" cx="110" cy="110" r="${R}" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="0"/></svg>` });
  const ring = ringWrap.querySelector('.ring-fg');
  ring.style.stroke = (cat && cat.color) || 'var(--grass)';
  const secEl = h('div', { class: 'timer-sec', text: fmt(remaining) });
  ringWrap.append(secEl);
  const textEl = h('div', { class: 'timer-step', 'aria-live': 'polite' });
  const stepLabel = h('div', { class: 'timer-steplabel' });
  const segs = steps.map(() => h('i'));
  const totalEl = h('div', { class: 'timer-total' });
  const pauseBtn = h('button', { class: 'btn btn-primary btn-big', text: '暫停', onclick: () => togglePause() });
  const cancelBtn = h('button', { class: 'btn btn-ghost', text: '取消', onclick: () => close(false) });
  const body = h('div', { class: 'timer-body' },
    h('div', { class: 'timer-title', text: `${(cat && cat.icon) || ''} ${act.name}` }),
    h('div', { class: 'timer-segs' }, segs), stepLabel,
    ringWrap, textEl, totalEl,
    h('div', { class: 'timer-actions' }, cancelBtn, pauseBtn));
  const overlay = h('div', { class: 'timer-overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': act.name }, body);
  document.body.append(overlay);
  document.body.classList.add('no-scroll');

  function paint() {
    const st = steps[idx];
    textEl.textContent = st.text;
    stepLabel.textContent = `步驟 ${idx + 1} / ${steps.length}`;
    segs.forEach((s, i) => { s.className = i < idx ? 'done' : i === idx ? 'cur' : ''; });
    secEl.textContent = fmt(remaining);
    ring.setAttribute('stroke-dashoffset', (C * (1 - remaining / st.sec)).toFixed(1));
    let rest = remaining; for (let i = idx + 1; i < steps.length; i++) rest += steps[i].sec;
    totalEl.textContent = `全部剩下 ${fmt(rest)}（共 ${fmt(total)}）`;
  }
  function tick() {
    const now = performance.now(); const dt = (now - last) / 1000; last = now;
    if (paused || finished) return;
    remaining -= dt;
    if (remaining <= 0) {
      if (idx < steps.length - 1) { idx++; remaining = steps[idx].sec; beep('step'); vibrate(80); }
      else { finish(); return; }
    }
    paint();
  }
  function togglePause() {
    paused = !paused; last = performance.now();
    pauseBtn.textContent = paused ? '繼續' : '暫停';
    overlay.classList.toggle('paused', paused);
  }
  function finish() {
    finished = true; clearInterval(iv);
    beep('done'); vibrate([120, 60, 120]);
    body.innerHTML = '';
    body.append(h('div', { class: 'timer-done' }, h('div', { class: 'big-emoji', text: '🎉' }), h('h2', { text: '完成了！' }), h('p', { text: `${act.name} +${act.points} XP` })));
    setTimeout(() => close(true), 900);
  }
  function close(ok) {
    clearInterval(iv); finished = true;
    try { wake && wake.release(); } catch (e) { /* */ }
    overlay.remove(); document.body.classList.remove('no-scroll');
    document.removeEventListener('keydown', onKey);
    if (ok && onComplete) onComplete();
  }
  const onKey = (e) => { if (e.key === 'Escape') close(false); };
  document.addEventListener('keydown', onKey);
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => { wake = w; }).catch(() => {}); } catch (e) { /* */ }
  paint(); beep('step'); vibrate(60);
  iv = setInterval(tick, 200);
  return { close: () => close(false), skipToEnd: () => finish() };
}
