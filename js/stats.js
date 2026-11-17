// 紀錄頁：統計計算 + 手刻 SVG 圖表
import * as store from './store.js';
import * as game from './game.js';
import { CATEGORIES, ACTIVITIES, BONUS_LOG_ID } from './data/activities.js';
import { h } from './ui.js';

let range = 7;
const BONUS_COLOR = '#e0b43c';
const catColor = (id) => (id === 'bonus' ? BONUS_COLOR : (CATEGORIES.find((c) => c.id === id) || {}).color || '#999');
const p2 = (n) => String(n).padStart(2, '0');

function lastNDays(n) { const t = store.dayKey(); return Array.from({ length: n }, (_, i) => store.addDays(t, i - n + 1)); }
function daysBetween(a, b) { return Math.round((store.dayKeyToDate(b) - store.dayKeyToDate(a)) / 86400000); }

export function computeStats() {
  const logs = store.getState().logs;
  const real = logs.filter((l) => l.activityId !== BONUS_LOG_ID);
  const today = store.dayKey();
  const from7 = store.addDays(today, -6);
  const first = real.length ? store.dayKey(Math.min(...real.map((l) => l.ts))) : today;
  const span = Math.max(1, daysBetween(first, today) + 1);
  const bucket = (arr) => {
    const hrs = new Array(12).fill(0);
    arr.forEach((l) => { hrs[Math.floor(new Date(l.ts).getHours() / 2)]++; });
    const max = Math.max(...hrs);
    if (!max) return '—';
    const i = hrs.indexOf(max);
    return `${p2(i * 2)}–${p2(i * 2 + 2)} 時`;
  };
  const summarize = (arr) => {
    const l7 = arr.filter((l) => store.dayKey(l.ts) >= from7).length;
    return { total: arr.length, last7: l7, avg: arr.length / span, peak: bucket(arr), points: arr.reduce((s, l) => s + l.points, 0) };
  };
  const cats = CATEGORIES.map((c) => ({ cat: c, ...summarize(real.filter((l) => l.category === c.id)),
    acts: ACTIVITIES.filter((a) => a.category === c.id).map((a) => ({ act: a, ...summarize(real.filter((l) => l.activityId === a.id)) })) }));
  const byDay = store.getLogsByDay();
  return { cats, span, totalLogs: real.length, totalPoints: logs.reduce((s, l) => s + l.points, 0), byDay, first };
}

function svgEl(html) { const d = h('div'); d.innerHTML = html; return d.firstElementChild; }

function barChart(byDay, n) {
  const days = lastNDays(n);
  const W = 340, H = 190, L = 28, B = 24, T = 10, R = 4;
  const series = days.map((k) => {
    const o = {}; (byDay.get(k) || []).forEach((l) => { o[l.category] = (o[l.category] || 0) + l.points; });
    return o;
  });
  const totals = series.map((o) => Object.values(o).reduce((a, b) => a + b, 0));
  const maxV = Math.max(5, ...totals);
  const step = maxV <= 10 ? 2 : maxV <= 25 ? 5 : maxV <= 60 ? 10 : 20;
  const top = Math.ceil(maxV / step) * step;
  const iw = W - L - R, ih = H - T - B;
  const bw = iw / n;
  const y = (v) => T + ih - (v / top) * ih;
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="近 ${n} 天每日分數">`;
  for (let v = 0; v <= top; v += step) s += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${L - 5}" y="${y(v) + 3.5}" class="axis" text-anchor="end">${v}</text>`;
  days.forEach((k, i) => {
    let acc = 0; const x = L + i * bw + bw * 0.14, w = bw * 0.72;
    [...CATEGORIES.map((c) => c.id), 'bonus'].forEach((cid) => {
      const v = series[i][cid]; if (!v) return;
      const y1 = y(acc + v), hh = y(acc) - y1;
      s += `<rect x="${x.toFixed(1)}" y="${y1.toFixed(1)}" width="${w.toFixed(1)}" height="${Math.max(0, hh - 0.6).toFixed(1)}" rx="${Math.min(3, w / 3).toFixed(1)}" fill="${catColor(cid)}"><title>${k} ${cid === 'bonus' ? '每日加成' : (CATEGORIES.find((c) => c.id === cid) || {}).name}：${v} 分</title></rect>`;
      acc += v;
    });
    const d = store.dayKeyToDate(k);
    const lab = n === 7 ? `${d.getMonth() + 1}/${d.getDate()}` : (i % 5 === 0 || i === n - 1 ? `${d.getMonth() + 1}/${d.getDate()}` : '');
    if (lab) s += `<text x="${(L + i * bw + bw / 2).toFixed(1)}" y="${H - 7}" class="axis" text-anchor="middle">${lab}</text>`;
    if (totals[i] && n === 7) s += `<text x="${(L + i * bw + bw / 2).toFixed(1)}" y="${(y(totals[i]) - 3).toFixed(1)}" class="axis val" text-anchor="middle">${totals[i]}</text>`;
  });
  return svgEl(s + '</svg>');
}

