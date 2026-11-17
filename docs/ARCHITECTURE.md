# Dot Health 架構規格（Architecture Spec）

> 一邊做健康行為、一邊養農場動物的互動式遊戲。手機優先、可加到主畫面（PWA）、部署於 GitHub Pages。
> 本文件是所有實作者（coding agent）的唯一規格來源。介面文字一律使用**繁體中文**。

## 1. 技術選型

| 項目 | 決定 | 理由 |
|---|---|---|
| 框架 | 原生 HTML/CSS/JS（ES Modules），**無建置步驟、無外部套件、無 CDN** | GitHub Pages 直接服務；離線可用；長期不壞 |
| 儲存 | `localStorage`（key: `dothealth.v1`），所有讀寫包 try/catch | 單人使用，資料留在本機 |
| 備份 | 匯出 JSON / CSV、匯入 JSON | localStorage 可能被清除，量化資料不能遺失 |
| PWA | `manifest.webmanifest` + `sw.js`（cache-first 靜態檔）+ PNG icons（192/512/apple-touch-icon 180） | 加到 iOS/Android 主畫面 |
| 路徑 | **全部用相對路徑**（站點會在 `/Dot-Health/` 子路徑下） | GitHub Pages 專案站 |
| 圖表 | 手刻 SVG | 無依賴 |
| 動物美術 | 程式產生的 SVG（參數化），不用圖檔 | 方便排列組合變化 |

## 2. 目錄結構

```
index.html                 單頁應用殼 + 底部分頁列
manifest.webmanifest
sw.js                      Service worker（版本化 cache 名稱）
icons/                     icon-192.png, icon-512.png, apple-touch-icon.png, icon.svg
css/styles.css
js/app.js                  進入點：分頁路由、初始化、事件總線
js/store.js                狀態讀寫、遷移、匯出入、log API
js/game.js                 計分、XP、升等、畢業、心情、每日上限
js/animals.js              物種/特徵定義、隨機生成、SVG 繪製
js/farm.js                 農場場景、動物漫遊動畫、點擊查看
js/stats.js                紀錄頁：統計計算 + SVG 圖表
js/timer.js                引導式計時器（逐步指示 + 倒數 + 完成後記錄）
js/data/activities.js      健康行為資料（含 reference）— 由研究結果填入
docs/ARCHITECTURE.md       本文件
docs/research/*.md         健康知識研究原稿（含出處）
.github/workflows/pages.yml  push 到 main 時部署 GitHub Pages
```

## 3. 健康行為資料模型（`js/data/activities.js`）

```js
export const CATEGORIES = [
  { id: 'eye',   name: '眼睛',     icon: '👁️', color: '#4f9dde' },
  { id: 'move',  name: '肌肉放鬆', icon: '🧘', color: '#5cb85c' },
  { id: 'hand',  name: '指關節',   icon: '✋', color: '#f0ad4e' },
  { id: 'ear',   name: '聽力',     icon: '👂', color: '#9b6bd6' },
  { id: 'knee',  name: '膝蓋',     icon: '🦵', color: '#e06c75' },
];

export const REFERENCES = {
  // refId: { title, org, url, year? }
};

export const MYTHS = [ { category, title, body, refs } ]; // 迷思與不建議（refs 可為空＝「未找到證據」）

export const ACTIVITIES = [
  {
    id: 'eye-20-20-20',          // kebab-case，永不更改（log 以此為鍵）
    category: 'eye',
    name: '20-20-20 遠眺',
    summary: '一句話說明',
    points: 1,                   // 1–5，見 §4 計分準則
    durationSec: 20,             // 引導計時器時長；0 表示不需計時（打卡型）
    dailyCap: 8,                 // 每日最多可計分次數
    kind: 'timer' | 'check',     // timer=引導計時；check=直接打卡
    steps: ['步驟一', '步驟二'],  // 計時器逐步顯示；每步可帶秒數：{ text, sec }
    why: '為什麼有效（2–3 句，依據文獻）',
    caution: '注意事項（可空）',
    refs: ['aao-2020'],          // 對應 REFERENCES 的 key，至少一筆
    evidence: 'weak',            // 'strong' | 'medium' | 'weak'（研究的「證據強度」；「弱至中」取較低者 → weak）
    note: '誠實性備註（可空）',   // 例：時長/次數為遊戲設定、研究對象與使用者不同、來源間說法不一致
  },
];
```

## 4. 計分準則（1–5 分）

| 分數 | 準則 | 例 |
|---|---|---|
| 1 | < 1 分鐘、零門檻 | 20-20-20 遠眺、刻意眨眼 |
| 2 | 1–3 分鐘、簡單動作 | 站起來伸展、手指肌腱滑動 |
| 3 | 3–5 分鐘、需一點專注或多個動作 | 一組辦公室伸展操、閉眼休息 5 分鐘 |
| 4 | 5–10 分鐘、需離開座位或成套動作 | 10 分鐘走路、膝蓋肌力一組 |
| 5 | ≥ 10 分鐘或較費力的完整訓練 | 15–20 分鐘快走、完整下肢肌力訓練 |

