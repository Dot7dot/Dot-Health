// 農場：草地場景、動物漫遊（requestAnimationFrame）、點擊查看
import * as store from './store.js';
import * as game from './game.js';
import { renderAnimal, levelScale, describeAnimal, MOODS, SPECIES } from './animals.js';
import { h, modal, reducedMotion } from './ui.js';
import { renameFlow } from './actions.js';

let root = null, scene = null, layer = null, infoEl = null;
let running = false, raf = 0, lastT = 0, timeTimer = 0, ro = null;
const sprites = new Map(); // id -> { el, flip, svgHost, x, y, tx, ty, pause, speed, dir, sig, bubble }
const BASE = 104;

const rnd = (a, b) => a + Math.random() * (b - a);
const hw = (sp) => (sp.size || 80) * 0.5; // 半寬（含透視放大餘裕）
const cx = (sp, b, x) => Math.min(b.xMax - hw(sp), Math.max(b.xMin + hw(sp), x));

export function timeOfDay(d = new Date()) {
  const m = d.getHours() + d.getMinutes() / 60;
  if (m >= 6.5 && m < 17) return 'day';
  if ((m >= 17 && m < 19.5) || (m >= 5 && m < 6.5)) return 'dusk';
  return 'night';
}

function treeSVG(c1, c2) {
  return `<svg viewBox="0 0 80 110" width="100%" height="100%" aria-hidden="true"><rect x="34" y="62" width="12" height="44" rx="5" fill="#8a5a3b"/><circle cx="40" cy="38" r="30" fill="${c1}"/><circle cx="24" cy="50" r="20" fill="${c2}"/><circle cx="57" cy="48" r="21" fill="${c2}"/><circle cx="32" cy="28" r="7" fill="#fff" opacity=".18"/></svg>`;
}
function flowerSVG(c) {
  return `<svg viewBox="0 0 24 30" width="100%" height="100%" aria-hidden="true"><path d="M12 14 V29" stroke="#4f9a49" stroke-width="2.5" stroke-linecap="round"/><g fill="${c}"><circle cx="12" cy="6" r="4.5"/><circle cx="6.5" cy="11" r="4.5"/><circle cx="17.5" cy="11" r="4.5"/><circle cx="8.5" cy="16" r="4.5" opacity="0"/></g><circle cx="12" cy="10.5" r="3.4" fill="#ffd84a"/></svg>`;
}
function fenceSVG() {
  let posts = '';
  for (let i = 0; i < 14; i++) posts += `<rect x="${i * 30 + 6}" y="6" width="9" height="34" rx="3" fill="#b9825a"/><path d="M${i * 30 + 6} 6 l4.5 -5 l4.5 5z" fill="#b9825a"/>`;
  return `<svg viewBox="0 0 420 44" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true">${posts}<rect x="0" y="14" width="420" height="6" rx="3" fill="#d09c72"/><rect x="0" y="27" width="420" height="6" rx="3" fill="#d09c72"/></svg>`;
}

function buildScene() {
  const tpl = h('div', { class: 'farm-scene' });
  tpl.innerHTML = `
    <div class="sky"><div class="sun"></div><div class="moon"></div>
      <div class="stars"></div>
      <div class="cloud c1"></div><div class="cloud c2"></div></div>
    <div class="hill h1"></div><div class="hill h2"></div>
    <div class="field">
      <div class="fence">${fenceSVG()}</div>
      <div class="decor tree" style="left:4%;top:6%;width:64px;height:88px">${treeSVG('#5fae55', '#4c9a48')}</div>
      <div class="decor tree" style="right:3%;top:3%;width:76px;height:104px">${treeSVG('#6bbb5d', '#54a24b')}</div>
      <div class="decor" style="left:20%;top:76%;width:20px;height:26px">${flowerSVG('#ff8fb1')}</div>
      <div class="decor" style="left:63%;top:84%;width:22px;height:28px">${flowerSVG('#fff1a8')}</div>
      <div class="decor" style="left:82%;top:70%;width:20px;height:26px">${flowerSVG('#ffffff')}</div>
      <div class="decor" style="left:9%;top:90%;width:18px;height:24px">${flowerSVG('#ffb27a')}</div>
      <div class="decor" style="left:46%;top:12%;width:18px;height:24px">${flowerSVG('#ff8fb1')}</div>
      <div class="animals"></div>
    </div>
    <div class="farm-info"></div>`;
  const st = tpl.querySelector('.stars');
  for (let i = 0; i < 24; i++) { const s = h('i'); s.style.left = rnd(2, 98) + '%'; s.style.top = rnd(2, 70) + '%'; s.style.animationDelay = rnd(0, 3).toFixed(1) + 's'; st.append(s); }
  return tpl;
}

