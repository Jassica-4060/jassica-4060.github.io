# 作品集 ↔ Figma 同步外掛

Figma MCP 免費版每月只有 20 次呼叫，用完就不能讀寫 Figma。這個外掛讓設計稿的「產生」和「回推」都不用花 MCP 額度。

目標位置：`C-Min｜工作桌作品集・可編輯設計稿`，連結 node `27:15`。

## 第一次安裝（只要做一次，需要 Figma 桌面版）

1. 打開 Figma 桌面版和設計稿檔案。
2. 選單 **Plugins → Development → Import plugin from manifest…**
3. 選這個資料夾裡的 `manifest.json`。

## ① 網頁 → Figma（產生／更新設計稿）

1. Figma 選單 **Plugins → Development → 作品集 ↔ Figma 同步 → ① 產生／更新設計稿**
2. 視窗會說明要清除什麼，確認後按「開始產生」。可以用 ⌘Z 復原。

會產生 4 張 Desktop 1440 稿，全部都用 Auto Layout：

| 稿 | 內容 |
|---|---|
| 01 首頁 | Header、主視覺、自我介紹、角色卡（預設）、工作方式疊卡、作品（產品設計 Tab）、聯絡、Footer |
| 01b 首頁｜互動狀態 | 三張角色卡 Hover 展開、打字機輪播句子、作品 Tab 切到平面設計／網頁設計 |
| 02 案例頁 | Bot 一對一真人服務（完整內文） |
| 03 關於我（鎖定） | 密碼門與聯絡區（解鎖後的內容是私密資料，不放進設計稿） |

**重跑會覆蓋設計稿。** 在 Figma 改過的內容，要先回推到網頁，再重跑①。

網頁內容改了之後，先在專案資料夾執行 `npm run figma` 重新打包，再到 Figma 跑①。

## ③ 只產生案例頁新版（不覆蓋舊稿）

案例頁含有在 Figma 手繪的插圖時，用這個指令，不要用①。

1. Figma 選單 **Plugins → Development → 作品集 ↔ Figma 同步 → ③ 產生案例頁新版（不覆蓋舊稿）**
2. 新稿「02 案例頁 v2｜Desktop 1440（網頁同步）」會畫在舊案例頁的**下方**，舊稿完全不動。
3. 舊稿裡的兩張插圖（圖層名稱 `Bot-1v1-Handoff`、950×154 的 `Group 1`）會自動複製到新稿對應位置。
4. 再跑一次③只會重畫 v2 這張，不影響其他稿。

## ④ 只產生「漸進式訊息」案例頁（不覆蓋其他稿）

1. Figma 選單 **Plugins → Development → 作品集 ↔ Figma 同步 → ④ 產生案例頁：漸進式訊息（不覆蓋其他稿）**
2. 新稿「02b 案例頁｜漸進式訊息｜Desktop 1440（網頁同步）」會畫在 Bot 案例頁（v2，沒有就用舊稿）的**右邊**。
3. 再跑一次④只會在原位置重畫這張，Bot 一對一和其他稿都不會動。

內容來源：`src/content/cases/02-line-oa-progressive.md`，截圖在 `public/images/Progressive/`。

## ⑤ 只產生「WorksHub+ 設計系統」案例頁（不覆蓋其他稿）

1. Figma 選單 **Plugins → Development → 作品集 ↔ Figma 同步 → ⑤ 產生案例頁：WorksHub+ 設計系統（不覆蓋其他稿）**
2. 新稿「02c 案例頁｜WorksHub+ 設計系統｜Desktop 1440（網頁同步）」會畫在漸進式訊息案例頁的**右邊**（沒有就接在 Bot 案例頁右邊）。
3. 再跑一次⑤只會在原位置重畫這張。

內容來源：`src/content/cases/03-workshub-design-system.md`，圖片在 `public/images/worksHub+/logo/`、`shots/`。

要再加其他作品的案例頁：在 `build.mjs` 的 `EXTRA_IDS`、`src/render.js` 的 `EXTRA`、`manifest.json` 的 `menu` 各加一筆。

## ② Figma → 網頁（回推修改）

1. （只想匯出某一張稿時，先點選那張稿）Figma 選單 **Plugins → Development → 作品集 ↔ Figma 同步 → ② 匯出內容（回推網頁用）**
2. 按「複製」，貼到和 Claude 的對話，說「回推到網頁」。

匯出的 JSON 包含每個圖層的文字、字級、顏色、間距、內距與 Fill／Hug 設定。

## 編輯時的規則

- **文字圖層的名稱不要改**：名稱是對應網站資料的欄位（例如 `roles.0.title`），回推時靠它找到要改哪裡。
- 名稱是 `Deco｜…`、`Arrow`、`Note` 的圖層是裝飾或標註，不會回推。
- 第 2、3 張「工作方式」卡疊在第 1 張後面，可以從圖層面板選取來編輯，或先把第 1 張暫時隱藏。
- 漂浮標籤、角色卡背景英文、大編號是 Auto Layout 裡的「絕對定位」子層，可以自由拖曳。

## 給 Claude：圖層名稱 → 網站原始檔

| 圖層名稱開頭 | 原始檔 |
|---|---|
| `name・nameEn`、`about.*`、`roles.*`、`traits.*`、`typewriter.*`、`philosophy`、`contacts.*`、`footer.copyright` | `src/data/profile.ts` |
| `cases.<id>.*`（title、summary、date、kind、skills、role、duration、proves） | `src/content/cases/<id>.md` 的 frontmatter |
| `cases.<id>.body.<區塊序號>…` | 同一個 md 的內文，序號 = build.mjs 解析出的第幾個區塊 |
| `hero.*`、`work.*`、`approach.*`、`contact.*`、`tabs.*` | `src/pages/index.astro` |
| `nav.*` | `src/components/Header.astro` |
| `case.*` | `src/pages/work/[slug].astro` |
| `about.page.*`、`about.gate.*`、`about.contact.*` | `src/pages/about.astro` |

排版數值對照：稿寬 1440、假設視窗高 900；內容區最大寬 1168、左右 56；字級是網頁 `clamp()` 在 1440 寬時的值。

## 檔案

- `src/render.js`：畫稿與匯出的程式（要改外掛改這裡）
- `build.mjs`：把網站內容打包成 `code.js`（`npm run figma`）
- `code.js`：打包結果，不要手動改
- `ui.html`、`manifest.json`：外掛視窗與設定
- `test/mock-run.cjs`：用模擬的 Figma 環境測試 code.js（`node figma-plugin/test/mock-run.cjs`）
