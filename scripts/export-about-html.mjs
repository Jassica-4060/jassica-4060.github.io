// 把「關於我」解鎖後的內容匯出成一支用瀏覽器直接打開的 HTML（給 Codex 等工具產生 CV 用）
// 輸出到 private/about-cv.html（不上傳 GitHub）：不需要密碼、圖片內嵌、工作經歷 5 家全部展開
// 用法：npm run about-html（改完 private/about.md 後再跑一次）
import { readFile, writeFile } from 'node:fs/promises';
import { marked } from 'marked';
import { wrapSections } from './about-sections.mjs';

const read = (p) => readFile(p, 'utf8');
const profile = new Function((await read('src/data/profile.ts')).replace(/export const profile\s*=/, 'return '))();
let body = wrapSections(await marked.parse(await read('private/about.md'))); // 跟網站一樣分段、第 2、4 段深藍底

// ── 工作經歷：沒有分頁切換，5 家全部展開；時間軸上的公司改成跳到該公司的錨點
body = body
  .replace(/<button class="xp-stop"[^>]*id="xp-tab-(\d+)"[^>]*>/g, '<a class="xp-stop" href="#xp-panel-$1">')
  .replace(/<\/button>/g, '</a>')
  .replace(/ role="(tablist|tabpanel)"/g, '')
  .replace(/ aria-labelledby="xp-tab-\d+"/g, '')
  .replace(/ hidden>/g, '>');

// ── 作品集案例連結：網站還沒上線，本機檔案點了也打不開，改成純文字
body = body.replace(/<a class="cap-link" href="\/work\/([^/"]+)\/?">([\s\S]*?)<\/a>/g, '<span class="cap-link" data-case="$1">$2</span>');

// ── 圖片內嵌成 data URI，單獨一個檔案也看得到
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', gif: 'image/gif' };
const srcs = [...new Set([...body.matchAll(/src="(\/[^"]+)"/g)].map((m) => m[1]))];
for (const src of srcs) {
  const ext = src.split('.').pop().toLowerCase();
  const b64 = (await readFile(`public${src}`)).toString('base64');
  body = body.split(`src="${src}"`).join(`src="data:${MIME[ext]};base64,${b64}"`);
}

// ── 樣式：全站 global.css ＋ about.astro 裡解鎖內容（.unlocked）的規則
// about.astro 用 Astro 的 :global(...) 包住注入內容的選擇器，這裡拆掉外殼；密碼門、Hero 等其他規則不帶
function blocksOf(css) { // 依大括號切出最外層的規則
  const out = [];
  let depth = 0, start = 0, sel = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') { if (depth === 0) sel = i; depth++; }
    else if (css[i] === '}') { depth--; if (depth === 0) { out.push({ head: css.slice(start, sel).trim(), inner: css.slice(sel + 1, i) }); start = i + 1; } }
  }
  return out;
}
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
function keepUnlocked(css) {
  return blocksOf(stripComments(css)).map(({ head, inner }) => {
    if (head.startsWith('@media')) { const kept = keepUnlocked(inner); return kept ? `${head} {\n${kept}\n}` : ''; }
    return head.includes('.unlocked') ? `${head} {${inner}}` : '';
  }).filter(Boolean).join('\n');
}
function unwrapGlobal(css) { // :global(.a:not(.b)) → .a:not(.b)（處理括號巢狀）
  let out = '', i = 0;
  while (i < css.length) {
    if (css.startsWith(':global(', i)) {
      let depth = 1, j = i + ':global('.length;
      while (j < css.length && depth) { if (css[j] === '(') depth++; else if (css[j] === ')') depth--; j++; }
      out += css.slice(i + ':global('.length, j - 1);
      i = j;
    } else out += css[i++];
  }
  return out;
}
const astro = await read('src/pages/about.astro');
const aboutCss = unwrapGlobal(keepUnlocked(astro.match(/<style>([\s\S]*?)<\/style>/)[1]));
const globalCss = await read('src/styles/global.css');

const contacts = profile.contacts.filter((c) => c.url);
const now = new Date();
const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
const html = `<!doctype html>
<!--
  ${profile.name}（${profile.nameEn}）｜關於我：CV 素材
  內容來源：private/about.md，匯出日期 ${stamp}（npm run about-html 重新產生）
  說明：網站上工作經歷是分頁切換，這裡 5 家公司全部展開；作品集案例名稱為純文字（網站尚未上線）
-->
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${profile.name}｜關於我（CV 素材）</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet" />
<style>
${globalCss}
/* ── 關於我解鎖內容（取自 src/pages/about.astro） */
${aboutCss}
/* ── 匯出版專用 */
.cv-head { padding-block: 64px 8px; }
.cv-head h1 { font-size: clamp(2.4rem, 6vw, 4rem); line-height: 1.2; margin: 8px 0 12px; }
.cv-head h1 span { font-family: var(--font-display); font-size: 0.5em; margin-left: 12px; }
.cv-meta { margin: 0 0 16px; color: var(--ink-soft); font-weight: 700; }
.cv-contacts { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px 20px; }
.cv-contacts a { font-weight: 700; }
a.xp-stop { text-decoration: none; }
.xp-panel { scroll-margin-top: 24px; }
.xp-panel + .xp-panel { margin-top: 24px; }
</style>
</head>
<body>
<header class="cv-head wrap">
<p class="eyebrow">About</p>
<h1>${profile.name}<span>${profile.nameEn}</span></h1>
<p class="cv-meta">${profile.title}・${profile.location}</p>
${contacts.length ? `<ul class="cv-contacts">\n${contacts.map((c) => `<li>${c.label}：<a href="${c.url}" target="_blank" rel="noopener">${c.url}</a></li>`).join('\n')}\n</ul>` : ''}
</header>
<main class="wrap">
<section class="unlocked">
<div class="prose">
${body}
</div>
</section>
</main>
</body>
</html>
`;
await writeFile('private/about-cv.html', html);
console.log(`✓ 已匯出 private/about-cv.html（${Math.round(html.length / 1024)} KB，內嵌 ${srcs.length} 張圖片）`);
