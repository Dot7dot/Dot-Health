// 打卡流程：記錄 → 飄字 → 升等/畢業慶祝 → 命名 → 復原提示
import * as game from './game.js';
import * as store from './store.js';
import { renderAnimal, randomName, SPECIES } from './animals.js';
import { h, toast, floatText, celebrate, promptName } from './ui.js';

export function animalNode(a, size = 190, opts = {}) {
  return renderAnimal(a, { size, level: a.level, mood: game.currentMood(), ...opts });
}

export async function renameFlow(animal) {
  const name = await promptName({ title: `幫「${animal.name}」改名`, value: animal.name, rerollFn: randomName });
  if (name) store.renameAnimal(animal.id, name);
}

export async function logAndCelebrate(activityId, origin) {
  const act = store.activityById(activityId);
  const rect = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : null; // 先取位置（記錄後畫面會重繪）
  const res = game.logActivity(activityId);
  floatText(res.capped ? '已達今日上限' : `+${res.gained} XP`, rect ? { getBoundingClientRect: () => rect } : null, res.capped ? 'capped' : '');
  if (res.bonus) setTimeout(() => toast('🎉 五大類都完成了！每日加成 +3 XP', { ms: 3500 }), 700);
  if (res.graduated) {
    const g = res.graduated;
    await celebrate({
      title: `🎓 ${g.name} 畢業啦！`,
      subtitle: `${SPECIES[g.species].name}「${g.name}」已達 Lv.5，搬到農場快樂生活。`,
      node: renderAnimal(g, { size: 210, level: 5, mood: 'happy' }), button: '去迎接新寶寶', sound: 'level',
    });
    const baby = res.newAnimal;
    await celebrate({
      title: '🥚 新寶寶孵化了！', subtitle: `是一隻${SPECIES[baby.species].name}！`,
      node: renderAnimal(baby, { size: 210, level: 1, mood: 'happy' }), button: '幫牠取名字', sound: 'done',
    });
    const name = await promptName({ title: '幫新寶寶取名字', value: baby.name, rerollFn: randomName });
    if (name) store.renameAnimal(baby.id, name);
  } else if (res.leveledUp) {
    await celebrate({
      title: `⭐ ${res.animal.name} 升到 Lv.${res.leveledUp.to}！`,
      subtitle: '再接再厲，牠正在慢慢長大。',
      node: renderAnimal(res.animal, { size: 210, level: res.leveledUp.to, mood: 'happy' }),
    });
  } else {
    toast(res.capped ? `已記錄「${act.name}」（今日已達計分上限，不加分）` : `已記錄「${act.name}」+${res.gained} XP`, { action: { label: '復原', fn: () => { store.undoLastLog(); } }, ms: 5000 });
  }
  return res;
}
