// 狀態讀寫、遷移、匯出入、log API
import { ACTIVITIES, CATEGORIES, BONUS_LOG_ID } from './data/activities.js';
import { randomAnimal } from './animals.js';

export const KEY = 'dothealth.v1';
export const VERSION = 1;
const SETTINGS_DEFAULT = { reminderMinutes: 0, sound: true };

let state = null;
let storageOK = true;
let undoInfo = null;
const subs = new Set();

// ---------- 日期 ----------
const p2 = (n) => String(n).padStart(2, '0');
export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}
export function dayKeyToDate(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(key, n) { const d = dayKeyToDate(key); d.setDate(d.getDate() + n); return dayKey(d.getTime()); }
export function fmtTime(ts) { const d = new Date(ts); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; }
export function fmtDate(ts) { const d = new Date(ts); return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`; }

// ---------- 建立 / 遷移 ----------
function fresh() {
  const first = randomAnimal(null);
  return {
    version: VERSION, createdAt: new Date().toISOString(),
    logs: [], animals: [first], currentAnimalId: first.id,
    settings: { ...SETTINGS_DEFAULT },
  };
}

export function migrate(s) {
  if (!s || typeof s !== 'object') return fresh();
  let v = Number(s.version) || 1;
  // 未來版本：在此依序加入 if (v === 1) { ...; v = 2; }
  s.version = Math.max(v, VERSION);
  s.logs = Array.isArray(s.logs) ? s.logs : [];
  s.animals = Array.isArray(s.animals) ? s.animals : [];
  s.settings = { ...SETTINGS_DEFAULT, ...(s.settings || {}) };
  if (!s.animals.length) { const a = randomAnimal(null); s.animals.push(a); s.currentAnimalId = a.id; }
  if (!s.animals.some((a) => a.id === s.currentAnimalId && !a.graduatedAt)) {
    const cur = s.animals.find((a) => !a.graduatedAt);
    if (cur) s.currentAnimalId = cur.id;
    else {
      const last = s.animals[s.animals.length - 1];
      const a = randomAnimal(last && last.species); s.animals.push(a); s.currentAnimalId = a.id;
    }
  }
  s.createdAt = s.createdAt || new Date().toISOString();
  return s;
}

export function validateImport(obj) {
  if (!obj || typeof obj !== 'object') return '檔案內容不是有效的 JSON 物件';
  if (!Array.isArray(obj.logs) || !Array.isArray(obj.animals)) return '缺少 logs 或 animals 欄位';
  for (const l of obj.logs) {
    if (!l || typeof l.activityId !== 'string' || typeof l.ts !== 'number' || typeof l.points !== 'number') return '紀錄格式不正確';
  }
  for (const a of obj.animals) {
    if (!a || typeof a.id !== 'string' || typeof a.species !== 'string') return '動物資料格式不正確';
  }
  if (obj.version && Number(obj.version) > VERSION) return '此檔案來自較新版本的 App，無法匯入';
  return null;
}

// ---------- 讀寫 ----------
export function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { storageOK = false; }
  if (raw) {
    try { state = migrate(JSON.parse(raw)); } catch (e) { state = fresh(); }
  } else state = fresh();
  save();
  return state;
}
export function save() {
  if (!storageOK) return false;
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { storageOK = false; return false; }
}
export const isStorageOK = () => storageOK;
export const getState = () => state;
export function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
export function commit() { save(); subs.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } }); }
export function replaceState(s) { state = migrate(s); undoInfo = null; commit(); }
export function resetAll() { state = fresh(); undoInfo = null; commit(); }

export const getCurrentAnimal = () => state.animals.find((a) => a.id === state.currentAnimalId);
export const getAnimal = (id) => state.animals.find((a) => a.id === id);
export const setSettings = (patch) => { Object.assign(state.settings, patch); commit(); };
export function renameAnimal(id, name) { const a = getAnimal(id); if (a) { a.name = (name || '').trim().slice(0, 12) || a.name; commit(); } }

export function activityById(id) { return ACTIVITIES.find((a) => a.id === id); }
export function categoryOf(activityId) {
  if (activityId === BONUS_LOG_ID) return 'bonus';
  return (activityById(activityId) || {}).category || 'unknown';
}

// ---------- Log ----------
let seq = 0;
export function addLog(activityId, { points, ts = Date.now(), animalId = state.currentAnimalId, silent = false } = {}) {
  const act = activityById(activityId);
  const log = {
    id: 'l' + ts.toString(36) + (seq++).toString(36) + Math.floor(Math.random() * 1296).toString(36),
    activityId, category: categoryOf(activityId),
    points: points ?? (act ? act.points : 0), ts, animalId,
  };
  state.logs.push(log);
  if (!silent) commit();
  return log;
}

// 復原：由 game 在動作前設定 snapshot，5 秒內可用
export function setUndo() {
  undoInfo = { logLen: state.logs.length, animals: JSON.parse(JSON.stringify(state.animals)), currentAnimalId: state.currentAnimalId, expires: Date.now() + 5000 };
}
export function clearUndo() { undoInfo = null; }
export function canUndo() { return !!undoInfo && Date.now() < undoInfo.expires; }
export function undoLastLog() {
  if (!canUndo()) { undoInfo = null; return false; }
  state.logs.length = undoInfo.logLen;
  state.animals = undoInfo.animals;
  state.currentAnimalId = undoInfo.currentAnimalId;
  undoInfo = null;
  commit();
  return true;
}

export function getLogsByDay() {
  const m = new Map();
  for (const l of state.logs) {
    const k = dayKey(l.ts);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(l);
  }
  return m;
}
export const logsOnDay = (k) => state.logs.filter((l) => dayKey(l.ts) === k);

// ---------- 匯出入 ----------
export function exportJSON() { return JSON.stringify(state, null, 2); }
export function exportCSV() {
  const cat = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));
  cat.bonus = '每日加成';
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = ['date,time,timestamp,activityId,activityName,category,categoryName,points,animalId'];
  [...state.logs].sort((a, b) => a.ts - b.ts).forEach((l) => {
    const act = activityById(l.activityId);
    rows.push([dayKey(l.ts), fmtTime(l.ts), l.ts, l.activityId, esc(act ? act.name : (l.activityId === BONUS_LOG_ID ? '五大類全完成加成' : l.activityId)),
      l.category, esc(cat[l.category] || l.category), l.points, l.animalId || ''].join(','));
  });
  return '﻿' + rows.join('\n');
}
export function importJSON(text) {
  let obj;
  try { obj = JSON.parse(text); } catch (e) { return { ok: false, error: '無法解析 JSON' }; }
  const err = validateImport(obj);
  if (err) return { ok: false, error: err };
  replaceState(obj);
  return { ok: true, logs: state.logs.length, animals: state.animals.length };
}
