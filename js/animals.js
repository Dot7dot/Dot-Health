// 動物：物種/特徵定義、隨機生成、程式繪製 SVG（圓潤 Q 版）
export const SPECIES = {
  chicken: { name: '小雞', emoji: '🐔' },
  pig:     { name: '小豬', emoji: '🐷' },
  sheep:   { name: '綿羊', emoji: '🐑' },
  rabbit:  { name: '兔子', emoji: '🐰' },
  cow:     { name: '乳牛', emoji: '🐮' },
};
export const SPECIES_LIST = Object.keys(SPECIES);

export const COLORS = [
  { id: 'cream',   name: '奶油', main: '#fff0c9', belly: '#fffaf0', accent: '#f0bd72' },
  { id: 'caramel', name: '焦糖', main: '#e9a65c', belly: '#f8d9a8', accent: '#b2662a' },
  { id: 'cocoa',   name: '可可', main: '#a06f4f', belly: '#d8b894', accent: '#5e3b27' },
  { id: 'slate',   name: '灰藍', main: '#a3b6cc', belly: '#e0e9f2', accent: '#5f7899' },
  { id: 'pink',    name: '粉紅', main: '#f8b9ca', belly: '#ffe3ec', accent: '#e07a9b' },
  { id: 'mint',    name: '薄荷', main: '#a9e0c4', belly: '#e4f8ed', accent: '#58b088' },
];
export const FURS = [
  { id: 'short', name: '短毛' },
  { id: 'fluffy', name: '蓬鬆' },
  { id: 'long', name: '長毛' },
];
export const ACCESSORIES = [
  { id: 'none', name: '無配件' },
  { id: 'hat', name: '草帽' },
  { id: 'scarf', name: '領巾' },
  { id: 'bow', name: '蝴蝶結' },
  { id: 'glasses', name: '圓框眼鏡' },
  { id: 'wreath', name: '花圈' },
  { id: 'bell', name: '鈴鐺' },
];

export const MOODS = {
  happy: { emoji: '😄', text: '開心' },
  ok:    { emoji: '🙂', text: '普通' },
  miss:  { emoji: '🥺', text: '想你' },
  sleep: { emoji: '💤', text: '打瞌睡' },
};

const NAMES = ['麻糬', '布丁', '小米', '湯圓', '芋圓', '奶茶', '餅乾', '年糕', '包子', '豆花', '饅頭', '小橘',
  '毛毛', '糯米', '栗子', '球球', '米粒', '可可', '花捲', '蛋捲', '抹茶', '紅豆', '珍珠', '團團', '阿福',
  '波波', '嚕嚕', '芝麻', '小圓', '雪球', '糖糖', '奶油', '地瓜', '花生', '肉鬆', '蘋果'];

function rndInt(n) {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % n;
  } catch (e) { return Math.floor(Math.random() * n); }
}
const pick = (arr) => arr[rndInt(arr.length)];

export function randomName() { return pick(NAMES); }

export function randomAnimal(prevSpecies) {
  const species = pick(SPECIES_LIST.filter((s) => s !== prevSpecies));
  const id = 'a' + Date.now().toString(36) + rndInt(1e6).toString(36);
  return {
    id, species,
    color: pick(COLORS).id,
    fur: pick(FURS).id,
    accessory: pick(ACCESSORIES).id,
    shiny: rndInt(16) === 0,
    name: randomName(),
    xp: 0, level: 1,
    bornAt: Date.now(), graduatedAt: null,
  };
}

export function levelScale(level) { return 0.6 + 0.1 * (Math.max(1, Math.min(5, level)) - 1); }

export function describeAnimal(a) {
  const c = COLORS.find((x) => x.id === a.color);
  const f = FURS.find((x) => x.id === a.fur);
  const ac = ACCESSORIES.find((x) => x.id === a.accessory);
  return {
    species: SPECIES[a.species]?.name || a.species,
    color: c?.name || a.color, fur: f?.name || a.fur, accessory: ac?.name || a.accessory,
  };
}

// ---------- 色彩工具 ----------
function rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function hex(r) { return '#' + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); }
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); }
export function shade(c, amt) { return amt < 0 ? mix(c, '#000000', -amt) : mix(c, '#ffffff', amt); }

const EYE = '#2b1d1a';

