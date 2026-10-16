// 把網站內容（profile.ts、作品 md、LOGO、封面圖）打包進 Figma 外掛的 code.js。
// 用法：在 portfolio-site 資料夾執行 `npm run figma`，再到 Figma 重新執行外掛。
// 封面圖：public/covers/*.svg 會用 macOS 內建的 qlmanage 轉成 PNG（Figma 外掛不能直接放 SVG 圖片填色）。
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// ── profile.ts（純物件，去掉 export 後直接執行）
const profile = new Function(read('src/data/profile.ts').replace(/export const profile\s*=/, 'return '))();

// ── 作品 md：frontmatter（簡易 YAML）＋內文
const parseValue = (v) => {
  v = v.trim();
  if (v.startsWith('[') && v.endsWith(']')) return v.slice(1, -1).split(',').map((s) => parseValue(s)).filter((s) => s !== '');
  if (/^".*"$|^'.*'$/.test(v)) return v.slice(1, -1);
  if (v === 'true' || v === 'false') return v === 'true';
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
};
const caseDir = join(root, 'src/content/cases');
const cases = readdirSync(caseDir).filter((f) => f.endsWith('.md')).map((f) => {
  const raw = readFileSync(join(caseDir, f), 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) data[line.slice(0, i).trim()] = parseValue(line.slice(i + 1));
  }
  return { id: f.replace(/\.md$/, ''), ...data, body: m[2] };
}).filter((c) => !c.draft).sort((a, b) => a.order - b.order);

// ── 內文 → 區塊（只處理案例頁實際用到的格式）
const inline = (html) => html
  .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ').trim();
