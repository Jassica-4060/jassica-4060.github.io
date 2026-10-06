# 黃思敏（C MIN）個人作品集

線上網址：https://jassica-4060.github.io/

用 [Astro](https://astro.build) 做的靜態網站。推送到 GitHub 的 `main` 分支後，GitHub 會自動建置並更新網站，大約 1～2 分鐘生效。

## 我要改內容，該改哪裡？

| 想改的東西 | 檔案 |
|---|---|
| 名字、職稱、首頁標語、打字機句子、特質、設計理念、聯絡連結 | `src/data/profile.ts` |
| 作品案例（一個案例一個檔） | `src/content/cases/*.md` |
| 關於我（需密碼的頁面） | `private/about.md`（只在本機，見下方） |
| 顏色、字體 | `src/styles/global.css` 最上方的 tokens |

### 作品案例
- 每個 `.md` 檔上方 `---` 之間是案例的基本資料（標題、期間、角色、能力標籤…），下方是內文。
- `tier: main` 是主案例（首頁大卡片），`tier: side` 是其他作品；`order` 決定順序。
- 想暫時隱藏某個案例：加上 `draft: true`。
- 內文中的 `<div class="todo">…</div>` 是「待補」黃框，補好內容後刪掉即可。
- `<figure class="ph">…</figure>` 是圖片占位；有正式圖片後放進 `public/images/`，改成 `![圖片說明](/images/檔名.png)`。

### 聯絡連結
在 `src/data/profile.ts` 的 `contacts` 填入 `url`，網站上就會從「連結待補」變成可點擊的按鈕。

## 關於我（加密頁面）

About 頁的原文 **不會** 上傳 GitHub，網站上只有加密後的亂碼，訪客輸入正確密碼才會在瀏覽器裡解開。

- 原文：`private/about.md`
- 密碼：`private/about-password.txt`
- `private/` 整個資料夾已被 `.gitignore` 排除，只存在這台電腦。**請自行備份**，遺失就要重寫。

修改 About 後，要在本機重新加密一次再推送：

```bash
npm run lock-about
```

> 提醒：4 位數密碼只能擋一般訪客，有心人仍可能用程式反覆嘗試解開。不要在 About 放真正機密的資料（身分證、地址、薪資等）。

## 本機預覽

```bash
npm install
npm run dev
```

打開 http://localhost:4321/ 即可預覽。