function heatmap(byDay, caption) {
  const weeks = 12, cell = 22, gap = 4, L = 22, T = 18;
  const today = store.dayKey();
  const dow = store.dayKeyToDate(today).getDay(); // 0=日
  const start = store.addDays(today, -(dow + (weeks - 1) * 7));
  const W = L + weeks * (cell + gap), H = T + 7 * (cell + gap);
  const lvl = (p) => (p <= 0 ? 0 : p < 5 ? 1 : p < 10 ? 2 : p < 20 ? 3 : 4);
  let s = `<svg viewBox="0 0 ${W} ${H}" class="chart heat" role="img" aria-label="近 12 週活動熱力圖">`;
  ['日', '一', '二', '三', '四', '五', '六'].forEach((t, r) => { if (r % 2 === 1) s += `<text x="${L - 6}" y="${T + r * (cell + gap) + cell * 0.68}" class="axis" text-anchor="end">${t}</text>`; });
  let lastMonth = -1, lastLabW = -9;
  for (let w = 0; w < weeks; w++) {
    for (let r = 0; r < 7; r++) {
      const k = store.addDays(start, w * 7 + r);
      if (k > today) continue;
      const pts = (byDay.get(k) || []).reduce((a, l) => a + l.points, 0);
      const x = L + w * (cell + gap), yy = T + r * (cell + gap);
      s += `<rect class="hc l${lvl(pts)}" data-k="${k}" data-p="${pts}" x="${x}" y="${yy}" width="${cell}" height="${cell}" rx="5"${k === today ? ' stroke-width="2"' : ''}><title>${k}：${pts} 分</title></rect>`;
      if (r === 0) { const m = store.dayKeyToDate(k).getMonth(); if (m !== lastMonth) { lastMonth = m; if (w - lastLabW >= 2) { lastLabW = w; s += `<text x="${x}" y="11" class="axis">${m + 1}月</text>`; } } }
    }
  }
  const el = svgEl(s + '</svg>');
  el.addEventListener('click', (e) => { const t = e.target.closest('.hc'); if (t) caption.textContent = `${t.dataset.k.replace(/-/g, '/')}：${t.dataset.p} 分`; });
  return el;
}