const all = (re, s) => [...s.matchAll(re)];
function htmlBlock(h) {
  if (/class="todo"/.test(h)) return { type: 'todo', text: inline(h) };
  if (/class="scope"/.test(h)) return {
    type: 'scope',
    rows: all(/<div class="scope-row is-(in|out)">\s*<span class="scope-mark">([\s\S]*?)<\/span>\s*<div><strong>([\s\S]*?)<\/strong><p>([\s\S]*?)<\/p><\/div>/g, h)
      .map((r) => ({ kind: r[1], mark: inline(r[2]), title: inline(r[3]), desc: inline(r[4]) })),
  };
  if (/class="decisions"/.test(h)) return {
    type: 'decisions',
    items: all(/<p class="q">([\s\S]*?)<\/p>\s*<p class="a">([\s\S]*?)<\/p>\s*<p class="why">([\s\S]*?)<\/p>/g, h)
      .map((r) => ({ q: inline(r[1]), a: inline(r[2]), why: inline(r[3]) })),
  };
  if (/class="lanes"/.test(h)) {
    const head = h.match(/<div class="lanes-head"><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span><span>([\s\S]*?)<\/span>/);
    return {
      type: 'lanes',
      head: head.slice(1, 4).map(inline),
      rows: all(/<div class="lane">\s*<p>([\s\S]*?)<\/p>\s*<span class="state(?: is-(\w+))?">([\s\S]*?)<\/span>\s*<p>([\s\S]*?)<\/p>/g, h)
        .map((r) => ({ left: inline(r[1]), stateKind: r[2] || '', state: inline(r[3]), right: inline(r[4]) })),
    };
  }
  const ol = h.match(/<ol class="(priority|steps)">/);
  if (ol) return { type: ol[1], items: all(/<li>([\s\S]*?)<\/li>/g, h).map((r) => inline(r[1])) };
  if (/class="ph ph--diagram"/.test(h)) return { type: 'ph', variant: 'diagram', text: inline(h) };
  if (/class="ph"/.test(h)) return { type: 'ph', text: inline(h) };
  if (/class="principle"/.test(h)) return { type: 'principle', text: inline(h) };
  if (/class="flow-note"/.test(h)) return { type: 'note', text: inline(h) };
  if (/class="flow-full"/.test(h)) return { type: 'flowfull', text: inline((h.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1] || '') };
  if (/class="flow"/.test(h)) {
    const pick = (c, re) => { const m = c.match(re); return m ? m[1] : ''; };
    return {
      type: 'flow',
      labels: all(/<span>([\s\S]*?)<\/span>/g, pick(h, /<div class="flow-labels"[^>]*>([\s\S]*?)<\/div>/)).map((r) => inline(r[1])),
      steps: h.split('<div class="flow-step"').slice(1).map((c) => ({
        num: inline(pick(c, /<span class="flow-num">([\s\S]*?)<\/span>/)),
        title: inline(pick(c, /<p class="flow-title"><span class="flow-num">[\s\S]*?<\/span>([\s\S]*?)<\/p>/)),
        front: inline(pick(c, /<p class="bubble">([\s\S]*?)<\/p>/)),
        state: inline(pick(c, /<span class="state[^"]*">([\s\S]*?)<\/span>/)),
        stateKind: pick(c, /<span class="state is-(\w+)">/),
        back: inline(pick(c, /<p class="flow-back">([\s\S]*?)<\/p>/)),
        exc: all(/<li>([\s\S]*?)<\/li>/g, c).map((r) => inline(r[1])),
      })),
    };
  }
  if (/class="pyramid"/.test(h)) return {
    type: 'pyramid',
    tiers: h.split('<div class="tier"').slice(1).map((c) => {
      const why = (c.match(/<p class="tier-why"><strong>([\s\S]*?)<\/strong>([\s\S]*?)<\/p>/) || []);
      return {
        num: inline((c.match(/<span class="tier-num">([\s\S]*?)<\/span>/) || [])[1] || ''),
        title: inline((c.match(/<\/span><strong>([\s\S]*?)<\/strong>/) || [])[1] || ''),
        head: inline(why[1] || ''), body: inline(why[2] || ''),
      };
    }),
  };
  if (/class="screens"/.test(h)) return {
    type: 'screens',
    items: h.split('<section class="screen">').slice(1).map((c) => {
      const txt = c.split('<figure')[0];
      const ps = all(/<p(?: class="([\w-]+)")?>([\s\S]*?)<\/p>/g, txt);
      return {
        label: inline((ps.find((r) => r[1] === 'screen-label') || [])[2] || ''),
        title: inline((txt.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || ''),
        intro: inline((ps.find((r) => !r[1]) || [])[2] || ''),
        items: all(/<li>([\s\S]*?)<\/li>/g, txt).map((r) => inline(r[1])),
        note: inline((ps.find((r) => r[1] === 'screen-note') || [])[2] || ''),
        ph: inline((c.match(/<figure[^>]*>([\s\S]*?)<\/figure>/) || [])[1] || ''),
        img: (c.match(/<figure[\s\S]*?<img[^>]*src="([^"]+)"/) || [])[1] || '',
      };
    }),
  };
  if (/class="workflow"/.test(h)) return {
    type: 'workflow',
    cards: h.split('<div class="wf-card').slice(1).map((c) => ({
      key: /^ is-key/.test(c),
      icon: (c.match(/class="wf-ico" src="([^"]+)"/) || [])[1] || '',
      num: inline((c.match(/<span class="wf-num">([\s\S]*?)<\/span>/) || [])[1] || ''),
      title: inline((c.match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] || ''),
      desc: inline((c.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || ''),
    })),
  };
  if (/class="team"/.test(h)) return {
    type: 'team',
    parts: all(/<div class="team-node is-(\w+)"[^>]*>([\s\S]*?)<\/div>|<span class="team-arrow"[^>]*>([\s\S]*?)<\/span>/g, h).map((m) => m[3] != null
      ? { arrow: inline(m[3]) }
      : { kind: m[1], title: inline((m[2].match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] || ''), lines: all(/<span>([\s\S]*?)<\/span>/g, m[2]).map((r) => inline(r[1])) }),
  };
  if (/class="deliverables"/.test(h)) return {
    type: 'deliverables',
    items: h.split('<div class="dv-card"').slice(1).map((c) => ({
      icon: (c.match(/<img src="([^"]+)"/) || [])[1] || '',
      title: inline((c.match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] || ''),
      desc: inline((c.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || ''),
    })),
  };
  if (/class="outcome"/.test(h)) {
    const pc = (cls) => inline((h.match(new RegExp(`<p class="${cls}">([\\s\\S]*?)<\\/p>`)) || [])[1] || '');
    return {
      type: 'outcome', lead: pc('oc-lead'), reuse: pc('oc-reuse'), note: pc('oc-note'),
      stats: h.split('<div class="oc-stat"').slice(1).map((c) => {
        const n = c.match(/<p class="oc-num">([\s\S]*?)<span>([\s\S]*?)<\/span><\/p>/) || [];
        return {
          num: inline(n[1] || ''), unit: inline(n[2] || ''),
          title: inline((c.match(/<strong>([\s\S]*?)<\/strong>/) || [])[1] || ''),
          desc: inline((c.match(/<\/strong><p>([\s\S]*?)<\/p>/) || [])[1] || ''),
        };
      }),
    };
  }
  if (/class="cta"/.test(h)) {
    const r = h.match(/<p>([\s\S]*?)<\/p>\s*<span[^>]*>([\s\S]*?)<\/span>/);
    return { type: 'cta', text: inline(r[1]), btn: inline(r[2]) };
  }
  console.warn('⚠️ 沒處理到的 HTML 區塊：', h.slice(0, 60));
  return null;
}
function blocks(md) {
  const out = [];
  let split = null; // <div class="split">：左圖右文，中間夾著 markdown 段落
  for (const t of marked.lexer(md)) {
    if (t.type === 'html' && /class="split"/.test(t.text)) { split = { type: 'split', ph: inline((t.text.match(/<figure[^>]*>([\s\S]*?)<\/figure>/) || [])[1] || ''), paras: [] }; continue; }
    if (split) {
      if (t.type === 'paragraph') split.paras.push(t.text);
      else if (t.type === 'html' && /^<\/div>/.test(t.text.trim())) { out.push(split); split = null; }
      continue;
    }
    if (t.type === 'heading') out.push({ type: t.depth === 2 ? 'h2' : 'h3', text: t.text });
    else if (t.type === 'paragraph') out.push(/^<(div|figure|ol|p |details)/.test(t.text) ? htmlBlock(t.text) : { type: 'p', text: t.text.replace(/<br\s*\/?>/g, '\n') });
    else if (t.type === 'list') out.push({ type: t.ordered ? 'ol' : 'ul', items: t.items.map((i) => i.text.trim()) });
    else if (t.type === 'table') out.push({ type: 'table', head: t.header.map((c) => c.text), rows: t.rows.map((r) => r.map((c) => c.text)) });
    else if (t.type === 'html') out.push(htmlBlock(t.text));
  }
  return out.filter(Boolean);
}
const caseMain = cases.find((c) => c.id === '01-bot-1v1');
const caseBlocks = blocks(caseMain.body);

// ── 封面圖：SVG → PNG（1600×1000 → 960×600）
const tmp = mkdtempSync(join(tmpdir(), 'pf-covers-'));
const coverPng = {};
for (const c of cases) {
  if (!c.cover) continue;
  const svg = join(root, 'public', c.cover);
  const name = c.cover.split('/').pop();
  if (!existsSync(svg)) continue;
  if (!name.endsWith('.svg')) { coverPng[c.id] = readFileSync(svg).toString('base64'); continue; }
  execFileSync('qlmanage', ['-t', '-s', '1200', '-o', tmp, svg], { stdio: 'ignore' });
  const png = join(tmp, name + '.png');
  const out = join(tmp, name.replace(/\.svg$/, '.png'));
  execFileSync('sips', ['-c', '750', '1200', png, '--out', out], { stdio: 'ignore' });
  execFileSync('sips', ['-Z', '960', out], { stdio: 'ignore' });
  coverPng[c.id] = readFileSync(out).toString('base64');
}
rmSync(tmp, { recursive: true, force: true });

// ── 案例內文用到的畫面圖（PNG/JPG，最長邊縮到 1600）與單色 icon（SVG 原文）
const images = {}, icons = {};
const tmp2 = mkdtempSync(join(tmpdir(), 'pf-images-'));
const walkBlocks = (bs) => bs.forEach((b) => {
  (b.items || []).forEach((it) => {
    if (it.img && /\.(png|jpe?g)$/i.test(it.img) && !images[it.img]) {
      const src = join(root, 'public', it.img);
      if (!existsSync(src)) return;
      const out = join(tmp2, it.img.split('/').pop().replace(/\.\w+$/, '.jpg'));
      execFileSync('sips', ['-Z', '1600', '-s', 'format', 'jpeg', '-s', 'formatOptions', '82', src, '--out', out], { stdio: 'ignore' });
      const dim = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', out]).toString().match(/\d+(?=\s*$)/gm).map(Number);
      images[it.img] = { b64: readFileSync(out).toString('base64'), w: dim[0], h: dim[1] };
    }
    if (it.icon && !icons[it.icon] && existsSync(join(root, 'public', it.icon))) icons[it.icon] = readFileSync(join(root, 'public', it.icon), 'utf8');
  });
  (b.cards || []).forEach((c) => { if (c.icon && !icons[c.icon] && existsSync(join(root, 'public', c.icon))) icons[c.icon] = readFileSync(join(root, 'public', c.icon), 'utf8'); });
});
walkBlocks(caseBlocks);
rmSync(tmp2, { recursive: true, force: true });

// ── LOGO 與角色卡 icon
const logo = read('src/assets/logo.svg')
  .replace(/style="fill:var\(--logo-fill,#fff\)"/g, 'fill="#f4f0e6"')
  .replace(/currentColor/g, '#152c4c')
  .replace(/ role="img" aria-label="[^"]*"/, '');
const roleIcons = all(/'(<svg[\s\S]*?<\/svg>)'/g, read('src/pages/index.astro')).map((m) => m[1]);

const data = {
  builtAt: new Date().toISOString(),
  year: new Date().getFullYear(),
  profile,
  cases: cases.map(({ body, ...c }) => c),
  caseMain: { id: caseMain.id, blocks: caseBlocks },
  covers: coverPng,
  images,
  icons,
  logo,
  roleIcons,
};

const template = readFileSync(join(here, 'src/render.js'), 'utf8');
writeFileSync(join(here, 'code.js'), template.replace('/*__DATA__*/null', () => JSON.stringify(data)));
console.log(`✅ figma-plugin/code.js 已更新：${cases.length} 個作品、案例頁 ${caseBlocks.length} 個區塊、${Object.keys(coverPng).length} 張封面、${Object.keys(images).length} 張畫面圖、${Object.keys(icons).length} 個 icon`);