function applyTime() { if (scene) { scene.classList.remove('t-day', 't-dusk', 't-night'); scene.classList.add('t-' + timeOfDay()); } }

function bounds() {
  const r = layer.getBoundingClientRect();
  return { w: r.width, h: r.height, xMin: 0, xMax: r.width, yMin: r.height * 0.2 + 40, yMax: r.height - 40 };
}
function factor(n) { return n <= 6 ? 1 : Math.max(0.55, 1 - (n - 6) * 0.045); }

function allAnimals() { return store.getState().animals; }

function sig(a, mood, f) { return [a.level, a.name, mood, f, a.accessory, a.fur, a.color, a.species, a.shiny].join('|'); }

function sync() {
  if (!layer) return;
  const list = allAnimals();
  const f = factor(list.length);
  const mood = game.currentMood();
  const b = bounds();
  const ids = new Set(list.map((a) => a.id));
  for (const [id, sp] of sprites) if (!ids.has(id)) { sp.el.remove(); sprites.delete(id); }
  for (const a of list) {
    let sp = sprites.get(a.id);
    if (!sp) {
      const el = h('div', { class: 'farm-animal', role: 'button', tabindex: '0' });
      const flip = h('div', { class: 'flipper' }); const bubble = h('div', { class: 'bubble-html' });
      el.append(flip, bubble); layer.append(el);
      sp = { el, flip, bubble, size: 90, x: rnd(60, Math.max(70, b.xMax - 60)), y: rnd(b.yMin, b.yMax), tx: 0, ty: 0, pause: rnd(0, 2.5), speed: rnd(16, 30), dir: 1, sig: '', walking: false, svg: null };
      sp.tx = sp.x; sp.ty = sp.y;
      const open = () => showCard(a.id);
      el.addEventListener('click', open);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
      sprites.set(a.id, sp);
    }
    const sg = sig(a, mood, f);
    if (sg !== sp.sig) {
      sp.sig = sg;
      const px = Math.round(BASE * f * levelScale(a.level));
      sp.size = px;
      sp.svg = renderAnimal(a, { size: BASE * f, level: a.level, mood: mood, bubble: false, walking: sp.walking });
      sp.flip.replaceChildren(sp.svg);
      sp.el.style.width = px + 'px'; sp.el.style.height = px + 'px';
      sp.el.setAttribute('aria-label', `${a.name}，${SPECIES[a.species].name}，Lv.${a.level}`);
      sp.bubble.textContent = MOODS[mood].emoji;
      sp.bubble.classList.toggle('cur', a.id === store.getState().currentAnimalId);
    }
    sp.x = cx(sp, b, sp.x); sp.y = Math.min(b.yMax, Math.max(b.yMin, sp.y));
    place(sp, b);
  }
  const grads = list.filter((a) => a.graduatedAt).length;
  infoEl.textContent = `🌾 農場住民 ${list.length} 隻（已畢業 ${grads}，成長中 ${list.length - grads}）· 點點看牠們`;
}

