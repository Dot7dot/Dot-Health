// 計分、XP、升等、畢業、心情、每日上限
import { ACTIVITIES, CATEGORIES, BONUS_LOG_ID } from './data/activities.js';
import * as store from './store.js';
import { randomAnimal } from './animals.js';

export const LEVELS = [0, 15, 40, 80, 140];
export const BONUS_POINTS = 3;
export const MAX_LEVEL = 5;

export function levelForXP(xp) {
  let lv = 1;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i]) lv = i + 1;
  return Math.min(lv, MAX_LEVEL);
}
export function progress(animal) {
  const lv = animal.graduatedAt ? MAX_LEVEL : levelForXP(animal.xp);
  if (lv >= MAX_LEVEL) return { level: MAX_LEVEL, cur: LEVELS[4], next: LEVELS[4], pct: 100, into: 0, need: 0 };
  const base = LEVELS[lv - 1], next = LEVELS[lv];
  return { level: lv, cur: animal.xp, next, base, into: animal.xp - base, need: next - base, pct: Math.max(0, Math.min(100, ((animal.xp - base) / (next - base)) * 100)) };
}

export function moodForPoints(p) {
  if (p >= 20) return 'happy';
  if (p >= 5) return 'ok';
  if (p >= 1) return 'miss';
  return 'sleep';
}
export function todayLogs(now = Date.now()) { return store.logsOnDay(store.dayKey(now)); }
export function todayPoints(now = Date.now()) { return todayLogs(now).reduce((s, l) => s + (l.points || 0), 0); }
export const currentMood = () => moodForPoints(todayPoints());

export function todayCount(activityId) { return todayLogs().filter((l) => l.activityId === activityId).length; }
export function todayCategories() {
  const set = new Set(todayLogs().filter((l) => l.category !== 'bonus').map((l) => l.category));
  return set;
}

export function streaks() {
  const byDay = store.getLogsByDay();
  const days = [...byDay.keys()].filter((k) => byDay.get(k).some((l) => l.activityId !== BONUS_LOG_ID)).sort();
  let longest = 0, run = 0, prev = null;
  for (const d of days) {
    run = prev && store.addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run); prev = d;
  }
  const set = new Set(days);
  const today = store.dayKey();
  let cur = 0, k = set.has(today) ? today : store.addDays(today, -1);
  while (set.has(k)) { cur++; k = store.addDays(k, -1); }
  return { current: cur, longest };
}

/**
 * 記錄一次行為並套用 XP / 升等 / 畢業。
 * 回傳 { log, points, capped, bonus, leveledUp, graduated, newAnimal, animal }
 */
export function logActivity(activityId, { ts = Date.now(), withUndo = true } = {}) {
  const act = ACTIVITIES.find((a) => a.id === activityId);
  if (!act) throw new Error('unknown activity ' + activityId);
  const st = store.getState();
  const animal = store.getCurrentAnimal();
  const before = animal.level;
  const capped = todayCount(activityId) >= act.dailyCap;
  if (withUndo) store.setUndo();
  const points = capped ? 0 : act.points;
  const log = store.addLog(activityId, { points, ts, animalId: animal.id, silent: true });
  let gained = points, bonus = false;
  if (!capped) {
    const cats = todayCategories();
    const already = todayLogs().some((l) => l.activityId === BONUS_LOG_ID);
    if (!already && CATEGORIES.every((c) => cats.has(c.id))) {
      store.addLog(BONUS_LOG_ID, { points: BONUS_POINTS, ts, animalId: animal.id, silent: true });
      gained += BONUS_POINTS; bonus = true;
    }
  }
  animal.xp += gained;
  const lv = levelForXP(animal.xp);
  animal.level = lv;
  const res = { log, points, gained, capped, bonus, animal, leveledUp: lv > before ? { from: before, to: lv } : null, graduated: null, newAnimal: null };
  if (lv >= MAX_LEVEL) {
    animal.xp = Math.min(animal.xp, LEVELS[4]);
    animal.graduatedAt = ts;
    const baby = randomAnimal(animal.species);
    baby.bornAt = Date.now();
    st.animals.push(baby);
    st.currentAnimalId = baby.id;
    res.graduated = animal; res.newAnimal = baby;
    store.clearUndo();
  } else if (res.leveledUp) store.clearUndo();
  store.commit();
  return res;
}

// 除錯 / 測試用：直接加 XP（不寫 log）
export function addXPDirect(n) {
  const a = store.getCurrentAnimal();
  a.xp += n; a.level = levelForXP(a.xp);
  if (a.level >= MAX_LEVEL) {
    a.xp = LEVELS[4]; a.graduatedAt = Date.now();
    const baby = randomAnimal(a.species);
    store.getState().animals.push(baby); store.getState().currentAnimalId = baby.id;
  }
  store.commit();
}