// ---------- 表情 ----------
function eyes(mood, y, xs) {
  return xs.map((x) => {
    if (mood === 'happy') return `<path d="M${x - 8} ${y + 4} Q${x} ${y - 9} ${x + 8} ${y + 4}" fill="none" stroke="${EYE}" stroke-width="4.5" stroke-linecap="round"/>`;
    if (mood === 'sleep') return `<path d="M${x - 8} ${y} Q${x} ${y + 8} ${x + 8} ${y}" fill="none" stroke="${EYE}" stroke-width="4" stroke-linecap="round"/>`;
    if (mood === 'miss') return `<ellipse cx="${x}" cy="${y + 1}" rx="10" ry="11.5" fill="${EYE}"/><circle cx="${x - 3.5}" cy="${y - 3}" r="4.4" fill="#fff"/><circle cx="${x + 3.5}" cy="${y + 4.5}" r="2.2" fill="#fff"/><path d="M${x + 6} ${y + 11} q3 5 0 8 q-3 -3 0 -8z" fill="#8fd3ff" opacity=".85"/>`;
    return `<ellipse cx="${x}" cy="${y}" rx="7.5" ry="9.5" fill="${EYE}"/><circle cx="${x - 2.6}" cy="${y - 3.6}" r="3.1" fill="#fff"/><circle cx="${x + 2.6}" cy="${y + 3}" r="1.5" fill="#fff"/>`;
  }).join('');
}
function mouth(mood, cx, cy, ol, k = 1) {
  const t = `transform="translate(${cx} ${cy}) scale(${k})"`;
  if (mood === 'happy') return `<g ${t}><path d="M-10 0 Q0 17 10 0 Z" fill="#8a2f3d" stroke="${ol}" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="0" cy="9" rx="5" ry="3.2" fill="#ff8fa3"/></g>`;
  if (mood === 'miss') return `<g ${t}><path d="M-6 4 Q0 -4 6 4" fill="none" stroke="${ol}" stroke-width="3" stroke-linecap="round"/></g>`;
  if (mood === 'sleep') return `<g ${t}><ellipse cx="0" cy="3" rx="3.4" ry="4.2" fill="#8a2f3d" stroke="${ol}" stroke-width="2"/></g>`;
  return `<g ${t}><path d="M-7 0 Q0 8 7 0" fill="none" stroke="${ol}" stroke-width="3" stroke-linecap="round"/></g>`;
}

// ---------- 毛的外輪廓 ----------
function furRing(cx, cy, rx, ry, kind, fill, ol, sw, part, strong) {
  if (kind === 'short' && !strong) return '';
  const st = `fill="${fill}" stroke="${ol}" stroke-width="${sw}" stroke-linejoin="round"`;
  let s = '';
  if (kind === 'short' || kind === 'fluffy') {
    const n = (part === 'head' ? 13 : 11) + (kind === 'short' ? 4 : 0);
    const r = (kind === 'short' ? 7 : (part === 'head' ? 11.5 : 11));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.2;
      s += `<circle cx="${(cx + rx * Math.cos(a) * 0.97).toFixed(1)}" cy="${(cy + ry * Math.sin(a) * 0.97).toFixed(1)}" r="${r}" ${st}/>`;
    }
  } else {
    const n = part === 'head' ? 18 : 13;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.1;
      const ca = Math.cos(a), sa = Math.sin(a);
      if (part === 'head' && sa > 0.45) continue; // 下巴不長毛，避免雜亂
      const bx = cx + rx * ca * 0.92, by = cy + ry * sa * 0.92;
      const droop = sa > 0 ? 16 : 7;
      const tx = cx + rx * ca * 1.22, ty = cy + ry * sa * 1.22 + droop;
      const dx = tx - bx, dy = ty - by, L = Math.hypot(dx, dy) || 1;
      const px = -dy / L, py = dx / L; // 垂直方向
      const w = 10, w2 = 4.5;
      const f = (v) => v.toFixed(1);
      s += `<path d="M${f(bx + px * w)} ${f(by + py * w)} L${f(tx + px * w2)} ${f(ty + py * w2)} L${f(tx - px * w2)} ${f(ty - py * w2)} L${f(bx - px * w)} ${f(by - py * w)} Z" ${st}/>`;
    }
  }
  return s;
}

function star(x, y, s, d) {
  return `<path class="sparkle" style="animation-delay:${d}s" d="M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z" fill="#ffd84a" stroke="#fff6c2" stroke-width="1"/>`;
}

