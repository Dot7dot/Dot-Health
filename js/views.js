// 今天 / 動一動 / 設定 三個分頁畫面
import * as store from './store.js';
import * as game from './game.js';
import { CATEGORIES, ACTIVITIES, REFERENCES, DISCLAIMER } from './data/activities.js';
import { SPECIES, MOODS } from './animals.js';
import { h, toast, confirmDialog, alertDialog } from './ui.js';
import { logAndCelebrate, animalNode, renameFlow } from './actions.js';
import { startTimer } from './timer.js';

const catOf = (id) => CATEGORIES.find((c) => c.id === id);
export function runTimer(act) {
  startTimer(act, { cat: catOf(act.category), onComplete: () => logAndCelebrate(act.id, null) });
}

// ---------------- 今天 ----------------
export function renderToday(el) {
  const a = store.getCurrentAnimal();
  const pr = game.progress(a);
  const mood = game.currentMood();
  const tp = game.todayPoints();
  const sk = game.streaks();
  const done = game.todayCategories();
  el.innerHTML = '';
  const wrap = h('div', { class: 'view-pad' });

  const stage = h('div', { class: 'hero-stage' });
  const svg = animalNode(a, 200, { mood });
  stage.append(svg);
  stage.addEventListener('click', () => { stage.classList.remove('hop'); void stage.offsetWidth; stage.classList.add('hop'); });
  const need = pr.need ? `${pr.into} / ${pr.need} XP（下一級還差 ${pr.next - a.xp}）` : '已滿級';
  wrap.append(h('section', { class: 'card hero' },
    stage,
    h('div', { class: 'hero-name' }, h('h2', { text: `${a.shiny ? '✨ ' : ''}${a.name}` }),
      h('button', { class: 'icon-btn', 'aria-label': '改名', text: '✏️', onclick: () => renameFlow(a) })),
    h('div', { class: 'hero-sub', text: `Lv.${a.level} · ${SPECIES[a.species].name} · ${MOODS[mood].emoji} ${MOODS[mood].text}` }),
    h('div', { class: 'xpbar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(pr.pct)), 'aria-label': '經驗值' }, h('i', { style: { width: pr.pct + '%' } })),
    h('div', { class: 'xp-label', text: need })));

  const dots = h('div', { class: 'cat-dots' }, CATEGORIES.map((c) =>
    h('div', { class: 'cat-dot' + (done.has(c.id) ? ' on' : ''), title: c.name, style: { '--c': c.color } }, h('span', { class: 'ic', text: c.icon }), h('small', { text: c.name }))));
  const left = CATEGORIES.length - done.size;
  const bonusDone = game.todayLogs().some((l) => l.category === 'bonus');
  wrap.append(h('section', { class: 'card' },
    h('div', { class: 'chips two' },
      h('div', { class: 'chip' }, h('b', { text: String(tp) }), h('span', { text: '今日分數' })),
      h('div', { class: 'chip' }, h('b', { text: `🔥 ${sk.current}` }), h('span', { text: '連續天數' }))),
    dots,
    h('p', { class: 'note center', text: bonusDone ? '🎉 今日加成已領取（+3 XP）' : `五大類各做一次，額外 +3 XP（還差 ${left} 類）` })));

  const list = h('section', { class: 'card' }, h('h3', { class: 'card-title', text: '快速打卡' }));
  for (const c of CATEGORIES) {
    const acts = ACTIVITIES.filter((x) => x.category === c.id);
    if (!acts.length) continue;
    const grp = h('div', { class: 'qgroup' }, h('div', { class: 'qhead', style: { '--c': c.color } }, h('span', { text: `${c.icon} ${c.name}` })));
    for (const act of acts) {
      const n = game.todayCount(act.id);
      const full = n >= act.dailyCap;
      const main = h('button', { class: 'qmain' + (full ? ' full' : ''), 'aria-label': `記錄 ${act.name}` },
        h('span', { class: 'qtxt' }, h('b', { text: act.name }), h('small', { text: act.summary })),
        h('span', { class: 'pts', text: `+${act.points}` }),
        h('span', { class: 'cnt' + (full ? ' full' : ''), text: `${n}/${act.dailyCap}` }));
      main.addEventListener('click', () => logAndCelebrate(act.id, main));
      const row = h('div', { class: 'qrow' }, main);
      if (act.kind === 'timer') row.append(h('button', { class: 'qplay', 'aria-label': `開始引導計時：${act.name}`, text: '▶', onclick: () => runTimer(act) }));
      grp.append(row);
    }
    list.append(grp);
  }
  wrap.append(list);
  el.append(wrap);
}

// ---------------- 動一動 ----------------
const openSet = new Set();
export function renderMove(el) {
  el.innerHTML = '';
  const wrap = h('div', { class: 'view-pad' });
  wrap.append(h('p', { class: 'intro', text: '點開卡片看步驟與原理；「開始」會進入逐步引導計時，完成自動記錄。' }));
  for (const c of CATEGORIES) {
    const sec = h('section', { class: 'card' }, h('h3', { class: 'card-title', style: { '--c': c.color } }, `${c.icon} ${c.name}`));
    for (const act of ACTIVITIES.filter((x) => x.category === c.id)) {
      const n = game.todayCount(act.id);
      const d = h('details', { class: 'act-card' });
      if (openSet.has(act.id)) d.open = true;
      d.addEventListener('toggle', () => { d.open ? openSet.add(act.id) : openSet.delete(act.id); });
      const dur = act.durationSec ? (act.durationSec >= 60 ? `${Math.round(act.durationSec / 6) / 10} 分鐘` : `${act.durationSec} 秒`) : '打卡';
      d.append(h('summary', null, h('span', { class: 'qtxt' }, h('b', { text: act.name }), h('small', { text: `${act.summary}` })),
        h('span', { class: 'meta' }, h('span', { class: 'pts', text: `+${act.points}` }), h('small', { text: `${dur} · ${n}/${act.dailyCap}` }))));
      const steps = h('ol', { class: 'steps' }, act.steps.map((s) => h('li', { text: typeof s === 'string' ? s : s.sec ? `${s.text}（${s.sec} 秒）` : s.text })));
      const refs = h('ul', { class: 'refs' }, (act.refs || []).map((id) => {
        const r = REFERENCES[id]; if (!r) return null;
        return h('li', null, h('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer', text: r.title }), h('small', { text: ` ${r.org}${r.year ? ' · ' + r.year : ''}` }));
      }));
      const btns = h('div', { class: 'act-btns' });
      if (act.kind === 'timer') btns.append(h('button', { class: 'btn btn-primary', text: '▶ 開始', onclick: () => runTimer(act) }));
      const quick = h('button', { class: 'btn ' + (act.kind === 'timer' ? 'btn-ghost' : 'btn-primary'), text: act.kind === 'timer' ? '直接記錄' : '✓ 打卡' });
      quick.addEventListener('click', () => logAndCelebrate(act.id, quick));
      btns.append(quick);
      d.append(h('div', { class: 'act-body' }, h('h4', { text: '步驟' }), steps, h('h4', { text: '為什麼有效' }), h('p', { text: act.why }),
        act.caution ? h('div', { class: 'caution', text: '⚠️ ' + act.caution }) : null,
        refs.children.length ? [h('h4', { text: '參考文獻' }), refs] : null, btns));
      sec.append(d);
    }
    wrap.append(sec);
  }
  wrap.append(h('p', { class: 'disclaimer', text: DISCLAIMER }));
  el.append(wrap);
}

// ---------------- 設定 ----------------
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export function renderSettings(el) {
  const s = store.getState();
  el.innerHTML = '';
  const wrap = h('div', { class: 'view-pad' });
  const card = (t, ...k) => h('section', { class: 'card' }, h('h3', { class: 'card-title', text: t }), k);

  const opts = [[0, '關閉'], [30, '30 分'], [45, '45 分'], [60, '60 分']];
  const seg = h('div', { class: 'seg' }, opts.map(([v, t]) => h('button', {
    class: s.settings.reminderMinutes === v ? 'on' : '', text: t,
    onclick: async () => {
      if (v > 0 && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) { /* */ } }
      store.setSettings({ reminderMinutes: v });
      if (v > 0 && !('Notification' in window)) toast('此裝置不支援系統通知，將以頁內提示提醒');
    } })));
  const perm = 'Notification' in window ? (Notification.permission === 'granted' ? '已允許通知（App 開著時會跳出系統通知）' : '未允許通知，將以頁內橫幅提醒') : '此瀏覽器不支援通知，將以頁內橫幅提醒';
  wrap.append(card('提醒', h('p', { class: 'note', text: '每隔一段時間提醒你動一動（僅在 App 開啟時運作）。' }), seg, h('p', { class: 'note', text: perm })));

  const sw = h('input', { type: 'checkbox', id: 'sound', checked: s.settings.sound ? true : null });
  sw.addEventListener('change', () => store.setSettings({ sound: sw.checked }));
  wrap.append(card('聲音', h('label', { class: 'switch-row', for: 'sound' }, h('span', { text: '提示音與震動' }), sw, h('i', { class: 'switch' }))));

  const fileIn = h('input', { type: 'file', accept: 'application/json,.json', class: 'hidden' });
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files[0]; if (!f) return;
    const text = await f.text();
    let obj = null; try { obj = JSON.parse(text); } catch (e) { /* */ }
    const err = obj ? store.validateImport(obj) : '無法解析 JSON';
    if (err) { await alertDialog(err, '匯入失敗'); fileIn.value = ''; return; }
    const ok = await confirmDialog(`將以檔案內容取代目前所有資料（${obj.logs.length} 筆紀錄、${obj.animals.length} 隻動物）。確定嗎？`, '取代並匯入', { danger: true, title: '匯入資料' });
    if (ok) { store.importJSON(text); toast('匯入完成'); }
    fileIn.value = '';
  });
  const stamp = store.dayKey();
  wrap.append(card('資料備份',
    h('p', { class: 'note', text: `資料只存在這台裝置的瀏覽器中。建議定期匯出備份。目前 ${s.logs.length} 筆紀錄、${s.animals.length} 隻動物。${store.isStorageOK() ? '' : ' ⚠️ 無法使用本機儲存，關閉頁面後資料會消失！'}` }),
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn btn-ghost', text: '匯出 JSON', onclick: () => download(`dot-health-${stamp}.json`, store.exportJSON(), 'application/json') }),
      h('button', { class: 'btn btn-ghost', text: '匯出 CSV', onclick: () => download(`dot-health-${stamp}.csv`, store.exportCSV(), 'text/csv;charset=utf-8') }),
      h('button', { class: 'btn btn-ghost', text: '匯入 JSON', onclick: () => fileIn.click() })), fileIn));

  // 參考文獻
  const used = new Set();
  const refSec = card('參考文獻');
  const li = (id) => { const r = REFERENCES[id]; return r ? h('li', null, h('a', { href: r.url, target: '_blank', rel: 'noopener noreferrer', text: r.title }), h('small', { text: ` ${r.org}${r.year ? ' · ' + r.year : ''}` })) : null; };
  for (const c of CATEGORIES) {
    const ids = [...new Set(ACTIVITIES.filter((a) => a.category === c.id).flatMap((a) => a.refs || []))].filter((i) => REFERENCES[i]);
    if (!ids.length) continue;
    ids.forEach((i) => used.add(i));
    refSec.append(h('h4', { text: `${c.icon} ${c.name}` }), h('ul', { class: 'refs' }, ids.map(li)));
  }
  const rest = Object.keys(REFERENCES).filter((i) => !used.has(i));
  if (rest.length) refSec.append(h('h4', { text: '其他' }), h('ul', { class: 'refs' }, rest.map(li)));
  refSec.append(h('p', { class: 'disclaimer', text: DISCLAIMER }));
  wrap.append(refSec);

  wrap.append(card('安裝到主畫面', h('p', { class: 'note', text: 'iPhone：用 Safari 開啟 → 分享 → 加入主畫面。Android：瀏覽器選單 → 安裝應用程式。安裝後可離線使用。' })));

  wrap.append(card('危險區', h('button', { class: 'btn btn-danger', text: '重置所有資料', onclick: async () => {
    if (!(await confirmDialog('這會刪除所有紀錄與動物，無法復原。', '繼續', { danger: true, title: '重置資料？' }))) return;
    if (!(await confirmDialog('最後確認：真的要清除全部資料並重新開始嗎？建議先匯出備份。', '全部清除', { danger: true, title: '再次確認' }))) return;
    store.resetAll(); toast('已重置，歡迎新的開始！');
  } })));
  wrap.append(h('p', { class: 'note center', text: `Dot Health · 資料版本 v${store.VERSION}` }));
  el.append(wrap);
}
