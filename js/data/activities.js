// 健康行為資料（占位內容）。正式內容由研究團隊提供後替換；id 一經決定永不更改。
export const CATEGORIES = [
  { id: 'eye',   name: '眼睛',     icon: '👁️', color: '#4f9dde' },
  { id: 'move',  name: '肌肉放鬆', icon: '🧘', color: '#5cb85c' },
  { id: 'hand',  name: '指關節',   icon: '✋', color: '#f0ad4e' },
  { id: 'ear',   name: '聽力',     icon: '👂', color: '#9b6bd6' },
  { id: 'knee',  name: '膝蓋',     icon: '🦵', color: '#e06c75' },
];

export const REFERENCES = {
  'placeholder-aao': {
    title: '（占位）Computer Vision Syndrome / 20-20-20 rule',
    org: 'American Academy of Ophthalmology',
    url: 'https://www.aao.org/eye-health/tips-prevention/computer-usage',
    year: 2024,
  },
  'placeholder-who': {
    title: '（占位）Deafness and hearing loss fact sheet',
    org: 'World Health Organization',
    url: 'https://www.who.int/news-room/fact-sheets/detail/deafness-and-hearing-loss',
    year: 2024,
  },
  'placeholder-nhs': {
    title: '（占位）Exercises for health and wellbeing',
    org: 'NHS',
    url: 'https://www.nhs.uk/live-well/exercise/',
    year: 2023,
  },
};