function place(sp, b) {
  const t = (sp.y - b.yMin) / Math.max(1, b.yMax - b.yMin);
  const s = 0.78 + 0.3 * Math.max(0, Math.min(1, t));
  sp.el.style.transform = `translate3d(${(sp.x - sp.size / 2).toFixed(1)}px, ${(sp.y - sp.size).toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
  sp.el.style.zIndex = String(Math.round(sp.y));
}
function setWalking(sp, w) {
  if (sp.walking === w) return; sp.walking = w;
  if (sp.svg) sp.svg.classList.toggle('walk', w && !reducedMotion());
  sp.bubble.classList.toggle('show', !w);
}
function pickTarget(sp, b) {
  sp.tx = cx(sp, b, rnd(b.xMin, b.xMax)); sp.ty = rnd(b.yMin, b.yMax);
  // 偏好走較短距離
  if (Math.random() < 0.6) { sp.tx = cx(sp, b, sp.x + rnd(-110, 110)); sp.ty = Math.min(b.yMax, Math.max(b.yMin, sp.y + rnd(-60, 60))); }
  sp.speed = rnd(16, 32);
}

function frame(t) {
  if (!running) return;
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0); lastT = t;
  const b = bounds();
  for (const sp of sprites.values()) {
    if (sp.pause > 0) { sp.pause -= dt; setWalking(sp, false); if (sp.pause <= 0) pickTarget(sp, b); }
    else {
      const dx = sp.tx - sp.x, dy = sp.ty - sp.y, d = Math.hypot(dx, dy);
      const step = sp.speed * dt;
      if (d <= step || d < 1) { sp.pause = rnd(1.5, 5); setWalking(sp, false); }
      else {
        sp.x += dx / d * step; sp.y += dy / d * step; setWalking(sp, true);
        if (Math.abs(dx) > 3) { const dir = dx > 0 ? 1 : -1; if (dir !== sp.dir) { sp.dir = dir; sp.flip.style.transform = dir < 0 ? 'scaleX(-1)' : ''; } }
      }
    }
    place(sp, b);
  }
  raf = requestAnimationFrame(frame);
}

function showCard(id) {
  const a = store.getAnimal(id); if (!a) return;
  const d = describeAnimal(a);
  const mood = game.currentMood();
  const row = (k, v) => h('div', { class: 'kv' }, h('span', { text: k }), h('b', { text: v }));
  const dt = (ts) => store.fmtDate(ts);
  const cur = a.id === store.getState().currentAnimalId;
  const body = h('div', { class: 'animal-card' },
    h('div', { class: 'card-stage' }, renderAnimal(a, { size: 130, level: a.level, mood, bubble: true })),
    h('h3', { text: `${a.shiny ? '✨ ' : ''}${a.name}` }),
    row('物種', d.species), row('毛色 / 毛長', `${d.color} · ${d.fur}`), row('配件', d.accessory),
    row('等級', `Lv.${a.level}${a.shiny ? '（閃光）' : ''}`), row('心情', `${MOODS[mood].emoji} ${MOODS[mood].text}`),
    row('出生', dt(a.bornAt)), row(cur ? '狀態' : '畢業', cur ? '成長中' : dt(a.graduatedAt)));
  modal({
    body, className: 'card-modal', cancelValue: null,
    actions: [{ label: '改名', value: 'rename' }, { label: '關閉', primary: true, value: null }],
  }).then((v) => { if (v === 'rename') renameFlow(a); });
}

export function mount(container) {
  root = container;
  root.innerHTML = '';
  scene = buildScene();
  root.append(scene);
  layer = scene.querySelector('.animals'); infoEl = scene.querySelector('.farm-info');
  applyTime();
}
export function refresh() { if (!root || !layer) return; sync(); }
export function start() {
  if (!root) return;
  running = true; applyTime();
  sync(); lastT = performance.now();
  cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
  clearInterval(timeTimer); timeTimer = setInterval(applyTime, 60000);
  if (!ro && window.ResizeObserver) { ro = new ResizeObserver(() => { if (running) sync(); }); ro.observe(layer); }
}
export function stop() { running = false; cancelAnimationFrame(raf); clearInterval(timeTimer); }
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); } else if (running) { lastT = performance.now(); raf = requestAnimationFrame(frame); } });