// ---------- 配件 ----------
function accessory(id, ol, sp) {
  const lw = `stroke="${ol}" stroke-width="3" stroke-linejoin="round"`;
  switch (id) {
    case 'hat': return `<g><ellipse cx="100" cy="62" rx="56" ry="10" fill="#f0cf80" ${lw}/><path d="M68 62 Q66 28 100 28 Q134 28 132 62 Q100 70 68 62Z" fill="#f7dd9a" ${lw}/><path d="M69 55 Q100 64 131 55 L132 62 Q100 70 68 62Z" fill="#e4684f" ${lw}/><path d="M80 40 q6 -6 12 -8" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/></g>`;
    case 'scarf': return `<g><path d="M60 138 Q100 170 140 138 L136 154 Q100 184 64 154Z" fill="#e4684f" ${lw}/><path d="M118 160 L132 186 L116 188 L108 166Z" fill="#cf5640" ${lw}/><path d="M72 150 l8 4 M92 160 l6 3 M112 158 l7 -3" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".7"/></g>`;
    case 'bow': return `<g transform="translate(128 58) rotate(14)"><path d="M0 0 L-24 -15 Q-30 0 -24 15Z" fill="#ff7fa8" ${lw}/><path d="M0 0 L24 -15 Q30 0 24 15Z" fill="#ff7fa8" ${lw}/><circle r="7.5" fill="#ff5c90" ${lw}/><circle cx="-2.5" cy="-2.5" r="2" fill="#fff" opacity=".8"/></g>`;
    case 'glasses': return `<g fill="rgba(255,255,255,.28)" stroke="#3a2a22" stroke-width="3.5"><circle cx="76" cy="${sp.eyeY}" r="16"/><circle cx="124" cy="${sp.eyeY}" r="16"/><path d="M92 ${sp.eyeY - 2} Q100 ${sp.eyeY - 7} 108 ${sp.eyeY - 2}" fill="none"/><path d="M60 ${sp.eyeY - 2} L50 ${sp.eyeY - 6} M140 ${sp.eyeY - 2} L150 ${sp.eyeY - 6}" fill="none" stroke-linecap="round"/></g>`;
    case 'wreath': {
      const cols = ['#ff8fb1', '#fff1a8', '#ffffff', '#ffb27a', '#ff8fb1', '#fff1a8', '#ffffff'];
      let s = '<g>';
      for (let i = 0; i < 7; i++) {
        const a = (200 + i * 23.3) * Math.PI / 180;
        const x = 100 + 55 * Math.cos(a), y = 101 + 49 * Math.sin(a);
        s += `<ellipse cx="${(x + 7 * Math.cos(a + 1.6)).toFixed(1)}" cy="${(y + 7 * Math.sin(a + 1.6)).toFixed(1)}" rx="8" ry="4.5" fill="#7bc96f" stroke="${ol}" stroke-width="1.8" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      }
      for (let i = 0; i < 7; i++) {
        const a = (200 + i * 23.3) * Math.PI / 180;
        const x = 100 + 55 * Math.cos(a), y = 101 + 49 * Math.sin(a);
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7.5" fill="${cols[i]}" stroke="${ol}" stroke-width="2"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="#f5b52c"/>`;
      }
      return s + '</g>';
    }
    case 'bell': return `<g><path d="M62 140 Q100 166 138 140 L135 150 Q100 176 65 150Z" fill="#d8534f" ${lw}/><circle cx="100" cy="166" r="10" fill="#ffd45a" ${lw}/><path d="M90 167 h20 M100 167 v7" stroke="#b98a1d" stroke-width="2.2" stroke-linecap="round"/><circle cx="96" cy="162" r="2.4" fill="#fff" opacity=".8"/></g>`;
    default: return '';
  }
}

// ---------- 物種繪製 ----------
const HEAD = { cx: 100, cy: 100, rx: 58, ry: 48 };
const BODY = { cx: 100, cy: 152, rx: 46, ry: 30 };