每項行為都有 `dailyCap`，避免灌分。

## 5. 養成系統（`js/game.js`）

- **XP = 行為分數**，記錄一次即加給「目前養的動物」。
- **等級門檻（累積 XP）**：`LEVELS = [0, 15, 40, 80, 140]` → Lv1..Lv5。約 4–6 天養滿一隻。
- **滿 5 等即畢業**：標記 `graduatedAt`，留在農場；立即孵出新寶寶（隨機特徵），顯示慶祝動畫與「命名」對話框。溢出的 XP 不轉移（簡單明確）。
- **每日加成**：當天五大類各完成至少一次 → 額外 +3 XP（每天一次，記為特殊 log `bonus-all-categories`）。
- **心情（mood）**：依今日得分 `todayPoints`：≥ 20 開心 😄、5–19 普通 🙂、1–4 想你 🥺、0 打瞌睡 💤。所有農場動物共享此心情（牠們反映「你」最近過得怎樣）。
- **連續天數（streak）**：有任一健康行為的連續天數。

## 6. 動物生成（`js/animals.js`）

物種 5 種 × 毛色 6 × 毛長 3 × 配件 7 × 閃光（1/16 機率）= 1260 種組合。

| 維度 | 值 |
|---|---|
| species | 雞 chicken、豬 pig、綿羊 sheep、兔子 rabbit、乳牛 cow |
| color | 每物種 6 組調色盤（例：奶油、焦糖、可可、灰藍、粉紅、薄荷），含主色/副色 |
| fur | short / fluffy / long（以 SVG 外輪廓的毛邊/絨毛圓圈表現） |
| accessory | none、草帽、領巾、蝴蝶結、圓框眼鏡、花圈、鈴鐺 |
| shiny | 金色描邊 + 閃爍星星粒子 CSS 動畫 |

- `renderAnimal(animal, { size, level, mood, facing }) → SVGElement`；體型隨等級放大（Lv1 0.6 → Lv5 1.0）。
- 每隻動物有 `name`（可命名，預設隨機可愛名字）。
- 生成用 `crypto.getRandomValues`，避免連續兩隻同物種。

## 7. 狀態模型（`js/store.js`）

```js
{
  version: 1,
  createdAt: ISO,
  logs: [ { id, activityId, category, points, ts /* epoch ms */ } ],
  animals: [ { id, species, color, fur, accessory, shiny, name, xp, level, bornAt, graduatedAt } ],
  currentAnimalId: string,
  settings: { reminderMinutes: 0 | 30 | 45 | 60, sound: boolean }
}
```

- 「日」的界線以**使用者本地時區**為準（`YYYY-MM-DD` 字串計算）。
- 提供：`addLog(activityId)`、`undoLastLog()`（5 秒內可復原）、`getLogsByDay()`、`exportJSON()`、`exportCSV()`、`importJSON()`。
- `version` 欄位 + `migrate()`，未來改結構不丟資料。

## 8. 介面（底部 5 分頁）

1. **今天**：目前動物大圖（含等級、XP 進度條、心情）、今日分數/連續天數、五大類今日完成度圓點、快速打卡清單（依類別分組，顯示分數與今日次數 / 上限）。
2. **動一動**：依類別列出所有行為卡片；點開看步驟、原理、注意事項、**參考文獻連結**；`timer` 類按「開始」進入全螢幕引導計時器（逐步文字 + 倒數 + 輕提示音/震動），完成自動記錄並飛出 +XP 動畫。
3. **農場**：草地場景（依現在時間切換白天/黃昏/夜晚配色），所有動物（已畢業 + 目前寶寶）隨機漫步、偶爾停下、會轉向；點擊動物顯示資訊卡（名字、物種、特徵、等級、出生/畢業日、心情）。動物多時自動縮放。
4. **紀錄**：
   - 今日時間軸（幾點做了什麼）
   - 近 7 / 30 天每日分數堆疊長條圖（依類別上色）
   - 各類別、各行為的總次數、近 7 天次數、平均每日次數、最常做時段
   - 近 12 週活動熱力圖（GitHub 風格）
   - 最長/目前連續天數
5. **設定**：提醒間隔（App 開著時用 Notification API，iOS 不支援時退回頁內提示）、音效、匯出 JSON/CSV、匯入 JSON、全部參考文獻列表、重置資料（需二次確認）。

## 9. 設計準則

- 手機優先，寬 360–430px 為主；`env(safe-area-inset-*)` 處理瀏海與底部指示條。
- 圓潤、溫暖的農場風（奶油底、草綠、木頭棕），支援 `prefers-color-scheme: dark`。
- 觸控目標 ≥ 44px；動畫尊重 `prefers-reduced-motion`。
- 所有健康內容頁底部顯示「本內容為一般衛教資訊，不能取代醫療專業建議」。

## 10. 部署

- `.github/workflows/pages.yml`：push 到 `main` → `actions/configure-pages` → `upload-pages-artifact`（整個 repo 根目錄）→ `deploy-pages`。
- `sw.js` 的 cache 名稱含版本號，每次發布要遞增。
