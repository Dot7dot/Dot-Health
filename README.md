# Dot Health 健康小農場

一邊做健康行為、一邊養農場動物的手機優先小遊戲（PWA）。完成護眼、肌肉放鬆、手指、聽力、膝蓋保護等小行為就能獲得 XP，讓動物長大到 Lv5 後畢業住進農場；所有行為都會記錄，並在「紀錄」分頁顯示統計與圖表。資料只存在你的裝置（localStorage），可在「設定」匯出／匯入 JSON、匯出 CSV。

純 HTML/CSS/JS（ES Modules），無建置步驟、無外部套件，部署於 GitHub Pages。

## 加到主畫面
- **iOS**：用 Safari 開啟網站 → 分享 → 加入主畫面。
- **Android**：用 Chrome 開啟網站 → 選單 → 安裝應用程式（或加到主畫面）。

## 開發與除錯
在專案根目錄執行 `python3 -m http.server`，開啟 `http://localhost:8000/index.html?debug=1`，即可使用 `window.__dot`：`addXP(n)`、`log(id, n)`、`graduate()`、`addAnimals(n)`、`seed(days)`（灌入假歷史）、`reset()`、`state()`。動物外觀預覽：`tools/gallery.html`。

## 健康內容來源
健康行為與參考文獻的研究原稿（含出處與證據強度）在 [`docs/research/`](docs/research/)，資料實作於 `js/data/activities.js`。架構規格見 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

本內容為一般衛教資訊，不能取代醫療專業建議。