export const ACTIVITIES = [
  {
    id: 'eye-20-20-20', category: 'eye', name: '20-20-20 遠眺',
    summary: '每 20 分鐘，看 6 公尺外 20 秒',
    points: 1, durationSec: 20, dailyCap: 8, kind: 'timer',
    steps: [
      { text: '把視線移離螢幕', sec: 3 },
      { text: '注視 6 公尺以外的遠方物體', sec: 15 },
      { text: '慢慢眨眼 2 次', sec: 2 },
    ],
    why: '（占位內容）長時間近距離用眼會讓睫狀肌持續收縮，定時遠眺有助於放鬆。',
    caution: '若眼睛持續疼痛、視力改變，請諮詢眼科醫師。',
    refs: ['placeholder-aao'],
  },
  {
    id: 'eye-blink', category: 'eye', name: '刻意眨眼',
    summary: '完整、慢速地眨眼 10 次',
    points: 1, durationSec: 15, dailyCap: 8, kind: 'timer',
    steps: [
      { text: '放鬆眼周肌肉', sec: 3 },
      { text: '輕輕閉眼再睜開，重複 10 次', sec: 12 },
    ],
    why: '（占位內容）專注看螢幕時眨眼次數會減少，刻意眨眼可幫助淚膜均勻分布。',
    caution: '',
    refs: ['placeholder-aao'],
  },
  {
    id: 'move-desk-stretch', category: 'move', name: '站起來伸展',
    summary: '離開座位，全身伸展 90 秒',
    points: 2, durationSec: 90, dailyCap: 6, kind: 'timer',
    steps: [
      { text: '站起來，雙手向上伸直', sec: 30 },
      { text: '雙手叉腰，輕輕往後仰', sec: 30 },
      { text: '放鬆甩甩手腳，深呼吸', sec: 30 },
    ],
    why: '（占位內容）久坐後起身活動，可以減少肌肉僵硬並促進循環。',
    caution: '動作以不痛為原則，頭暈時請坐下休息。',
    refs: ['placeholder-nhs'],
  },
  {
    id: 'move-neck-shoulder', category: 'move', name: '肩頸放鬆',
    summary: '肩膀繞圈與頸部側伸展',
    points: 3, durationSec: 180, dailyCap: 4, kind: 'timer',
    steps: [
      { text: '肩膀向後繞大圈 10 次', sec: 45 },
      { text: '頭慢慢偏向右側，停留', sec: 45 },
      { text: '頭慢慢偏向左側，停留', sec: 45 },
      { text: '雙手互握向前推，放鬆背部', sec: 45 },
    ],
    why: '（占位內容）肩頸是久坐族最容易緊繃的區域，緩和伸展可降低不適。',
    caution: '不要用力拉扯頸部；若有手麻或劇痛，請就醫評估。',
    refs: ['placeholder-nhs'],
  },
  {
    id: 'hand-tendon-glide', category: 'hand', name: '手指肌腱滑動',
    summary: '五個手勢輪流做一次',
    points: 2, durationSec: 60, dailyCap: 6, kind: 'timer',
    steps: [
      { text: '手指伸直併攏', sec: 12 },
      { text: '彎成鉤狀', sec: 12 },
      { text: '握成拳頭', sec: 12 },
      { text: '指尖碰掌心（平拳）', sec: 12 },
      { text: '回到伸直，放鬆', sec: 12 },
    ],
    why: '（占位內容）肌腱滑動練習讓手指肌腱在腱鞘內順暢滑動。',
    caution: '疼痛、紅腫時請停止並就醫。',
    refs: ['placeholder-nhs'],
  },
  {
    id: 'hand-wrist-stretch', category: 'hand', name: '手腕伸展',
    summary: '手腕上下伸展各 15 秒',
    points: 2, durationSec: 60, dailyCap: 6, kind: 'timer',
    steps: [
      { text: '右手向前伸直，掌心向下，左手把手指往下壓', sec: 15 },
      { text: '掌心向上，左手把手指往下壓', sec: 15 },
      { text: '換左手，掌心向下', sec: 15 },
      { text: '換左手，掌心向上', sec: 15 },
    ],
    why: '（占位內容）規律伸展前臂屈伸肌群，可舒緩打字與滑鼠造成的緊繃。',
    caution: '伸展有輕微拉扯感即可，不要硬拉。',
    refs: ['placeholder-nhs'],
  },
  {
    id: 'ear-quiet-break', category: 'ear', name: '安靜耳朵休息',
    summary: '拿下耳機，安靜 5 分鐘',
    points: 3, durationSec: 300, dailyCap: 3, kind: 'timer',
    steps: [{ text: '拿下耳機，待在安靜的地方，讓耳朵休息', sec: 300 }],
    why: '（占位內容）持續暴露於高音量會增加聽力受損風險，定時休息可降低累積暴露。',
    caution: '',
    refs: ['placeholder-who'],
  },
  {
    id: 'ear-volume-check', category: 'ear', name: '音量檢查',
    summary: '確認耳機音量在 60% 以下',
    points: 1, durationSec: 0, dailyCap: 3, kind: 'check',
    steps: ['檢查耳機音量是否低於最大音量的 60%', '若旁人能聽見你的耳機聲音，請再調小一點'],
    why: '（占位內容）「60/60」是常見的耳機使用建議之一：音量不超過 60%、連續不超過 60 分鐘。',
    caution: '',
    refs: ['placeholder-who'],
  },
  {
    id: 'knee-chair-stand', category: 'knee', name: '椅子起立',
    summary: '坐到站 10 次，鍛鍊大腿肌力',
    points: 4, durationSec: 180, dailyCap: 3, kind: 'timer',
    steps: [
      { text: '坐在椅子前緣，雙手交叉胸前', sec: 15 },
      { text: '慢慢站起、慢慢坐下，重複 10 次', sec: 150 },
      { text: '站著甩甩腿，放鬆', sec: 15 },
    ],
    why: '（占位內容）股四頭肌力量有助於分擔膝關節負荷。',
    caution: '膝蓋疼痛加劇時請停止；有膝關節疾病者請先諮詢專業人員。',
    refs: ['placeholder-nhs'],
  },
  {
    id: 'knee-quad-set', category: 'knee', name: '股四頭肌收縮',
    summary: '坐姿膝蓋打直，繃緊大腿',
    points: 3, durationSec: 120, dailyCap: 4, kind: 'timer',
    steps: [
      { text: '坐著，右腳向前伸直，繃緊大腿，停留 5 秒', sec: 60 },
      { text: '換左腳，繃緊大腿，停留 5 秒', sec: 60 },
    ],
    why: '（占位內容）低衝擊的等長收縮，適合辦公室中進行。',
    caution: '',
    refs: ['placeholder-nhs'],
  },
];

export const BONUS_LOG_ID = 'bonus-all-categories';
export const DISCLAIMER = '本內容為一般衛教資訊，不能取代醫療專業建議';