function build(a, mood) {
  const pal = COLORS.find((c) => c.id === a.color) || COLORS[0];
  const { main, belly, accent } = pal;
  const gold = '#f2b705';
  const ol = a.shiny ? gold : shade(main, -0.52);
  const sw = a.shiny ? 3.6 : 3;
  const E = (cx, cy, rx, ry, fill, more = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${ol}" stroke-width="${sw}" ${more}/>`;
  const sp = { eyeY: 94 };
  let legs = '', back = '', bodyP = '', headBack = '', headP = '', face = '';
  const legSt = (x, col, w = 16) => `<rect x="${x - w / 2}" y="164" width="${w}" height="24" rx="${w / 2}" fill="${col}" stroke="${ol}" stroke-width="${sw}"/>`;
  const fur = a.fur;
  const hx = HEAD.cx, hy = HEAD.cy;

  const bodyFur = furRing(BODY.cx, BODY.cy, BODY.rx, BODY.ry, fur, main, ol, sw, 'body', false);
  const headFur = furRing(hx, hy, HEAD.rx, HEAD.ry, fur, main, ol, sw, 'head', false);
  const baseBody = bodyFur + E(BODY.cx, BODY.cy, BODY.rx, BODY.ry, main) + `<ellipse cx="100" cy="160" rx="27" ry="17" fill="${belly}"/>`;
  const baseHead = headFur + E(hx, hy, HEAD.rx, HEAD.ry, main) + `<ellipse cx="78" cy="72" rx="16" ry="7" fill="#fff" opacity=".28" transform="rotate(-22 78 72)"/>`;
  const cheeks = (y = 112) => `<circle cx="60" cy="${y}" r="8.5" fill="#ff8fa8" opacity=".5"/><circle cx="140" cy="${y}" r="8.5" fill="#ff8fa8" opacity=".5"/>`;

  switch (a.species) {
    case 'chicken': {
      legs = ['l', 'r'].map((s, i) => { const x = i ? 120 : 80; return `<g class="leg leg-${s}"><path d="M${x} 170 V186 M${x - 9} 189 L${x} 186 L${x + 9} 189 M${x} 186 V190" fill="none" stroke="#f0a030" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g>`; }).join('');
      back = `<g>${E(150, 136, 8, 20, accent, 'transform="rotate(32 150 136)"')}${E(154, 150, 8, 18, shade(accent, .2), 'transform="rotate(58 154 150)"')}</g>`;
      bodyP = baseBody + E(55, 150, 13, 19, shade(main, -0.1), 'transform="rotate(-14 55 150)"') + E(145, 150, 13, 19, shade(main, -0.1), 'transform="rotate(14 145 150)"');
      headBack = [88, 100, 112].map((x, i) => `<circle cx="${x}" cy="${i === 1 ? 50 : 55}" r="${i === 1 ? 11 : 9}" fill="#ee4d52" stroke="${ol}" stroke-width="${sw}"/>`).join('');
      headP = baseHead;
      face = cheeks(108) + `<ellipse cx="100" cy="128" rx="5.5" ry="8" fill="#ee4d52" stroke="${ol}" stroke-width="2.5"/>`
        + `<path d="M90 106 Q100 100 110 106 L100 124 Z" fill="#ffb347" stroke="${ol}" stroke-width="3" stroke-linejoin="round"/>`
        + (mood === 'happy' ? `<path d="M93 112 Q100 118 107 112" stroke="#b7462a" stroke-width="2.5" fill="none" stroke-linecap="round"/>` : '')
        + eyes(mood, sp.eyeY, [74, 126]);
      break;
    }
    case 'pig': {
      const snout = mix(accent, '#ffb3c4', .55);
      legs = [80, 120].map((x, i) => `<g class="leg leg-${i ? 'r' : 'l'}">${legSt(x, shade(main, -0.06))}</g>`).join('');
      back = `<path d="M142 148 q16 -6 12 -17 q-4 -9 -13 -3 q-6 5 1 8" fill="none" stroke="${ol}" stroke-width="5" stroke-linecap="round"/><path d="M142 148 q16 -6 12 -17 q-4 -9 -13 -3 q-6 5 1 8" fill="none" stroke="${main}" stroke-width="2.4" stroke-linecap="round"/>`;
      bodyP = baseBody;
      headBack = `<path d="M44 78 L52 40 L88 58 Z" fill="${main}" stroke="${ol}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M54 66 L58 50 L74 58 Z" fill="${snout}"/><path d="M156 78 L148 40 L112 58 Z" fill="${main}" stroke="${ol}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M146 66 L142 50 L126 58 Z" fill="${snout}"/>`;
      headP = baseHead;
      sp.eyeY = 90;
      face = cheeks(112) + E(100, 112, 25, 18, snout) + `<ellipse cx="91" cy="112" rx="3.4" ry="5.5" fill="${shade(accent, -0.35)}"/><ellipse cx="109" cy="112" rx="3.4" ry="5.5" fill="${shade(accent, -0.35)}"/>`
        + mouth(mood, 100, 134, ol, .75) + eyes(mood, sp.eyeY, [72, 128]);
      break;
    }
    case 'sheep': {
      const face_ = mix(accent, '#ffffff', .4);
      const legC = shade(accent, -0.3);
      legs = [80, 120].map((x, i) => `<g class="leg leg-${i ? 'r' : 'l'}">${legSt(x, legC, 14)}</g>`).join('');
      bodyP = furRing(BODY.cx, BODY.cy, BODY.rx + 3, BODY.ry + 2, fur === 'short' ? 'fluffy' : fur, main, ol, sw, 'body', true)
        + E(BODY.cx, BODY.cy, BODY.rx + 3, BODY.ry + 2, main);
      headBack = E(56, 104, 15, 8, face_, 'transform="rotate(24 56 104)"') + E(144, 104, 15, 8, face_, 'transform="rotate(-24 144 104)"')
        + (fur === 'long' ? `<circle cx="58" cy="96" r="13" fill="${main}" stroke="${ol}" stroke-width="${sw}"/><circle cx="142" cy="96" r="13" fill="${main}" stroke="${ol}" stroke-width="${sw}"/><circle cx="62" cy="116" r="10" fill="${main}" stroke="${ol}" stroke-width="${sw}"/><circle cx="138" cy="116" r="10" fill="${main}" stroke="${ol}" stroke-width="${sw}"/>` : '');
      headP = E(100, 104, 44, 42, face_);
      const r = fur === 'short' ? 13 : fur === 'fluffy' ? 16 : 17;
      const pts = [[70, 70], [86, 62], [102, 60], [118, 62], [132, 70], [60, 84], [140, 84]];
      sp.eyeY = 100;
      face = pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${main}" stroke="${ol}" stroke-width="${sw}"/>`).join('')
        + pts.slice(0, 5).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r - 1}" fill="${main}"/>`).join('')
        + `<circle cx="64" cy="115" r="8" fill="#ff8fa8" opacity=".5"/><circle cx="136" cy="115" r="8" fill="#ff8fa8" opacity=".5"/>`
        + eyes(mood, sp.eyeY, [80, 120]) + `<ellipse cx="100" cy="114" rx="5" ry="3.6" fill="${shade(accent, -0.4)}"/>` + mouth(mood, 100, 121, ol, .75);
      break;
    }
    case 'rabbit': {
      const inner = mix(accent, '#ffc4d4', .55);
      legs = [78, 122].map((x, i) => `<g class="leg leg-${i ? 'r' : 'l'}"><ellipse cx="${x}" cy="182" rx="15" ry="8" fill="${shade(main, -0.04)}" stroke="${ol}" stroke-width="${sw}"/></g>`).join('');
      back = `<circle cx="146" cy="162" r="13" fill="#fff" stroke="${ol}" stroke-width="${sw}"/>`;
      bodyP = baseBody;
      headBack = fur === 'long'
        ? `${E(48, 104, 13, 34, main, 'transform="rotate(16 48 104)"')}<ellipse cx="49" cy="106" rx="6" ry="24" fill="${inner}" transform="rotate(16 49 106)"/>${E(152, 104, 13, 34, main, 'transform="rotate(-16 152 104)"')}<ellipse cx="151" cy="106" rx="6" ry="24" fill="${inner}" transform="rotate(-16 151 106)"/>`
        : `${E(78, 40, 13, 38, main, 'transform="rotate(-7 78 40)"')}<ellipse cx="78" cy="44" rx="6" ry="26" fill="${inner}" transform="rotate(-7 78 44)"/>${E(122, 40, 13, 38, main, 'transform="rotate(7 122 40)"')}<ellipse cx="122" cy="44" rx="6" ry="26" fill="${inner}" transform="rotate(7 122 44)"/>`;
      headP = baseHead;
      sp.eyeY = 96;
      face = cheeks(112) + `<path d="M62 106 L36 100 M62 112 L36 114 M138 106 L164 100 M138 112 L164 114" stroke="${ol}" stroke-width="2" stroke-linecap="round" opacity=".55"/>`
        + eyes(mood, sp.eyeY, [76, 124]) + `<ellipse cx="100" cy="106" rx="6" ry="4.4" fill="#ff8fa8" stroke="${ol}" stroke-width="2"/>` + mouth(mood, 100, 112, ol, .8);
      break;
    }
    case 'cow': {
      const patch = accent;
      legs = [80, 120].map((x, i) => `<g class="leg leg-${i ? 'r' : 'l'}">${legSt(x, shade(main, -0.05))}<rect x="${x - 8}" y="180" width="16" height="8" rx="4" fill="${shade(accent, -0.3)}"/></g>`).join('');
      back = `<path d="M146 142 Q166 150 160 174" fill="none" stroke="${ol}" stroke-width="4" stroke-linecap="round"/><ellipse cx="160" cy="178" rx="6" ry="9" fill="${patch}" stroke="${ol}" stroke-width="2.5"/>`;
      bodyP = baseBody + `<ellipse cx="124" cy="150" rx="16" ry="11" fill="${patch}"/><ellipse cx="72" cy="164" rx="10" ry="7" fill="${patch}"/>`;
      headBack = `<path d="M62 60 Q52 38 70 36 Q70 50 78 56Z" fill="#f6e8c8" stroke="${ol}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M138 60 Q148 38 130 36 Q130 50 122 56Z" fill="#f6e8c8" stroke="${ol}" stroke-width="${sw}" stroke-linejoin="round"/>`
        + E(38, 88, 19, 11, main, 'transform="rotate(-18 38 88)"') + `<ellipse cx="40" cy="88" rx="11" ry="5.5" fill="#ffc4cd" transform="rotate(-18 40 88)"/>`
        + E(162, 88, 19, 11, main, 'transform="rotate(18 162 88)"') + `<ellipse cx="160" cy="88" rx="11" ry="5.5" fill="#ffc4cd" transform="rotate(18 160 88)"/>`;
      headP = baseHead + `<ellipse cx="72" cy="74" rx="17" ry="13" fill="${patch}" transform="rotate(-20 72 74)"/>`;
      sp.eyeY = 92;
      face = cheeks(108) + E(100, 120, 32, 21, '#fbd0d4') + `<ellipse cx="90" cy="118" rx="3.6" ry="5.2" fill="#b8606d"/><ellipse cx="110" cy="118" rx="3.6" ry="5.2" fill="#b8606d"/>`
        + mouth(mood, 100, 130, ol, .7) + eyes(mood, sp.eyeY, [70, 130]);
      break;
    }
  }

  const acc = accessory(a.accessory, ol, sp);
  const accIsFace = a.accessory === 'glasses';
  const stars = a.shiny ? star(26, 70, 10, 0) + star(176, 108, 8, .5) + star(34, 150, 7, 1) + star(150, 34, 7, 1.4) + star(100, 20, 6, .9) : '';
  return { legs, back, bodyP, headBack, headP, face: face + (accIsFace ? acc : ''), acc: accIsFace ? '' : acc, stars };
}

