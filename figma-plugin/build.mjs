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
  .replace(/<br\s*\/?>/g, '\u0000')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ').replace(/ ?\u0000 ?/g, '\n').trim();
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
    items: h.split('<div class="decision').slice(1).map((c) => {
      const img = c.match(/<img[^>]*src="([^"]+)"[^>]*width="(\d+)" height="(\d+)"/);
      return {
        wide: /^ is-wide/.test(c),
        q: inline((c.match(/<p class="q">([\s\S]*?)<\/p>/) || [])[1] || ''),
        a: inline((c.match(/<p class="a">([\s\S]*?)<\/p>/) || [])[1] || ''),
        why: inline((c.match(/<p class="why">([\s\S]*?)<\/p>/) || [])[1] || ''),
        img: img ? img[1] : '', imgW: img ? +img[2] : 0, imgH: img ? +img[3] : 0,
      };
    }).filter((d) => d.q),
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
  const figs = (src) => src.split(/<figure/).slice(1).map((c) => {
    const im = c.match(/<img[^>]*src="([^"]+)"/);
    const wh = c.match(/width="(\d+)" height="(\d+)"/);
    return {
      img: im ? im[1] : '', w: wh ? +wh[1] : 0, h: wh ? +wh[2] : 0,
      picked: /class="is-picked"/.test(c.split('>')[0]),
      ph: /^ class="ph"/.test(c) ? inline((c.match(/<span>([\s\S]*?)<\/span>/) || [])[1] || '') : '',
      tag: inline((c.match(/<span class="cmp-tag">([\s\S]*?)<\/span>/) || [])[1] || ''),
      caption: inline(((c.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [])[1] || '').replace(/<span class="cmp-tag">[\s\S]*?<\/span>/, '')),
      top: /<figure[^>]*>\s*<figcaption>/.test('<figure' + c),
    };
  });
  if (/class="logo-final"/.test(h)) {
    const tiles = all(/<figure class="lf-tile is-(light|dark)"><img src="([^"]+)" width="(\d+)" height="(\d+)"/g, h).map((r) => ({ dark: r[1] === 'dark', img: r[2], w: +r[3], h: +r[4] }));
    const parts = all(/<li class="lf-op"[^>]*>([\s\S]*?)<\/li>|<li class="lf-part">([\s\S]*?)<\/li>/g, h).map((r) => r[1] != null
      ? { op: inline(r[1]) }
      : { img: (r[2].match(/src="([^"]+)"/) || [])[1] || '', w: +((r[2].match(/width="(\d+)"/) || [])[1] || 107), label: inline((r[2].match(/<span class="lf-label">([\s\S]*?)<\/span>/) || [])[1] || '') });
    return { type: 'logofinal', tiles, parts, items: [...tiles, ...parts.filter((x) => x.img)] };
  }
  if (/class="logo-grid"/.test(h)) return { type: 'logos', items: figs(h) };
  if (/class="compare/.test(h)) return { type: 'compare', items: figs(h) };
  if (/class="swatches"/.test(h)) return {
    type: 'swatches',
    items: all(/<li><span class="chip" style="background:([^"]+)"><\/span><strong>([\s\S]*?)<\/strong><code>([\s\S]*?)<\/code><\/li>/g, h)
      .map((r) => ({ bg: r[1].trim(), name: inline(r[2]), code: inline(r[3]) })),
  };
  if (/class="layers"/.test(h)) {
    // 巢狀色階：<div class="ly"> 一層包一層
    const root = { name: '', code: '', bg: '', kids: [] };
    const stack = [root];
    const re = /<p class="ly-name( ly-canvas)?">([\s\S]*?)<code>([\s\S]*?)<\/code><\/p>|<div class="ly( ly-chip)?" style="background:([^"]+)">|<\/div>/g;
    let m, canvas = null;
    while ((m = re.exec(h))) {
      if (m[2] != null) {
        const it = { name: inline(m[2]), code: inline(m[3]) };
        if (m[1]) canvas = it; else Object.assign(stack[stack.length - 1], it);
      } else if (m[5]) { const n = { name: '', code: '', bg: m[5].trim(), chip: !!m[4], kids: [] }; stack[stack.length - 1].kids.push(n); stack.push(n); }
      else if (stack.length > 1) stack.pop();
    }
    return { type: 'layers', bg: (h.match(/class="layers"[^>]*style="background:([^"]+)"/) || [])[1] || '#E6EBF0', canvas, kids: root.kids };
  }
  if (/class="shot/.test(h)) return {
    type: 'shot', narrow: /class="shot is-narrow"/.test(h),
    img: (h.match(/<img[^>]*src="([^"]+)"/) || [])[1] || '',
    caption: inline((h.match(/<figcaption>([\s\S]*?)<\/figcaption>/) || [])[1] || ''),
  };
  if (/class="ph ph--diagram"/.test(h)) return { type: 'ph', variant: 'diagram', text: inline(h) };
  if (/class="ph"/.test(h)) return { type: 'ph', text: inline(h) };
  if (/class="principle"/.test(h)) return { type: 'principle', text: inline(h) };
  if (/class="flow-note"/.test(h)) return { type: 'note', text: inline(h) };
  if (/^<p class="screen-note"/.test(h.trim())) return { type: 'note', text: inline(h) };
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
  if (/class="workflow/.test(h)) return {
    type: 'workflow', row: /class="workflow is-row"/.test(h),
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
        const n = c.match(/<p class="oc-num">([\s\S]*?)(?:<span>([\s\S]*?)<\/span>)?<\/p>/) || [];
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
  let group = null; // <div class="rule-map">／<div class="fix-row">：左邊 markdown、右邊圖或色階
  for (const t of marked.lexer(md)) {
    if (t.type === 'html' && /^<div class="(rule-map|fix-row)">/.test(t.text.trim())) { group = { type: 'row', kind: t.text.match(/class="(rule-map|fix-row)"/)[1], parts: [], side: null }; continue; }
    if (group) {
      if (t.type === 'paragraph') group.parts.push({ type: 'p', text: t.text.replace(/<br\s*\/?>/g, '\n') });
      else if (t.type === 'table') group.parts.push({ type: 'table', head: t.header.map((c) => c.text), rows: t.rows.map((r) => r.map((c) => c.text)) });
      else if (t.type === 'html') {
        const lyAt = t.text.indexOf('<div class="layers"');
        if (lyAt >= 0) group.side = htmlBlock(t.text.slice(lyAt));
        else { const im = t.text.match(/<img[^>]*src="([^"]+)"/); if (im) group.side = { type: 'img', img: im[1] }; }
        out.push(group); group = null;
      }
      continue;
    }
    if (t.type === 'html' && /class="split/.test(t.text)) { split = { type: 'split', textFirst: /is-origin/.test(t.text), parts: [], ph: inline((t.text.match(/<figure[^>]*><span>([\s\S]*?)<\/span>/) || t.text.match(/<figure[^>]*>([\s\S]*?)<\/figure>/) || [])[1] || ''), img: (t.text.match(/<figure[\s\S]*?<img[^>]*src="([^"]+)"/) || [])[1] || '', paras: [] }; continue; }
    if (split) {
      if (t.type === 'paragraph') { split.paras.push(t.text); split.parts.push({ type: 'p', text: t.text }); }
      else if (t.type === 'table') split.parts.push({ type: 'table', head: t.header.map((c) => c.text), rows: t.rows.map((r) => r.map((c) => c.text)) });
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
const images = {}, icons = {}, svgs = {};
const tmp2 = mkdtempSync(join(tmpdir(), 'pf-images-'));
const walkBlocks = (bs) => bs.forEach((b) => {
  [b, ...(b.items || []), ...(b.side ? [b.side] : [])].forEach((it) => {
    if (it.img && /\.svg$/i.test(it.img) && !svgs[it.img] && existsSync(join(root, 'public', it.img))) svgs[it.img] = readFileSync(join(root, 'public', it.img), 'utf8');
    if (it.img && /\.(png|jpe?g)$/i.test(it.img) && !images[it.img]) {
      const src = join(root, 'public', it.img);
      if (!existsSync(src)) return;
      const out = join(tmp2, it.img.split('/').pop().replace(/\.\w+$/, '.jpg'));
      execFileSync('sips', ['-Z', '1400', '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', src, '--out', out], { stdio: 'ignore' });
      const dim = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', out]).toString().match(/\d+(?=\s*$)/gm).map(Number);
      images[it.img] = { b64: readFileSync(out).toString('base64'), w: dim[0], h: dim[1] };
    }
    if (it.icon && !icons[it.icon] && existsSync(join(root, 'public', it.icon))) icons[it.icon] = readFileSync(join(root, 'public', it.icon), 'utf8');
  });
  (b.cards || []).forEach((c) => { if (c.icon && !icons[c.icon] && existsSync(join(root, 'public', c.icon))) icons[c.icon] = readFileSync(join(root, 'public', c.icon), 'utf8'); });
});
walkBlocks(caseBlocks);
const walkDeep = (bs) => { walkBlocks(bs); bs.forEach((b) => { if (b.side && b.side.items) walkBlocks([b.side]); }); };
// 第二個案例頁：漸進式訊息（外掛指令 ④）
// 額外案例頁（外掛指令 ④、⑤…）：各自一張稿，互不覆蓋
const EXTRA_IDS = ['02-line-oa-progressive', '03-workshub-design-system'];
const extras = {};
for (const id of EXTRA_IDS) {
  const c = cases.find((x) => x.id === id);
  if (!c) continue;
  extras[id] = { id, blocks: blocks(c.body) };
  walkBlocks(extras[id].blocks);
}
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
  extras,
  covers: coverPng,
  images,
  icons,
  svgs,
  logo,
  roleIcons,
};

const template = readFileSync(join(here, 'src/render.js'), 'utf8');
writeFileSync(join(here, 'code.js'), template.replace('/*__DATA__*/null', () => JSON.stringify(data)));
console.log(`✅ figma-plugin/code.js 已更新：${cases.length} 個作品、案例頁 ${[caseBlocks, ...Object.values(extras).map((e) => e.blocks)].map((b) => b.length).join('＋')} 個區塊、${Object.keys(coverPng).length} 張封面、${Object.keys(images).length} 張畫面圖、${Object.keys(icons).length} 個 icon、${Object.keys(svgs).length} 張向量圖`);