export function render(container) {
  const st = computeStats();
  const sk = game.streaks();
  container.innerHTML = '';
  const card = (title, ...kids) => h('section', { class: 'card' }, h('h3', { class: 'card-title', text: title }), kids);
  const wrap = h('div', { class: 'view-pad' });

  wrap.append(h('div', { class: 'chips' },
    h('div', { class: 'chip' }, h('b', { text: String(sk.current) }), h('span', { text: '目前連續天數' })),
    h('div', { class: 'chip' }, h('b', { text: String(sk.longest) }), h('span', { text: '最長連續天數' })),
    h('div', { class: 'chip' }, h('b', { text: String(st.totalLogs) }), h('span', { text: '累計次數' })),
    h('div', { class: 'chip' }, h('b', { text: String(st.totalPoints) }), h('span', { text: '累計分數' }))));

  // 今日時間軸
  const today = store.logsOnDay(store.dayKey()).sort((a, b) => a.ts - b.ts);
  const tl = h('ol', { class: 'timeline' });
  today.forEach((l) => {
    const act = store.activityById(l.activityId);
    const isBonus = l.activityId === BONUS_LOG_ID;
    const cat = CATEGORIES.find((c) => c.id === l.category);
    tl.append(h('li', null, h('time', { text: store.fmtTime(l.ts) }), h('i', { class: 'dot', style: { background: catColor(l.category) } }),
      h('span', { class: 'tl-name', text: `${isBonus ? '🎉' : (cat ? cat.icon : '')} ${isBonus ? '五大類全完成加成' : act ? act.name : l.activityId}` }),
      h('b', { class: 'tl-pts', text: `+${l.points}` })));
  });
  wrap.append(card('今日時間軸', today.length ? tl : h('p', { class: 'empty', text: '今天還沒有紀錄，來做第一件事吧！' })));

  if (!st.totalLogs) {
    wrap.append(h('section', { class: 'card empty-card' }, h('div', { class: 'big-emoji', text: '📊' }),
      h('p', { class: 'empty', text: '還沒有任何紀錄。到「今天」或「動一動」完成一個健康行為，這裡就會出現圖表與統計。' })));
    container.append(wrap); return;
  }

  // 長條圖
  const chartHost = h('div', { class: 'chart-host' });
  const draw = () => { chartHost.replaceChildren(barChart(st.byDay, range)); };
  const seg = h('div', { class: 'seg', role: 'tablist' }, [7, 30].map((n) => h('button', { role: 'tab', 'aria-selected': String(n === range), class: n === range ? 'on' : '', text: `${n} 天`, onclick: (e) => {
    range = n; seg.querySelectorAll('button').forEach((b) => { const on = b === e.currentTarget; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }); draw();
  } })));
  const legend = h('div', { class: 'legend' }, [...CATEGORIES, { id: 'bonus', name: '加成', color: BONUS_COLOR }].map((c) => h('span', null, h('i', { style: { background: c.color } }), c.name)));
  draw();
  wrap.append(card('每日分數', seg, chartHost, legend));

  // 表格
  const tb = h('tbody');
  const fx = (n) => (Math.round(n * 10) / 10).toString();
  st.cats.forEach((c) => {
    tb.append(h('tr', { class: 'cat-row' }, h('td', null, h('i', { class: 'dot', style: { background: c.cat.color } }), `${c.cat.icon} ${c.cat.name}`), h('td', { text: String(c.total) }), h('td', { text: String(c.last7) }), h('td', { text: fx(c.avg) }), h('td', { text: c.peak })));
    c.acts.forEach((a) => tb.append(h('tr', { class: 'act-row' }, h('td', { text: a.act.name }), h('td', { text: String(a.total) }), h('td', { text: String(a.last7) }), h('td', { text: fx(a.avg) }), h('td', { text: a.peak }))));
  });
  const table = h('table', { class: 'stat-table' }, h('thead', null, h('tr', null, ['項目', '總次數', '近 7 天', '日均', '最常時段'].map((t) => h('th', { text: t })))), tb);
  wrap.append(card('各類別與行為統計', h('div', { class: 'table-scroll' }, table), h('p', { class: 'note', text: `日均 = 總次數 ÷ 自第一筆紀錄以來的天數（目前 ${st.span} 天）。時段以 2 小時為一格，取次數最多者。` })));

  // 熱力圖
  const cap = h('p', { class: 'note heat-cap', text: '點擊方格查看當日分數' });
  const hl = h('div', { class: 'heat-legend' }, h('span', { text: '少' }), [0, 1, 2, 3, 4].map((i) => h('i', { class: `l${i}` })), h('span', { text: '多' }));
  wrap.append(card('近 12 週活動熱力圖', h('div', { class: 'heat-host' }, heatmap(st.byDay, cap)), cap, hl));
  container.append(wrap);
}
