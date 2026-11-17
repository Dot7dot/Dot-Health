// 進入點：分頁路由、初始化、提醒、除錯鉤子
import * as store from './store.js';
import * as game from './game.js';
import * as farm from './farm.js';
import * as stats from './stats.js';
import { ACTIVITIES, CATEGORIES } from './data/activities.js';
import { randomAnimal } from './animals.js';
import { h, $, $$ } from './ui.js';
import { renderToday, renderMove, renderSettings, runTimer } from './views.js';

const TABS = ['today', 'move', 'farm', 'stats', 'settings'];
let active = 'today';
let queued = 0;

const renderers = {
  today: (el) => renderToday(el),
  move: (el) => renderMove(el),
  stats: (el) => stats.render(el),
  settings: (el) => renderSettings(el),
  farm: () => farm.refresh(),
};

function renderActive() {
  const el = $('#v-' + active);
  const y = window.scrollY;
  renderers[active](el);
  if (active !== 'farm') window.scrollTo(0, y);
  $('#hdr-pts').textContent = `今日 ${game.todayPoints()} 分`;
}
function scheduleRender() { if (queued) return; queued = requestAnimationFrame(() => { queued = 0; renderActive(); }); }

export function go(tab, replace) {
  if (!TABS.includes(tab)) tab = 'today';
  if (active === 'farm' && tab !== 'farm') farm.stop();
  active = tab;
  $$('#views > section').forEach((s) => { s.hidden = s.dataset.tab !== tab; });
  $$('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  if (replace) history.replaceState(null, '', '#' + tab); else if (location.hash !== '#' + tab) location.hash = tab;
  renderActive();
  if (tab === 'farm') farm.start();
  window.scrollTo(0, 0);
}

// ---------- 提醒 ----------
let lastRemind = Date.now();
function suggestion() {
  const done = game.todayCategories();
  const pool = CATEGORIES.filter((c) => !done.has(c.id));
  const list = pool.length ? pool : CATEGORIES;
  const cat = list[Math.floor(Math.random() * list.length)];
  const acts = ACTIVITIES.filter((a) => a.category === cat.id);
  return acts[Math.floor(Math.random() * acts.length)];
}
function showBanner(msg, act) {
  const old = $('#banner'); if (old) old.remove();
  const host = h('div', { id: 'banner' });
  host.append(h('div', { class: 'banner-box', role: 'alert' }, h('span', { text: '🔔 ' + msg }),
    act.kind === 'timer' ? h('button', { class: 'go', text: '開始', onclick: () => { host.remove(); runTimer(act); } }) : null,
    h('button', { text: '稍後', onclick: () => host.remove() })));
  document.body.append(host);
  setTimeout(() => host.remove(), 20000);
}
function remind() {
  const act = suggestion();
  const msg = `該動一動囉！試試「${act.name}」（${act.summary}）`;
  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((r) => r.showNotification('Dot Health', { body: msg, icon: 'icons/icon-192.png', tag: 'dot-remind' })).catch(() => new Notification('Dot Health', { body: msg }));
      } else new Notification('Dot Health', { body: msg });
      return;
    } catch (e) { /* 退回頁內橫幅 */ }
  }
  showBanner(msg, act);
}
function reminderTick() {
  const m = store.getState().settings.reminderMinutes;
  if (!m) return;
  const lastLog = store.getState().logs.reduce((mx, l) => Math.max(mx, l.ts), 0);
  if (Date.now() - Math.max(lastRemind, lastLog) >= m * 60000) { lastRemind = Date.now(); remind(); }
}

// ---------- 除錯鉤子（?debug=1） ----------
function installDebug() {
  const rnd = (n) => Math.floor(Math.random() * n);
  window.__dot = {
    store, game, go, farm, remind,
    state: () => store.getState(),
    /** 直接加 XP（不寫 log）；滿 140 會畢業並孵出新寶寶 */
    addXP: (n = 10) => { game.addXPDirect(n); },
    /** 用真實打卡流程記錄 n 次（跑升等/畢業邏輯，但不顯示慶祝畫面） */
    log: (id, n = 1) => { for (let i = 0; i < n; i++) game.logActivity(id || ACTIVITIES[rnd(ACTIVITIES.length)].id, { withUndo: false }); },
    graduate: () => { const a = store.getCurrentAnimal(); game.addXPDirect(140 - a.xp); },
    /** 在農場加入 n 隻已畢業的動物 */
    addAnimals: (n = 5) => {
      const s = store.getState();
      for (let i = 0; i < n; i++) {
        const prev = s.animals[s.animals.length - 1];
        const a = randomAnimal(prev && prev.species); a.xp = 140; a.level = 5; a.graduatedAt = Date.now() - (n - i) * 86400000;
        a.bornAt = a.graduatedAt - 5 * 86400000;
        s.animals.splice(s.animals.length - 1, 0, a);
      }
      store.commit();
    },
    /** 灌入過去 N 天的假紀錄（不影響 XP） */
    seed: (days = 30) => {
      const s = store.getState(); void s;
      for (let d = days; d >= 1; d--) {
        if (Math.random() < 0.2) continue;
        const cats = new Set(); const n = 3 + rnd(9);
        const base = new Date(); base.setDate(base.getDate() - d);
        for (let i = 0; i < n; i++) {
          const act = ACTIVITIES[rnd(ACTIVITIES.length)];
          const hr = [9, 10, 11, 14, 15, 16, 20, 21][rnd(8)];
          base.setHours(hr, rnd(60), rnd(60), 0);
          store.addLog(act.id, { points: act.points, ts: base.getTime(), silent: true });
          cats.add(act.category);
        }
        if (cats.size === CATEGORIES.length) store.addLog('bonus-all-categories', { points: 3, ts: base.getTime(), silent: true });
      }
      store.commit();
    },
    reset: () => store.resetAll(),
  };
}

// ---------- 啟動 ----------
function boot() {
  store.load();
  farm.mount($('#v-farm'));
  store.subscribe(() => { scheduleRender(); });
  $$('.tab').forEach((b) => b.addEventListener('click', () => go(b.dataset.tab)));
  window.addEventListener('hashchange', () => { const t = location.hash.slice(1); if (t !== active) go(t, true); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRender(); });
  setInterval(reminderTick, 15000);
  setInterval(() => { if (!document.hidden && active === 'today') scheduleRender(); }, 5 * 60000); // 跨日更新
  go(location.hash.slice(1) || 'today', true);
  if (new URLSearchParams(location.search).get('debug')) installDebug();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
boot();