/**
 * renderAnimal(animal, { size, level, mood, facing, bubble, walking })
 * 回傳 SVGElement。size 是 Lv5 時的像素寬高；實際尺寸依等級縮放。
 */
export function renderAnimal(animal, opts = {}) {
  const { size = 120, level = animal.level || 1, mood = 'ok', facing = 1, bubble = true, walking = false } = opts;
  const p = build(animal, mood);
  const px = Math.round(size * levelScale(level));
  const m = MOODS[mood] || MOODS.ok;
  const flip = facing < 0 ? 'transform="translate(200 0) scale(-1 1)"' : '';
  const bub = bubble ? `<g class="bubble"><circle cx="150" cy="58" r="3" fill="#fff" stroke="#e8dcc4"/><circle cx="158" cy="46" r="5" fill="#fff" stroke="#e8dcc4"/><circle cx="170" cy="26" r="21" fill="#fff" stroke="#e8dcc4" stroke-width="2.5"/><text x="170" y="34" font-size="22" text-anchor="middle">${m.emoji}</text></g>` : '';
  const html = `<svg class="animal${animal.shiny ? ' shiny' : ''}${walking ? ' walk' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${px}" height="${px}" role="img" aria-label="${(animal.name || '').replace(/"/g, '')}（${SPECIES[animal.species]?.name || ''}）" style="--d:${(-Math.random() * 2).toFixed(2)}s">`
    + `<ellipse cx="100" cy="190" rx="${52 - 2}" ry="6.5" fill="#000" opacity=".16"/>`
    + `<g ${flip}>${p.legs}<g class="bob">${p.back}${p.bodyP}${p.headBack}${p.headP}<g class="face">${p.face}</g>${p.acc}${p.stars}</g></g>${bub}</svg>`;
  const t = document.createElement('div');
  t.innerHTML = html;
  return t.firstElementChild;
}
