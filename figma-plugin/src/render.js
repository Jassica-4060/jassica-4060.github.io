// 作品集 ↔ Figma 同步外掛（由 build.mjs 產生 code.js，請改這個檔，不要直接改 code.js）
// ① 產生／更新設計稿：把網站內容畫成 Desktop 1440 稿，所有區塊都是 Auto Layout。
// ② 匯出內容：把設計稿的文字與排版數值匯出成 JSON，交給 Claude 回推到網頁。
const DATA = /*__DATA__*/null;
const TARGET_ID = '27:15'; // Figma 連結裡的 node-id=27-15

const W = 1440;       // 稿寬
const VH = 900;       // 假設的瀏覽器高度（網頁上「滿版高度」= 100svh - 68px 的 Header）
const HEADER_H = 68;
const SCREEN_H = VH - HEADER_H; // 832
const GUTTER = 56;    // .wrap 左右內距 clamp(16px, 4vw, 56px) @1440
const MAXW = 1168;    // .wrap 內容寬：1280 - 56×2
const BODY = 18;      // 內文字級 @1440

const HEX = {
  ink: '#152c4c', paper: '#f4f0e6', accent: '#ffc23d',
  inkSoft: '#46576e',   // ink 78% + paper
  ink6: '#e7e4dd',      // 佔位底色：ink 6% + paper
  accent22: '#f6e6c1',  // 密碼框底色
  accent35: '#f8e0ab',  // 待補框底色
  paper85: '#d3d3cf',   // 深底上的次要文字
  white: '#ffffff',
  ink7: '#e4e2db',       // 對話泡泡底色：ink 7% + paper
  ink4: '#ebe8e0',       // 痛點卡淺底：ink 4% + paper
  ink30: '#b1b5b8',      // 金字塔第 4 層
  ink14: '#d5d5d0',      // 金字塔第 5 層
};
const P = DATA.profile;
const FRAMES = [
  { key: 'home', name: '01 首頁｜Desktop 1440', build: buildHome },
  { key: 'states', name: '01b 首頁｜互動狀態（Hover・Tab・打字機）', build: buildStates },
  { key: 'case', name: '02 案例頁｜Desktop 1440', build: buildCase },
  { key: 'about', name: '03 關於我（鎖定）｜Desktop 1440', build: buildAbout },
];

// ───────── 顏色：優先綁定「作品集網站 Color」變數 ─────────
const VARS = {};
async function loadVars() {
  try {
    for (const c of await figma.variables.getLocalVariableCollectionsAsync()) {
      if (!/作品集/.test(c.name)) continue;
      for (const id of c.variableIds) {
        const v = await figma.variables.getVariableByIdAsync(id);
        if (v && v.resolvedType === 'COLOR') VARS[v.name.split('/').pop().toLowerCase().replace(/[^a-z0-9]/g, '')] = v;
      }
    }
  } catch (e) { /* 沒有變數就用色碼 */ }
}
const rgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
};
function paint(key, opacity = 1) {
  const hex = HEX[key] || key;
  let p = { type: 'SOLID', color: rgb(hex), opacity };
  const v = VARS[key.toLowerCase()];
  if (v) p = Object.assign({}, figma.variables.setBoundVariableForPaint(p, 'color', v), { opacity });
  return p;
}
const shadow = (x, y, blur, hex, a) => ({ type: 'DROP_SHADOW', color: Object.assign(rgb(hex), { a }), offset: { x, y }, radius: blur, spread: 0, visible: true, blendMode: 'NORMAL' });

// ───────── 元件小工具 ─────────
// F：建立 Auto Layout frame
function F(name, o = {}) {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = o.dir === 'H' ? 'HORIZONTAL' : 'VERTICAL';
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = o.fill ? [paint(o.fill, o.fillOpacity == null ? 1 : o.fillOpacity)] : [];
  if (o.image) f.fills = [o.image];
  f.itemSpacing = o.gap || 0;
  const p = o.pad == null ? 0 : o.pad;
  const [t, r, b, l] = Array.isArray(p) ? (p.length === 2 ? [p[0], p[1], p[0], p[1]] : p) : [p, p, p, p];
  f.paddingTop = t; f.paddingRight = r; f.paddingBottom = b; f.paddingLeft = l;
  f.primaryAxisAlignItems = o.main || 'MIN';
  f.counterAxisAlignItems = o.cross || 'MIN';
  if (o.radius != null) f.cornerRadius = o.radius;
  if (o.stroke) {
    f.strokes = [paint(o.stroke, o.strokeOpacity == null ? 1 : o.strokeOpacity)];
    f.strokeAlign = 'INSIDE';
    f.strokeWeight = o.sw || 2;
    if (o.dash) f.dashPattern = o.dash;
    if (o.sides) { // 只畫某幾邊，例：'T'、'B'、'L'、'TB'
      const w = o.sw || 2;
      f.strokeTopWeight = o.sides.includes('T') ? w : 0;
      f.strokeBottomWeight = o.sides.includes('B') ? w : 0;
      f.strokeLeftWeight = o.sides.includes('L') ? w : 0;
      f.strokeRightWeight = o.sides.includes('R') ? w : 0;
    }
  }
  f.clipsContent = !!o.clip;
  if (o.opacity != null) f.opacity = o.opacity;
  if (o.effects) f.effects = o.effects;
  return f;
}
// add：放進父層並設定 Fill／Hug／Fixed、換行、最小最大寬
function add(parent, child, o = {}) {
  parent.appendChild(child);
  if (o.abs) child.layoutPositioning = 'ABSOLUTE';
  const isText = child.type === 'TEXT';
  if (o.w === 'fill') { child.layoutSizingHorizontal = 'FILL'; if (isText) child.textAutoResize = 'HEIGHT'; }
  else if (typeof o.w === 'number') {
    if (isText) child.textAutoResize = 'HEIGHT';
    child.resize(o.w, Math.max(child.height, 1));
    if (!o.abs) child.layoutSizingHorizontal = 'FIXED';
  }
  if (o.h === 'fill') child.layoutSizingVertical = 'FILL';
  else if (typeof o.h === 'number') { child.resize(child.width, o.h); if (!o.abs) child.layoutSizingVertical = 'FIXED'; }
  if (o.wrap) { child.layoutWrap = 'WRAP'; child.counterAxisSpacing = o.rowGap == null ? child.itemSpacing : o.rowGap; }
  try { if (o.minW != null) child.minWidth = o.minW; } catch (e) {}
  try { if (o.maxW != null) child.maxWidth = o.maxW; } catch (e) {}
  try { if (o.minH != null) child.minHeight = o.minH; } catch (e) {}
  return child;
}
const WEIGHT = { 400: 'Regular', 500: 'Medium', 700: 'Bold', 900: 'Black' };
// T：文字。**粗體** 會轉成粗體範圍；圖層名稱 = 對應網站資料的欄位（回推網頁用）
function T(chars, o = {}) {
  const t = figma.createText();
  let text = String(chars);
  const bold = [];
  if (o.rich) {
    let out = '';
    text.split('**').forEach((part, i) => { if (i % 2) bold.push([out.length, out.length + part.length]); out += part; });
    text = out;
  }
  const base = o.display ? { family: 'Archivo Black', style: 'Regular' } : { family: 'Noto Sans TC', style: WEIGHT[o.weight || 400] };
  t.fontName = base;
  t.characters = text;
  t.fontSize = o.size || BODY;
  t.lineHeight = { unit: 'PERCENT', value: (o.lh || 1.75) * 100 };
  if (o.ls) t.letterSpacing = { unit: 'PERCENT', value: o.ls * 100 };
  if (o.upper) t.textCase = 'UPPER';
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.underline) t.textDecoration = 'UNDERLINE';
  if (o.strike) t.textDecoration = 'STRIKETHROUGH';
  if (o.outline) {
    t.fills = [];
    t.strokes = [paint(o.outline)];
    t.strokeWeight = o.sw || 1.5;
  } else t.fills = [paint(o.color || 'ink', o.colorOpacity == null ? 1 : o.colorOpacity)];
  if (o.opacity != null) t.opacity = o.opacity;
  for (const [s, e] of bold) if (e > s) t.setRangeFontName(s, e, { family: 'Noto Sans TC', style: o.boldStyle || 'Black' });
  // Archivo Black 沒有 ✦ 與中文字：改用 Noto Sans TC
  if (o.display) for (let i = 0; i < text.length; i++) if (/[✦　-鿿＀-￯]/.test(text[i])) t.setRangeFontName(i, i + 1, { family: 'Noto Sans TC', style: 'Black' });
  t.name = o.key || text.slice(0, 24);
  return t;
}
function svg(markup, name, width) {
  const n = figma.createNodeFromSvg(markup);
  n.name = name;
  if (width) n.rescale(width / n.width);
  return n;
}
// CSS 的 rotate 以中心為軸、順時針為正；Figma 以左上角為軸、逆時針為正
function placeRotated(node, cssDeg, cx, cy) {
  const a = (-cssDeg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const w = node.width, h = node.height;
  node.relativeTransform = [[c, s, cx - (c * w / 2 + s * h / 2)], [-s, c, cy - (-s * w / 2 + c * h / 2)]];
}

// 共用元件
function eyebrow(text, key, color = 'ink') {
  const f = F('Eyebrow', { dir: 'H', gap: 10, cross: 'CENTER' });
  const bar = figma.createRectangle();
  bar.name = 'Bar'; bar.resize(28, 3); bar.fills = [paint(color)];
  f.appendChild(bar);
  add(f, T(text, { key, size: 13.1, weight: 700, ls: 0.14, upper: true, color }));
  return f;
}
function button(label, kind, key, arrow) { // kind：ink｜ghost｜accent
  const f = F(`Button｜${label}`, { dir: 'H', gap: 10, cross: 'CENTER', pad: [14, 24], radius: 999, stroke: 'ink', fill: kind === 'ghost' ? null : kind });
  const color = kind === 'ink' ? 'paper' : 'ink';
  add(f, T(label, { key, weight: 700, color }));
  if (arrow) add(f, T(arrow, { key: 'Arrow', weight: 700, color }));
  return f;
}
function pill(text, o = {}) { // 標籤、技能
  const f = F(`Tag｜${text}`, { dir: 'H', pad: [4, 12], radius: 999, stroke: o.stroke || 'ink', sw: 1.5, fill: o.fill });
  add(f, T(text, { key: o.key, size: 13.1, weight: 700, lh: 1.5, color: o.color || 'ink' }));
  return f;
}
// 區塊外框：左右留 gutter，內層 Wrap 最大 1168 置中 → 改稿寬時自動縮放
function section(parent, name, o = {}) {
  const s = add(parent, F(name, Object.assign({ dir: 'V', cross: 'CENTER' }, o, { pad: o.pad || [0, GUTTER] })), { w: 'fill' });
  if (o.minH) s.minHeight = o.minH;
  const wrap = add(s, F('Wrap', { dir: o.wrapDir || 'V', gap: o.gap || 0, main: o.wrapMain || 'MIN', cross: o.wrapCross || 'MIN' }), { w: 'fill', maxW: MAXW, wrap: o.wrapDir === 'H', rowGap: 8 });
  return { s, wrap };
}
function contactLinks(tone) {
  const color = tone === 'dark' ? 'paper' : 'ink';
  const row = F('Contacts', { dir: 'H', gap: 12 });
  P.contacts.forEach((c, i) => {
    const f = F(`Contact｜${c.label}`, { dir: 'H', gap: 10, cross: 'CENTER', pad: [14, 22], radius: 999, stroke: color, dash: c.url ? null : [6, 4], opacity: c.url ? 1 : 0.85 });
    add(f, T(c.label, { key: `contacts.${i}.label`, weight: 700, color }));
    add(f, T(c.url ? '↗' : '連結待補', { key: c.url ? 'Arrow' : '待補提示', size: c.url ? BODY : 12, weight: c.url ? 700 : 500, color }));
    add(row, f);
  });
  return row;
}

// ───────── 頁首、頁尾 ─────────
const LOCK = '<svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="6" width="10" height="7.5" rx="1.5" fill="#152c4c"/><path d="M3 6V4.2a3 3 0 0 1 6 0V6" stroke="#152c4c" stroke-width="1.6"/></svg>';
function header(root) {
  const h = add(root, F('Header', { dir: 'V', cross: 'CENTER', pad: [0, GUTTER], fill: 'paper', fillOpacity: 0.88, stroke: 'ink', strokeOpacity: 0.18, sw: 1, sides: 'B' }), { w: 'fill' });
  const bar = add(h, F('Bar', { dir: 'H', main: 'SPACE_BETWEEN', cross: 'CENTER' }), { w: 'fill', h: HEADER_H, maxW: MAXW });
  add(bar, svg(DATA.logo, 'LOGO', 88));
  const nav = add(bar, F('Nav', { dir: 'H', gap: 20, cross: 'CENTER' }));
  const items = [['介紹'], ['工作方式'], ['作品'], ['關於我', 'lock'], ['聯絡', 'cta']];
  for (const [label, kind] of items) {
    const cta = kind === 'cta';
    const a = add(nav, F(`Link｜${label}`, { dir: 'H', gap: 6, cross: 'CENTER', pad: cta ? [8, 16] : [8, 10], radius: 999, fill: cta ? 'ink' : null }));
    add(a, T(label, { key: `nav.${label}`, size: 15.2, weight: 700, color: cta ? 'paper' : 'ink' }));
    if (kind === 'lock') add(a, svg(LOCK, 'Icon｜鎖'));
  }
}
function footer(root) {
  const { wrap } = section(root, 'Footer', { fill: 'ink', pad: [28, GUTTER], stroke: 'paper', strokeOpacity: 0.2, sw: 1, sides: 'T', wrapDir: 'H', wrapMain: 'SPACE_BETWEEN', wrapCross: 'CENTER', gap: 24 });
  add(wrap, T(`© ${DATA.year} ${P.name}（${P.nameEn}）｜${P.title}`, { key: 'footer.copyright', size: 14.1, color: 'paper' }));
  add(wrap, T('回到頂端 ↑', { key: 'footer.top', size: 14.1, weight: 700, color: 'paper', underline: true }));
}

// ───────── ① 首頁 ─────────
function heroSection(root) {
  const { s, wrap } = section(root, 'Section｜① 主視覺', { main: 'CENTER', pad: [72, GUTTER], clip: true, minH: SCREEN_H, gap: 24, wrapCross: 'CENTER' });
  add(wrap, eyebrow(`${P.name}・${P.nameEn}`, 'name・nameEn'));
  const h1 = add(wrap, F('H1', { gap: 0, cross: 'CENTER', pad: [8, 0] }));
  add(h1, T('Hi, I’m a', { key: 'hero.small', size: 22.4, weight: 700, ls: 0.04, lh: 1.2, align: 'CENTER' }));
  add(h1, T('Product\nDesigner', { key: 'hero.big', display: true, size: 168, lh: 0.95, ls: -0.03, align: 'CENTER' }));
  // 副標：固定前半句＋打字機第一句（黃色螢光筆底線）
  const sub = add(wrap, F('Sub｜打字機', { dir: 'H', cross: 'CENTER' }));
  add(sub, T('我把混亂的需求，', { key: 'hero.subLead', size: 25.6, weight: 700, lh: 1.5 }));
  const hl = add(sub, F('Highlight', { dir: 'H', cross: 'CENTER', gap: 2 }));
  hl.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[0, 1, 0], [-1, 0, 1]], gradientStops: [
    { position: 0, color: Object.assign(rgb(HEX.accent), { a: 0 }) },
    { position: 0.62, color: Object.assign(rgb(HEX.accent), { a: 0 }) },
    { position: 0.621, color: Object.assign(rgb(HEX.accent), { a: 1 }) },
    { position: 1, color: Object.assign(rgb(HEX.accent), { a: 1 }) },
  ] }];
  add(hl, T(P.typewriter[0], { key: 'typewriter.0', size: 25.6, weight: 700, lh: 1.5 }));
  const caret = figma.createRectangle();
  caret.name = 'Caret'; caret.resize(2, 23); caret.fills = [paint('ink')];
  sub.appendChild(caret);
  const actions = add(wrap, F('Actions', { dir: 'H', gap: 12, main: 'CENTER' }));
  add(actions, button('看作品', 'ink', 'hero.ctaWork', '↓'));
  add(actions, button('聯絡我／履歷', 'ghost', 'hero.ctaContact'));
  // 漂浮標籤（裝飾）：Auto Layout 內的絕對定位子層，跟著 Wrap 等比例移動
  const floats = [
    { text: 'PM', key: 'hero.float1', fill: 'ink', color: 'paper', rot: -6, x: 0.16, y: 0.12 },
    { text: 'UI / UX', key: 'hero.float2', fill: 'accent', color: 'ink', rot: 5, right: 0.12, y: 0.30 },
    { text: 'Visual Design', key: 'hero.float3', fill: 'paper', color: 'ink', rot: -3, x: 0.08, y: 0.50 },
  ];
  const ww = wrap.width, wh = wrap.height;
  for (const f of floats) {
    const n = add(wrap, F(`Float｜${f.text}`, { dir: 'H', pad: [10, 22], radius: 999, stroke: 'ink', fill: f.fill }), { abs: true });
    add(n, T(f.text, { key: f.key, size: 20, weight: 900, lh: 1.5, color: f.color }));
    const left = f.right != null ? ww * (1 - f.right) - n.width : ww * f.x;
    placeRotated(n, f.rot, left + n.width / 2, wh * f.y + n.height / 2);
    n.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  }
  return s;
}
function introSection(root) {
  const { wrap } = section(root, 'Section｜② 自我介紹', { pad: [140, GUTTER], stroke: 'ink', sides: 'T' });
  const grid = add(wrap, F('Grid', { dir: 'H', gap: 86, cross: 'CENTER' }), { w: 'fill', wrap: true, rowGap: 48 });
  const text = add(grid, F('Text', {}), { w: 'fill', minW: 360 });
  add(text, eyebrow(P.about.eyebrow, 'about.eyebrow'));
  const h2 = add(text, F('H2', { gap: 12, pad: [16, 0, 24, 0] }), { w: 'fill' });
  const [l1, ...rest] = P.about.heading.split('\n');
  add(h2, T(l1, { key: 'about.heading.0', size: 48, weight: 900, lh: 1.2, ls: -0.01 }), { w: 'fill' });
  if (rest.length) add(h2, T(rest.join('\n'), { key: 'about.heading.1', size: 28.8, weight: 900, lh: 1.2, color: 'inkSoft' }), { w: 'fill' });
  const body = add(text, F('Body', { gap: 18 }), { w: 'fill' });
  P.about.body.forEach((p, i) => add(body, T(p, { key: `about.body.${i}`, color: 'inkSoft' }), { w: 'fill' }));
  const portrait = add(grid, F('Portrait', { pad: 14, fill: 'paper', stroke: 'ink', radius: 14, effects: [shadow(10, 10, 0, HEX.ink, 1)] }), { w: 440 });
  const ph = add(portrait, F('Photo｜佔位（建議 4:5）', { main: 'CENTER', cross: 'CENTER', fill: 'ink6', radius: 8 }), { w: 'fill', h: 515 });
  add(ph, T('個人照片\n（建議 4:5 直式）', { key: 'about.photo.placeholder', size: 14.4, weight: 700, color: 'inkSoft', align: 'CENTER' }));
  portrait.rotation = -2;
}
const ROLE_TONE = [{ fill: 'paper', fg: 'ink' }, { fill: 'accent', fg: 'ink' }, { fill: 'ink', fg: 'paper' }];
// 角色卡一列；open = 展開（Hover）的那張，null = 預設狀態
function rolesRow(root, name, open) {
  const row = add(root, F(name, { dir: 'H', stroke: 'ink', sides: 'T' }), { w: 'fill', h: SCREEN_H });
  const openW = Math.round(W * 1.7 / 3.7);
  const cards = P.roles.map((r, i) => {
    const card = add(row, F(`Role｜${r.key}${open === i ? '（Hover 展開）' : ''}`, { main: 'CENTER', pad: 43, fill: ROLE_TONE[i].fill, clip: true, stroke: i ? 'ink' : null, sides: 'L' }));
    if (open === i) { card.layoutSizingHorizontal = 'FIXED'; card.resize(openW, card.height); } else card.layoutSizingHorizontal = 'FILL';
    card.layoutSizingVertical = 'FILL';
    return card;
  });
  P.roles.forEach((r, i) => {
    const tone = ROLE_TONE[i];
    const isOpen = open === i;
    const card = cards[i];
    const inner = card.width - 86; // 網頁用 container query：字級跟著卡片寬度
    const deco = add(card, T(r.en, { key: `roles.${i}.en`, display: true, size: Math.min(73.6, inner * 0.11), lh: 0.92, ls: -0.02, outline: tone.fg, opacity: isOpen ? 0.14 : 0.5 }), { abs: true });
    deco.textAutoResize = 'HEIGHT';
    deco.resize(card.width - 29 - 16, deco.height);
    deco.x = 29;
    deco.y = card.height - 28 - deco.height + (isOpen ? 12 : 0);
    deco.constraints = { horizontal: 'STRETCH', vertical: 'MAX' };
    const box = add(card, F('Inner', {}), { w: 'fill' });
    if (isOpen) add(box, F('Icon', { pad: [0, 0, 20, 0] })).appendChild(svg(DATA.roleIcons[i].replace(/currentColor/g, HEX[tone.fg]), `Icon｜${r.key}`, 63));
    add(box, T(r.key, { key: `roles.${i}.key`, display: true, size: isOpen ? Math.min(70.4, inner * 0.12) : Math.min(115.2, inner * 0.19), lh: 1, ls: -0.02, color: tone.fg }));
    if (isOpen) {
      const d = add(box, F('Detail', { gap: 12, pad: [20, 0, 0, 0] }), { w: 'fill', maxW: 540 });
      add(d, T(r.title, { key: `roles.${i}.title`, size: 21.6, weight: 900, lh: 1.4, color: tone.fg }), { w: 'fill' });
      add(d, T(r.body, { key: `roles.${i}.body`, color: tone.fg, opacity: 0.85 }), { w: 'fill' });
      const tags = add(d, F('Tags', { dir: 'H', gap: 8, pad: [4, 0, 0, 0] }), { w: 'fill', wrap: true });
      r.highlights.forEach((h, j) => add(tags, pill(h, { key: `roles.${i}.highlights.${j}`, stroke: tone.fg, color: tone.fg })));
    }
  });
  return row;
}
function approachSection(root) {
  const { wrap } = section(root, 'Section｜④ 工作方式（疊卡）', { fill: 'ink', main: 'CENTER', pad: [36, GUTTER], minH: SCREEN_H, wrapCross: 'CENTER' });
  const head = add(wrap, F('SecHead', { cross: 'CENTER', gap: 12, pad: [0, 0, 36, 0] }), { w: 'fill', maxW: 792 });
  add(head, eyebrow('How I Work', 'approach.eyebrow', 'paper'));
  add(head, T(`「${P.philosophy}」`, { key: 'philosophy', size: 57.6, weight: 900, lh: 1.2, color: 'paper', align: 'CENTER' }), { w: 'fill' });
  // 三張卡疊在一起：第 1 張在最上面（排版流內），第 2、3 張用絕對定位疊在後面
  const deck = add(wrap, F('Deck｜往下捲動時依序抽走', {}), { w: 560 });
  const cards = P.traits.map((t, i) => {
    const c = F(`Card｜0${i + 1} ${t.name}`, { pad: 48, radius: 20, fill: 'paper', clip: true, effects: [shadow(0, 24, 48, '#000000', 0.28)] });
    c.resize(560, 100);
    c.primaryAxisSizingMode = 'AUTO';
    c.counterAxisSizingMode = 'FIXED';
    const en = add(c, F('Tag｜英文', { dir: 'H', pad: [2, 8], fill: 'accent' }));
    add(en, T(t.en, { key: `traits.${i}.en`, display: true, size: 12.8, ls: 0.08, upper: true }));
    const h3 = add(c, F('H3', { pad: [16, 0, 10, 0] }), { w: 'fill' });
    add(h3, T(t.name, { key: `traits.${i}.name`, size: 37.4, weight: 900, lh: 1.2 }), { w: 'fill' });
    add(c, T(t.body, { key: `traits.${i}.body`, size: 16.8, color: 'inkSoft' }), { w: 'fill' });
    const num = add(c, T(`0${i + 1}`, { key: 'Deco｜編號', display: true, size: 72, lh: 1, outline: 'ink', opacity: 0.25 }), { abs: true });
    num.x = c.width - num.width - 16; num.y = 4;
    num.constraints = { horizontal: 'MAX', vertical: 'MIN' };
    return c;
  });
  const maxH = Math.max(...cards.map((c) => c.height));
  const tilt = [0, 3, -4];
  // 後面的先放（z 順序在下）；第 1 張留在排版流內，第 2、3 張絕對定位疊在後面
  for (let i = cards.length - 1; i >= 0; i--) {
    const c = cards[i];
    if (!i) { add(deck, c, { w: 'fill', minH: maxH }); continue; }
    add(deck, c, { abs: true });
    c.resize(560, maxH);
    placeRotated(c, tilt[i], 280, maxH / 2 + i * 18);
    c.constraints = { horizontal: 'CENTER', vertical: 'MIN' };
  }
  const count = add(wrap, F('Counter', { pad: [27, 0, 0, 0] }));
  add(count, T(`01 / 0${P.traits.length}`, { key: 'Deco｜頁碼', display: true, ls: 0.1, color: 'accent' }));
}
const TABS = ['產品設計', '平面設計', '網頁設計'];
function tabsRow(selected) {
  const row = F('Tabs', { dir: 'H', gap: 8, main: 'CENTER' });
  TABS.forEach((label, i) => {
    const on = i === selected;
    const tab = add(row, F(`Tab｜${label}${on ? '（選取）' : ''}`, { dir: 'H', gap: 8, cross: 'CENTER', pad: [10, 22], radius: 999, stroke: 'ink', fill: on ? 'ink' : null }));
    add(tab, T(label, { key: `tabs.${i}`, weight: 700, color: on ? 'paper' : 'ink' }));
    const cnt = add(tab, F('Count', { dir: 'H', main: 'CENTER', pad: [0, 6], radius: 999, fill: on ? 'paper' : 'ink', fillOpacity: 0.18 }), { minW: 22 });
    add(cnt, T(String(DATA.cases.filter((c) => c.category === label).length), { key: 'Deco｜數量', size: 12, weight: 700, color: on ? 'paper' : 'ink', align: 'CENTER' }));
  });
  return row;
}
function workCard(list, c) {
  const card = add(list, F(`WorkCard｜${c.title}`, { dir: 'H', gap: 40, pad: 20, stroke: 'ink', radius: 20, fill: 'paper' }), { w: 'fill', wrap: true, rowGap: 20 });
  const k = `cases.${c.id}`;
  const hash = DATA.covers[c.id] ? figma.createImage(figma.base64Decode(DATA.covers[c.id])).hash : null;
  const cover = F(`Cover｜${c.id}`, hash
    ? { radius: 12, stroke: 'ink', strokeOpacity: 0.18, sw: 1.5, clip: true, image: { type: 'IMAGE', scaleMode: 'FILL', imageHash: hash } }
    : { radius: 12, stroke: 'ink', strokeOpacity: 0.18, sw: 1.5, clip: true, fill: 'ink6', main: 'CENTER', cross: 'CENTER' });
  add(card, cover, { w: 'fill', h: 264, minW: 280, maxW: 423 });
  if (!DATA.covers[c.id]) add(cover, T('作品圖檔\n（建議 16:10）', { key: 'Deco｜佔位', size: 14.4, weight: 700, color: 'inkSoft', align: 'CENTER' }));
  const body = add(card, F('Body', { gap: 12, pad: [4, 0], main: 'SPACE_BETWEEN' }), { w: 'fill', minW: 300, minH: 264 });
  const top = add(body, F('Top', { gap: 12 }), { w: 'fill' });
  const meta = add(top, F('Meta', { dir: 'H', main: 'SPACE_BETWEEN', gap: 12 }), { w: 'fill' });
  add(meta, T(c.date, { key: `${k}.date`, size: 15.3, weight: 700, color: 'inkSoft' }));
  add(meta, T(c.kind, { key: `${k}.kind`, size: 15.3, weight: 700, color: 'inkSoft' }));
  const h3 = add(top, F('Title', { dir: 'H', gap: 12, cross: 'CENTER' }), { w: 'fill', wrap: true, rowGap: 8 });
  add(h3, T(c.title, { key: `${k}.title`, size: 33.6, weight: 900, lh: 1.2 }), { maxW: 560 });
  if (c.template) {
    const tpl = add(h3, F('Badge｜範本', { dir: 'H', pad: [2, 8], radius: 6, stroke: 'ink', sw: 1.5, dash: [4, 3] }));
    add(tpl, T('範本', { key: 'Deco｜範本', size: 12, weight: 700 }));
  }
  add(top, T(c.summary, { key: `${k}.summary`, color: 'inkSoft' }), { w: 'fill' });
  const skills = add(body, F('Skills', { dir: 'H', gap: 8 }), { w: 'fill', wrap: true });
  c.skills.forEach((s, i) => add(skills, pill(`#${s}`, { key: `${k}.skills.${i}`, fill: i ? null : 'ink', color: i ? 'ink' : 'paper' })));
}
function workList(parent, category) {
  const list = add(parent, F(`List｜${category}`, { gap: 24 }), { w: 'fill', maxW: 1080 });
  for (const c of DATA.cases.filter((x) => x.category === category)) workCard(list, c);
  return list;
}
function workSection(root) {
  const { wrap } = section(root, 'Section｜⑤ 作品', { pad: [140, GUTTER], wrapCross: 'CENTER' });
  const head = add(wrap, F('SecHead', { cross: 'CENTER', gap: 12, pad: [0, 0, 64, 0] }));
  add(head, eyebrow('Selected Work', 'work.eyebrow'));
  add(head, T('作品', { key: 'work.title', size: 76.8, weight: 900, lh: 1.2, ls: -0.02 }));
  const tabs = add(wrap, F('TabsWrap', { pad: [0, 0, 56, 0] }));
  add(tabs, tabsRow(0));
  workList(wrap, TABS[0]);
}
function contactSection(root) {
  const s = add(root, F('Section｜⑥ 聯絡', { fill: 'ink', cross: 'CENTER' }), { w: 'fill' });
  const band = add(s, F('Band｜跑馬燈（往右捲動）', { dir: 'H', pad: [8, 0], fill: 'ink', clip: true, stroke: 'paper', sides: 'TB' }), { w: 'fill' });
  add(band, T('LET’S TALK ✦ LET’S TALK ✦ LET’S TALK ✦ LET’S TALK ✦ ', { key: 'contact.marquee', display: true, size: 144, lh: 1.15, ls: -0.02, color: 'accent' }));
  const box = add(s, F('Container', { cross: 'CENTER', pad: [140, GUTTER] }), { w: 'fill' });
  const wrap = add(box, F('Wrap', { gap: 24 }), { w: 'fill', maxW: MAXW });
  add(wrap, T('一起聊聊下一個\n複雜的產品問題。', { key: 'contact.title', size: 89.6, weight: 900, lh: 1.2, ls: -0.01, color: 'paper' }), { w: 'fill' });
  add(wrap, T('履歷與聯絡管道如下；完整的經歷與自我介紹在「關於我」（需密碼）。', { key: 'contact.body', color: 'paper85' }), { w: 'fill' });
  add(wrap, contactLinks('dark'), { w: 'fill', wrap: true });
  add(wrap, button('前往關於我（需密碼）', 'accent', 'contact.ctaAbout', '→'));
}
function buildHome(root) {
  header(root);
  heroSection(root);
  introSection(root);
  rolesRow(root, 'Section｜③ 角色卡（預設：Hover 才展開內容）', null);
  approachSection(root);
  workSection(root);
  contactSection(root);
  footer(root);
}

// ───────── 01b 互動狀態 ─────────
function note(root, text) {
  const n = add(root, F(`Note｜${text}`, { dir: 'H', gap: 12, cross: 'CENTER', pad: [32, GUTTER, 16, GUTTER], fill: 'ink6' }), { w: 'fill' });
  const dot = add(n, F('Dot', { radius: 999, fill: 'accent', stroke: 'ink', sw: 2 }), { w: 14, h: 14 });
  dot.resize(14, 14);
  add(n, T(text, { key: 'Note', size: 15.2, weight: 900 }));
}
function buildStates(root) {
  P.roles.forEach((r, i) => {
    note(root, `③ 角色卡｜Hover「${r.key}」：卡片放大 1.7 倍，出現 icon、標題、內文與技能標籤（這裡是角色卡內文的編輯位置）`);
    rolesRow(root, `Roles｜Hover ${r.key}`, i);
  });
  note(root, '① 主視覺｜打字機輪播句子（前面固定接「我把混亂的需求，」）');
  const tw = section(root, 'Typewriter｜輪播句子', { pad: [24, GUTTER, 48, GUTTER], gap: 12 }).wrap;
  P.typewriter.forEach((t, i) => {
    const row = add(tw, F(`Line｜${i + 1}`, { dir: 'H', gap: 16, cross: 'CENTER' }));
    add(row, T(String(i + 1).padStart(2, '0'), { key: 'Deco｜序號', display: true, color: 'inkSoft' }));
    add(row, T(t, { key: `typewriter.${i}`, size: 25.6, weight: 700, lh: 1.5 }));
  });
  [1, 2].forEach((sel) => {
    note(root, `⑤ 作品｜Tab 切到「${TABS[sel]}」`);
    const { wrap } = section(root, `Work｜${TABS[sel]}`, { pad: [48, GUTTER, 96, GUTTER], wrapCross: 'CENTER' });
    const tabs = add(wrap, F('TabsWrap', { pad: [0, 0, 56, 0] }));
    add(tabs, tabsRow(sel));
    workList(wrap, TABS[sel]);
  });
}

// ───────── 02 案例頁 ─────────
const SEC = { n: 0 };
// 放一張圖：寬度 Fill，高度依原比例；沒有圖就畫佔位框
function picture(parent, src, w, name, o = {}) {
  const vec = src && DATA.svgs && DATA.svgs[src];
  if (vec) { // SVG：畫成可編輯的向量，依寬度等比縮放
    const n = svg(vec, `Vector｜${src.split('/').pop()}`, w);
    const holder = add(parent, F(`${name}｜${src.split('/').pop()}`, { main: 'CENTER', cross: 'CENTER' }), { w: o.fixed ? w : 'fill', h: Math.max(1, Math.round(n.height)) });
    holder.appendChild(n);
    return holder;
  }
  const pic = src && DATA.images && DATA.images[src];
  if (!pic) {
    const ph = add(parent, F(`${name}｜佔位`, { main: 'CENTER', cross: 'CENTER', pad: 24, radius: o.radius || 14, fill: 'ink6', stroke: 'ink', strokeOpacity: 0.18 }), { w: 'fill', h: Math.round(w * 9 / 16) });
    add(ph, T(o.ph || '畫面待補', { key: o.key || 'Deco｜佔位', weight: 700, color: 'inkSoft', align: 'CENTER' }));
    return ph;
  }
  const img = figma.createImage(figma.base64Decode(pic.b64));
  const f = add(parent, F(`${name}｜${src.split('/').pop()}`, { radius: o.radius || 14, stroke: o.stroke || 'ink', strokeOpacity: o.strokeOpacity == null ? 0.18 : o.strokeOpacity, sw: o.sw || 2, clip: true, effects: o.effects }), { w: 'fill', h: Math.round(w * pic.h / pic.w) });
  f.fills = o.bg === false ? [{ type: 'IMAGE', scaleMode: 'FIT', imageHash: img.hash }] : [{ type: 'SOLID', color: rgb('#ffffff') }, { type: 'IMAGE', scaleMode: 'FIT', imageHash: img.hash }];
  return f;
}
function cssGradient(bg) { // linear-gradient(135deg,#A,#B) → Figma 斜向漸層
  const c = bg.match(/#[0-9a-f]{6}/gi) || ['#cccccc', '#999999'];
  return { type: 'GRADIENT_LINEAR', gradientTransform: [[0.5, 0.5, 0], [-0.5, 0.5, 0.5]], gradientStops: c.map((h, i) => ({ position: i / (c.length - 1), color: Object.assign(rgb(h), { a: 1 }) })) };
}
// ── 品牌 CIS 案例用：待補小標籤、佔位框、圖片有無判斷
const hasPic = (src) => !!(src && ((DATA.images || {})[src] || (DATA.svgs || {})[src]));
function pendTag(parent, text, key) {
  const f = add(parent, F('Pending｜待補', { dir: 'H', pad: [0, 8], radius: 6, stroke: 'ink', sw: 1.5, dash: [4, 3], fill: 'accent35' }));
  add(f, T(text, { key, size: 12.8, weight: 700, lh: 1.7 }));
  return f;
}
function phBox(parent, text, key, h, o = {}) {
  const ph = add(parent, F(`${o.name || 'Figure'}｜佔位`, { main: 'CENTER', cross: 'CENTER', pad: o.pad == null ? 24 : o.pad, radius: o.radius || 14, fill: 'ink6', stroke: 'ink', strokeOpacity: 0.18 }), { w: 'fill', h });
  add(ph, T(text, { key, size: o.size || BODY, weight: 700, color: 'inkSoft', align: 'CENTER' }), { w: 'fill' });
  return ph;
}
function media(parent, src, phText, key, w, h, o = {}) { // 有圖放圖、沒圖放佔位
  if (hasPic(src)) return picture(parent, src, w, 'Image', Object.assign({ radius: 14 }, o));
  return phBox(parent, phText || '圖片待補', key, h, o);
}
const ILLUS = { handoff: null, team: null }; // ③ 產生新版時，從舊案例頁複製過來的手繪插圖
function proseBlock(prose, b, k) {
  const fill = { w: 'fill' };
  switch (b.type) {
    case 'h2': {
      const h = add(prose, F('H2', { dir: 'H', gap: 16, cross: 'CENTER', pad: [65, 0, 10, 0] }), fill);
      SEC.n += 1;
      const badge = add(h, F('Badge｜序號', { dir: 'H', pad: [0, 10], radius: 8, fill: 'accent' }));
      add(badge, T(String(SEC.n).padStart(2, '0'), { key: 'Deco｜序號', display: true, size: 24.2, lh: 1.2 }));
      add(h, T(b.text, { key: k, size: 34.6, weight: 900, lh: 1.2 }), fill);
      break;
    }
    case 'h3': {
      const h = add(prose, F('H3', { pad: [17, 0, 0, 0] }), fill);
      add(h, T(b.text, { key: k, size: 19.2, weight: 900, lh: 1.2 }), fill);
      break;
    }
    case 'p': add(prose, T(b.text, { key: k, rich: true }), fill); break;
    case 'ul': case 'ol': case 'priority': case 'steps': {
      const list = add(prose, F(`List｜${b.type}`, { gap: b.type === 'ul' || b.type === 'ol' ? 9 : 12 }), fill);
      b.items.forEach((it, i) => {
        const row = add(list, F('Item', { dir: 'H', gap: b.type === 'ul' ? 10 : 16 }), fill);
        if (b.type === 'ul') add(row, T('•', { key: 'Deco｜項目符號', weight: 900 }));
        else if (b.type === 'ol') add(row, T(`${i + 1}.`, { key: 'Deco｜序號', weight: 700 }));
        else {
          const dot = add(row, F('Num', { main: 'CENTER', cross: 'CENTER', radius: 999, stroke: 'ink', fill: b.type === 'priority' && i === 0 ? 'accent' : null }), { w: 28, h: 28 });
          add(dot, T(String(i + 1), { key: 'Deco｜序號', size: 13.1, weight: 900, lh: 1 }));
        }
        add(row, T(it, { key: `${k}.${i}`, rich: true }), fill);
      });
      break;
    }
    case 'table': {
      const tb = add(prose, F('Table', {}), fill);
      [b.head, ...b.rows].forEach((cells, r) => {
        const row = add(tb, F(r ? `Row｜${r}` : 'Row｜表頭', { dir: 'H', stroke: 'ink', strokeOpacity: r ? 0.18 : 1, sw: r ? 1.5 : 2, sides: 'B' }), fill);
        cells.forEach((cell, c) => {
          const td = add(row, F('Cell', { pad: [10, 12] }), fill);
          add(td, T(cell, { key: `${k}.${r}.${c}`, size: 15.2, weight: r ? 400 : 900, rich: true }), fill);
        });
      });
      break;
    }
    case 'when': add(prose, T(b.text, { key: k, size: 14.7, color: 'inkSoft' }), fill); break;
    case 'aboutintro': {
      const top = add(prose, F('Intro｜介紹＋插畫', { dir: 'H', gap: 48, cross: 'CENTER' }), fill);
      const txt = add(top, F('Text', { gap: 14 }), fill);
      add(txt, T(b.sub, { key: `${k}.sub` }), fill);
      if (b.tags && b.tags.length) {
        const tags = add(txt, F('Tags', { dir: 'H', gap: 8 }), { w: 'fill', wrap: true, rowGap: 8 });
        b.tags.forEach((t, j) => add(tags, pill(t, { key: `${k}.tags.${j}` })));
      }
      if (b.img && DATA.images && DATA.images[b.img]) { // 右側插畫：透明背景，不加底色與外框（寬約 (1168-48)/2）
        picture(top, b.img, 560, 'Illustration', { bg: false, strokeOpacity: 0, radius: 0 });
      } else {
        const art = add(top, F('Illustration｜插畫預留', { main: 'CENTER', cross: 'CENTER', radius: 20, stroke: 'ink', strokeOpacity: 0.3, dash: [8, 6] }), { w: 'fill', h: 260 });
        add(art, T(b.art || '插畫預留', { key: 'Note｜插畫預留', size: 14.4, weight: 700, color: 'inkSoft' }));
      }
      // 三張流程卡：沒有外框，外框改包 icon；卡與卡之間放流程箭頭
      const g = add(prose, F('Cards｜三步流程', { dir: 'H', gap: 12, main: 'CENTER', pad: [38, 0, 0, 0] }), fill);
      const ARROW = '<svg xmlns="http://www.w3.org/2000/svg" width="56" height="14" viewBox="0 0 56 14" fill="none" stroke="#152c4c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7H50" stroke-dasharray="4 6"/><path d="M45 2L51 7L45 12"/></svg>';
      b.cards.forEach((c, i) => {
        if (i) { const a = add(g, F('Arrow｜流程', { pad: [37, 0, 0, 0] })); add(a, svg(ARROW, 'Icon｜流程箭頭')); }
        const card = add(g, F(`Card｜${c.title}`, { gap: 6, cross: 'CENTER' }), { w: 320 });
        const ic = add(card, F('IconWrap', { main: 'CENTER', cross: 'CENTER', radius: 20, stroke: 'ink', fill: 'accent22' }), { w: 88, h: 88 });
        add(ic, svg(c.svg, `Icon｜${c.title}`, 76));
        add(card, F('Gap', {}), { h: 10 });
        add(card, T(c.title, { key: `${k}.cards.${i}.title`, size: 19.2, weight: 900, lh: 1.4, align: 'CENTER' }), fill);
        add(card, T(c.desc, { key: `${k}.cards.${i}.desc`, size: 15.2, color: 'inkSoft', align: 'CENTER' }), fill);
      });
      break;
    }
    case 'skills': { // 技能三欄兩列：圓形 icon＋標題＋一句說明
      const grid = add(prose, F('Skills｜技能', { gap: 32, pad: [8, 0, 0, 0] }), fill);
      for (let r = 0; r < b.items.length; r += 3) {
        const row = add(grid, F('Row', { dir: 'H', gap: 40 }), fill);
        b.items.slice(r, r + 3).forEach((s, j) => {
          const i = r + j;
          const it = add(row, F(`Skill｜${s.title}`, { dir: 'H', gap: 18, cross: 'CENTER' }), fill);
          const badge = add(it, F('Badge｜圓形 icon', { main: 'CENTER', cross: 'CENTER', radius: 999, fill: 'accent22', stroke: 'ink', strokeOpacity: 0.18, sw: 1.5 }), { w: 64, h: 64 });
          if (s.svg) add(badge, svg(s.svg, `Icon｜${s.title}`, 26));
          const txt = add(it, F('Text', { gap: 2 }), fill);
          add(txt, T(s.title, { key: `${k}.${i}.title`, size: 18.4, weight: 900, lh: 1.4 }), fill);
          add(txt, T(s.desc, { key: `${k}.${i}.desc`, size: 15.2, color: 'inkSoft' }), fill);
        });
      }
      break;
    }
    case 'capabilities': { // 三欄能力卡（icon＋標題＋說明）；案例 CTA 連結推到卡片底部，三欄才會對齊
      const row = add(prose, F('Capabilities｜核心能力', { dir: 'H', gap: 20, pad: [8, 0, 0, 0] }), fill);
      b.items.forEach((c, i) => {
        const card = add(row, F(`Capability｜${c.title}`, { gap: 16, main: 'SPACE_BETWEEN', pad: 24, radius: 20, stroke: 'ink' }), { w: 'fill', h: 'fill' });
        const head = add(card, F('Head', { gap: 8 }), fill);
        if (c.svg) {
          const ic = add(head, F('IconWrap', { main: 'CENTER', cross: 'CENTER', radius: 16, stroke: 'ink', fill: 'accent22' }), { w: 64, h: 64 });
          add(ic, svg(c.svg, `Icon｜${c.title}`, 56));
          add(head, F('Gap', {}), { h: 8 });
        }
        add(head, T(c.title, { key: `${k}.${i}.title`, size: 20, weight: 900, lh: 1.4 }), fill);
        add(head, T(c.desc, { key: `${k}.${i}.desc`, size: 15.2, color: 'inkSoft' }), fill);
        const list = add(card, F('Links｜案例 CTA', { gap: 8 }), fill);
        c.links.forEach((l, j) => {
          const a = add(list, F(`Link｜${l.title}`, { dir: 'H', gap: 6, cross: 'CENTER' }));
          add(a, T(l.title, { key: `${k}.${i}.links.${j}`, size: 15.2, weight: 700, underline: true }));
          add(a, T('→', { key: 'Arrow', size: 15.2, weight: 700 }));
        });
      });
      break;
    }
    case 'timeline': { // 跟網頁一樣：橫向時間軸（左舊右新）＋選中現職的詳細卡片；其他公司的詳細區圖層先隱藏，打開眼睛即可編輯
      const exp = add(prose, F('Experience', { pad: [8, 0, 0, 0] }), fill);
      const axis = add(exp, F('Timeline｜橫向', { dir: 'H' }), fill);
      tlStops(axis, b.items.map((it, i) => ({ it, i })).reverse(), k, false);
      b.items.forEach((it, i) => { tlPanel(exp, it, i, k, false).visible = i === 0; });
      break;
    }
    case 'todo': {
      const box = add(prose, F('Todo｜待補', { dir: 'H', gap: 12, pad: [14, 18, 14, 16], radius: 12, stroke: 'ink', dash: [6, 4], fill: 'accent35' }), fill);
      add(box, T('✎', { key: 'Deco｜筆', size: 15.2, weight: 900 }));
      add(box, T(b.text, { key: k, size: 15.2, weight: 500, rich: true }), fill);
      break;
    }
    case 'scope': {
      const sc = add(prose, F('Scope｜做／不做', { dir: 'H', gap: 10 }), { w: 'fill', wrap: true, rowGap: 10 });
      b.rows.forEach((r, i) => {
        const on = r.kind === 'in';
        const row = add(sc, F(`Row｜${r.mark}`, { gap: 16, pad: [16, 18], radius: 14, stroke: on ? 'ink' : 'inkSoft', dash: on ? null : [6, 4], fill: on ? 'accent' : null }), { w: 'fill', minW: 240 });
        const col = add(row, F('Mark', {}));
        const m = add(col, F('Pill', { dir: 'H', pad: [2, 10], radius: 999, stroke: on ? 'ink' : 'inkSoft', sw: 1.5, fill: on ? 'ink' : null }));
        add(m, T(r.mark, { key: `${k}.${i}.mark`, size: 13.1, weight: 900, color: on ? 'paper' : 'inkSoft' }));
        const txt = add(row, F('Text', { gap: 4 }), fill);
        add(txt, T(r.title, { key: `${k}.${i}.title`, weight: 900, color: on ? 'ink' : 'inkSoft', strike: !on }), fill);
        add(txt, T(r.desc, { key: `${k}.${i}.desc`, size: 15.2, color: on ? 'ink' : 'inkSoft' }), fill);
      });
      break;
    }
    case 'decisions': {
      const g = add(prose, F('Decisions｜決策卡', { dir: 'H', gap: 14 }), { w: 'fill', wrap: true, rowGap: 14 });
      b.items.forEach((d, i) => {
        const card = add(g, F(`Decision｜${i + 1}`, { gap: 10, pad: [18, 20], radius: 16, stroke: 'ink' }), { w: 'fill', minW: d.wide ? 1000 : 320 });
        const box = d.wide ? add(card, F('Text', { gap: 10 }), { w: 'fill', maxW: 718 }) : card;
        add(box, T(d.q, { key: `${k}.${i}.q`, weight: 900 }), fill);
        const body = d.img ? add(box, F('Body', { dir: 'H', gap: 10 }), fill) : box;
        const a = add(body, F('Answer', { pad: [0, 0, 0, 12], stroke: 'accent', sw: 4, sides: 'L' }), fill);
        add(a, T(d.a, { key: `${k}.${i}.a`, weight: 500 }), fill);
        const pic = d.img && DATA.images && DATA.images[d.img];
        if (pic) {
          const img = figma.createImage(figma.base64Decode(pic.b64));
          add(body, F(`Figure｜${d.img.split('/').pop()}`, { image: { type: 'IMAGE', scaleMode: 'FIT', imageHash: img.hash } }), { w: d.imgW, h: d.imgH });
        }
        add(box, T(`**理由｜**${d.why}`, { key: `${k}.${i}.why`, size: 14.4, color: 'inkSoft', rich: true, boldStyle: 'Bold' }), fill);
      });
      break;
    }
    case 'lanes': {
      const ln = add(prose, F('Lanes｜前後台流程', { radius: 16, stroke: 'ink', clip: true }), fill);
      const head = add(ln, F('Head', { dir: 'H', gap: 12, cross: 'CENTER', pad: [14, 18], fill: 'ink' }), fill);
      b.head.forEach((h, i) => add(head, T(h, { key: `${k}.head.${i}`, size: 13.1, weight: 900, ls: 0.08, color: 'paper', align: ['LEFT', 'CENTER', 'RIGHT'][i] }), i === 1 ? { w: 120 } : fill));
      b.rows.forEach((r, i) => {
        const row = add(ln, F(`Lane｜${r.state}`, { dir: 'H', gap: 12, cross: 'CENTER', pad: [14, 18], stroke: 'ink', strokeOpacity: 0.18, sw: 1.5, sides: 'T' }), fill);
        add(row, T(r.left, { key: `${k}.${i}.left`, size: 14.7 }), fill);
        const col = add(row, F('State', { dir: 'H', main: 'CENTER' }), { w: 120 });
        const st = add(col, F('Pill', { dir: 'H', pad: [4, 10], radius: 999, stroke: 'ink', fill: r.stateKind === 'active' ? 'accent' : r.stateKind === 'done' ? 'ink' : null }));
        add(st, T(r.state, { key: `${k}.${i}.state`, size: 13.6, weight: 900, color: r.stateKind === 'done' ? 'paper' : 'ink' }));
        add(row, T(r.right, { key: `${k}.${i}.right`, size: 14.7, align: 'RIGHT' }), fill);
      });
      break;
    }
    case 'split': { // 左圖右文（is-origin = 左文右圖）
      const row = add(prose, F(b.textFirst ? 'Split｜左文右圖' : 'Split｜左圖右文', { dir: 'H', gap: 24, cross: b.textFirst ? 'CENTER' : 'MIN' }), fill);
      const W1 = b.textFirst ? 427 : 587;
      const media = () => {
        if (ILLUS.handoff && !b.textFirst) { const n = ILLUS.handoff; ILLUS.handoff = null; row.appendChild(n); n.rescale(W1 / n.width); n.name = 'Illustration｜Bot-1v1-Handoff'; }
        else if (b.img && DATA.images && DATA.images[b.img]) { const col = add(row, F('Media', {}), { w: W1 }); picture(col, b.img, W1, 'Image', { radius: 16, strokeOpacity: 0 }); }
        else { const ph = add(row, F('Figure｜示意圖佔位', { main: 'CENTER', cross: 'CENTER', pad: 24, radius: 20, fill: 'ink6', stroke: 'ink', strokeOpacity: 0.18 }), { w: W1, h: Math.round(W1 * 371 / 599) }); add(ph, T(b.ph, { key: `${k}.ph`, weight: 700, color: 'inkSoft', align: 'CENTER' }), { w: 'fill' }); }
      };
      if (!b.textFirst) media();
      const txt = add(row, F('Text', { gap: 18 }), fill);
      (b.parts && b.parts.length ? b.parts : b.paras.map((text) => ({ type: 'p', text }))).forEach((part, i) => proseBlock(txt, part, `${k}.${i}`));
      if (b.textFirst) media();
      break;
    }
    case 'row': { // 左邊文字／表格，右邊圖或色階並排
      const isRule = b.kind === 'rule-map';
      const row = add(prose, F(isRule ? 'Row｜對照表＋LOGO' : 'Row｜文字＋色階', { dir: 'H', gap: 18, cross: isRule ? 'CENTER' : 'MIN' }), fill);
      const left = add(row, F('Text', { gap: 18 }), fill);
      b.parts.forEach((part, i) => proseBlock(left, part, `${k}.${i}`));
      if (b.side && b.side.type === 'img') {
        if ((DATA.images && DATA.images[b.side.img]) || (DATA.svgs && DATA.svgs[b.side.img])) { const col = add(row, F('Media', {}), { w: 368 }); picture(col, b.side.img, 368, 'Image', { strokeOpacity: 0 }); }
      } else if (b.side) { const col = add(row, F('Side', {}), fill); proseBlock(col, b.side, `${k}.side`); }
      break;
    }

    // ───── 品牌 CIS 案例（07-brand-cis.md）─────
    case 'cissub': add(prose, T(b.text, { key: k, size: 20.8, weight: 700, lh: 1.5 }), fill); break;
    case 'cistext': add(prose, T(b.text, { key: k, rich: true }), { w: 'fill', maxW: 756 }); break;
    case 'cislabel': {
      const h = add(prose, F('Label', { pad: [14, 0, 0, 0] }), fill);
      add(h, T(b.text, { key: k, size: 14.4, weight: 900, ls: 0.12, lh: 1.4, color: 'inkSoft' }), fill);
      break;
    }
    case 'cisinfo': { // 基本資訊：四欄，上緣粗線
      const row = add(prose, F('Info｜基本資訊', { dir: 'H', gap: 28, pad: [0, 0, 10, 0] }), fill);
      b.items.forEach((it, i) => {
        const c = add(row, F(`Info｜${it.label}`, { gap: 4, pad: [10, 0, 0, 0], stroke: 'ink', sides: 'T' }), { w: 'fill', h: 'fill' });
        add(c, T(it.label, { key: `${k}.${i}.label`, size: 13.1, weight: 900, ls: 0.12, lh: 1.5, color: 'inkSoft' }), fill);
        if (it.value) add(c, T(it.value, { key: `${k}.${i}.value`, size: 17.6, weight: 700, lh: 1.5 }), fill);
        it.list.forEach((li, j) => add(c, T(`・${li}`, { key: `${k}.${i}.${j}`, size: 17.6, weight: 700, lh: 1.5 }), fill));
        it.pending.forEach((t, j) => pendTag(c, t, `${k}.${i}.pending.${j}`));
      });
      break;
    }
    case 'cisfig': { // 封面／總覽大圖＋圖說
      const fig = add(prose, F('Figure', { gap: 8, pad: [10, 0, 14, 0] }), fill);
      media(fig, b.img, b.ph, `${k}.ph`, MAXW, Math.round(MAXW * 9 / 16), { radius: 20 });
      if (b.caption) add(fig, T(b.caption, { key: `${k}.caption`, size: 14.1, lh: 1.6, color: 'inkSoft', rich: true, boldStyle: 'Bold' }), fill);
      break;
    }
    case 'cisgoals': { // 專案目標：三張卡，序號＋icon
      const row = add(prose, F('Goals｜專案目標', { dir: 'H', gap: 12, pad: [0, 0, 10, 0] }), fill);
      b.items.forEach((it, i) => {
        const c = add(row, F(`Goal｜${it.title}`, { gap: 6, pad: [16, 18], radius: 14, stroke: 'ink' }), { w: 'fill', h: 'fill' });
        const top = add(c, F('Top', { dir: 'H', main: 'SPACE_BETWEEN', cross: 'CENTER' }), fill);
        const badge = add(top, F('Badge｜序號', { dir: 'H', pad: [0, 8], radius: 6, fill: 'accent' }));
        add(badge, T(String(i + 1).padStart(2, '0'), { key: 'Deco｜序號', display: true, size: 14.4, lh: 1.6 }));
        const ic = it.icon && DATA.icons && DATA.icons[it.icon];
        if (ic) add(top, svg(ic, `Icon｜${it.icon.split('/').pop()}`, 40));
        add(c, T(it.title, { key: `${k}.${i}.title`, weight: 900 }), fill);
        add(c, T(it.desc, { key: `${k}.${i}.desc`, size: 15.2 }), fill);
      });
      break;
    }
    case 'cispains': { // 專案回顧三大痛點：三張淺底卡，icon 在上、無編號
      const row = add(prose, F('Pains｜三大痛點', { dir: 'H', gap: 12, pad: [0, 0, 10, 0] }), fill);
      b.items.forEach((it, i) => {
        const c = add(row, F(`Pain｜${it.title}`, { gap: 6, pad: [18, 18], radius: 14, stroke: 'ink', fill: 'ink4' }), { w: 'fill', h: 'fill' });
        const ic = it.icon && DATA.icons && DATA.icons[it.icon];
        if (ic) add(c, svg(ic, `Icon｜${it.icon.split('/').pop()}`, 44));
        add(c, T(it.title, { key: `${k}.${i}.title`, weight: 900 }), fill);
        add(c, T(it.desc, { key: `${k}.${i}.desc`, size: 15.2 }), fill);
      });
      break;
    }
    case 'cisscope': { // 工作範圍（標題＋素材＋標籤）／使用情境（深色標記＋說明）
      const row = add(prose, F(b.role ? 'Scope｜工作範圍' : 'Scope｜使用情境', { dir: 'H', gap: 10 }), fill);
      const colW = Math.floor((MAXW - 10 * (b.items.length - 1)) / b.items.length);
      b.items.forEach((r, i) => {
        const c = add(row, F(`Card｜${r.title || r.mark}`, { gap: 12, pad: [16, 18], radius: 14, stroke: 'ink' }), { w: 'fill', h: 'fill' });
        const ic = r.icon && DATA.icons && DATA.icons[r.icon];
        if (ic) add(c, svg(ic, `Icon｜${r.icon.split('/').pop()}`, 44));
        if (r.title) add(c, T(r.title, { key: `${k}.${i}.title`, size: 17.6, weight: 900, lh: 1.5 }), fill);
        if (r.mark) { const m = add(c, F('Mark', { dir: 'H', pad: [2, 10], radius: 999, stroke: 'ink', sw: 1.5, fill: 'ink' })); add(m, T(r.mark, { key: `${k}.${i}.mark`, size: 13.1, weight: 900, lh: 1.5, color: 'paper' })); }
        if (r.img || r.media) media(c, r.img, r.media, `${k}.${i}.media`, colW - 40, Math.round((colW - 40) * 3 / 4), { pad: 16, size: 14.1 });
        if (r.chips.length) {
          const ch = add(c, F('Chips', { dir: 'H', gap: 6 }), { w: 'fill', wrap: true, rowGap: 6 });
          r.chips.forEach((t, j) => { const p = add(ch, F(`Chip｜${t}`, { dir: 'H', pad: [2, 10], radius: 8, fill: 'ink7' })); add(p, T(t, { key: `${k}.${i}.chips.${j}`, size: 14.7, weight: 700, lh: 1.6 })); });
        }
        r.texts.forEach((t, j) => add(c, T(t, { key: `${k}.${i}.text.${j}`, size: 15.2 }), fill));
        r.pending.forEach((t, j) => pendTag(c, t, `${k}.${i}.pending.${j}`));
        if (r.note) add(c, T(r.note, { key: `${k}.${i}.note`, size: 13.6, color: 'inkSoft' }), fill);
      });
      break;
    }
    case 'cisrules': { // 六項規範：兩欄；is-wide 佔整列
      const grid = add(prose, F('Rules｜識別規範', { gap: 32, pad: [10, 0, 10, 0] }), fill);
      const colW = (MAXW - 24) / 2;
      let row = null;
      b.items.forEach((it, i) => {
        if (it.wide || !row || row.children.length >= 2) row = add(grid, F('Row', { dir: 'H', gap: 24 }), fill);
        const c = add(row, F(`Rule｜${it.title}`, { gap: 10 }), { w: 'fill', h: 'fill' });
        const h = add(c, F('H3', { pad: [10, 0, 0, 0], stroke: 'ink', sides: 'T' }), fill);
        add(h, T(it.title, { key: `${k}.${i}.title`, size: 19.2, weight: 900, lh: 1.2 }), fill);
        const w = it.wide ? MAXW : colW;
        it.texts.forEach((t, j) => add(c, T(t, { key: `${k}.${i}.text.${j}`, size: 15.8, color: 'inkSoft' }), fill));
        media(c, it.img, it.ph, `${k}.${i}.ph`, w, Math.round(w * 3 / 4));
        it.pending.forEach((t, j) => pendTag(c, t, `${k}.${i}.pending.${j}`));
        if (it.wide) row = null;
      });
      break;
    }
    case 'cisdecisions': { // 關鍵設計決策：兩張卡並排，編號＋標題＋說明／好處／目標（有圖才放示意圖）
      const row = add(prose, F('Decisions｜關鍵設計決策', { dir: 'H', gap: 16, pad: [0, 0, 10, 0] }), fill);
      const inner = Math.floor((MAXW - 16) / 2) - 44;
      b.items.forEach((it, i) => {
        const c = add(row, F(`Decision｜${it.title}`, { gap: 12, pad: [20, 22], radius: 14, stroke: 'ink' }), { w: 'fill', h: 'fill' });
        const badge = add(c, F('Badge｜編號', { dir: 'H', pad: [0, 8], radius: 6, fill: 'accent' }));
        add(badge, T(it.no, { key: `${k}.${i}.no`, size: 13.6, weight: 900, lh: 1.6 }));
        add(c, T(it.title, { key: `${k}.${i}.title`, size: 19.2, weight: 900, lh: 1.4 }), fill);
        if (it.img || it.ph) media(c, it.img, it.ph, `${k}.${i}.ph`, inner, Math.round(inner * 10 / 16)); // 卡片目前不放示意圖
        it.rows.forEach((r, j) => {
          const line = add(c, F(`Row｜${r.label}`, { dir: 'H', gap: 10 }), fill);
          const tag = add(line, F('Tag', { dir: 'H', pad: [1, 8], radius: 6, fill: 'ink7' }));
          add(tag, T(r.label, { key: `${k}.${i}.label.${j}`, size: 13.6, weight: 900, lh: 1.7 }));
          add(line, T(r.text, { key: `${k}.${i}.text.${j}`, size: 15.2, lh: 1.7 }), fill);
        });
      });
      break;
    }
    case 'cisworks': { // 延伸作品：主圖佔 4/6 寬兩列高，其餘兩兩一列
      const box = add(prose, F('Works｜延伸作品', { gap: 24, pad: [6, 0, 0, 0] }), fill);
      const col = (MAXW - 5 * 16) / 6, span = (n) => Math.round(col * n + 16 * (n - 1));
      const work = (parent, it, i, w, phH, stretch) => {
        const f = add(parent, F(`Work｜${it.title}`, { gap: 8 }), stretch ? { w: 'fill', h: 'fill' } : fill);
        const m = media(f, it.img, it.ph, `${k}.${i}.ph`, w, phH, { size: 15.2, strokeOpacity: it.full ? 0.18 : 0 });
        if (stretch) { m.layoutSizingVertical = 'FILL'; try { m.minHeight = phH; } catch (e) {} }
        const cap = add(f, F('Caption', { gap: 2 }), fill);
        const tl = add(cap, F('Title', { dir: 'H', gap: 8, cross: 'CENTER' }), { w: 'fill', wrap: true, rowGap: 4 });
        add(tl, T(it.title, { key: `${k}.${i}.title`, size: 17.6, weight: 900, lh: 1.6 }));
        it.pending.forEach((t, j) => pendTag(tl, t, `${k}.${i}.pending.${j}`));
        if (it.caption) add(cap, T(it.caption, { key: `${k}.${i}.caption`, size: 14.1, lh: 1.7, color: 'inkSoft' }), fill);
      };
      const list = b.items.map((it, i) => ({ it, i }));
      const li = list.findIndex((x) => x.it.lead);
      let rest = list;
      if (li >= 0) {
        const lead = list[li], side = list.filter((x) => x !== lead).slice(0, 2);
        const top = add(box, F('Row｜主圖', { dir: 'H', gap: 16 }), fill);
        work(top, lead.it, lead.i, span(4), 280, true);
        const sc = add(top, F('Side', { gap: 24 }), { w: span(2) });
        side.forEach((x) => work(sc, x.it, x.i, span(2), Math.round(span(2) * 3 / 4)));
        rest = list.filter((x) => x !== lead && !side.includes(x));
      }
      for (let j = 0; j < rest.length; j += 2) {
        const r = add(box, F('Row', { dir: 'H', gap: 16 }), fill);
        rest.slice(j, j + 2).forEach((x) => work(r, x.it, x.i, span(3), Math.round(span(3) * 3 / 4)));
        if (rest.length - j === 1) add(r, F('Deco｜空欄', {}), { w: 'fill' });
      }
      break;
    }
    case 'principle': {
      const box = add(prose, F('Principle｜排序原則', { pad: [14, 18], fill: 'ink6', stroke: 'accent', sw: 6, sides: 'L' }), fill);
      box.topLeftRadius = 0; box.bottomLeftRadius = 0; box.topRightRadius = 12; box.bottomRightRadius = 12;
      add(box, T(b.text, { key: k, rich: true }), fill);
      break;
    }
    case 'note': add(prose, T(b.text, { key: k, size: 14.8, color: 'inkSoft' }), fill); break;
    case 'flowfull': {
      const box = add(prose, F('Details｜完整 User Flow（收合）', { pad: [12, 16], radius: 14, stroke: 'ink' }), fill);
      add(box, T(`▸ ${b.text}`, { key: k, weight: 900 }), fill);
      break;
    }
    case 'pyramid': {
      const TONE = [['accent', 'ink'], ['ink', 'paper'], ['inkSoft', 'paper'], ['ink30', 'ink'], ['ink14', 'ink']];
      const PCT = [0.52, 0.64, 0.76, 0.88, 1];
      const COLW = Math.round((MAXW - 40 - 24) / 2);
      const wrap = add(prose, F('Pyramid｜判斷順序', { dir: 'H', gap: 0 }), fill);
      add(wrap, svg('<svg width="40" height="400" viewBox="0 0 40 400" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="6" width="2" height="380" fill="#152c4c"/><path d="M7 384 L19 384 L13 396 Z" fill="#152c4c"/></svg>', 'Icon｜優先度箭頭（高→低）'));
      const col = add(wrap, F('Tiers', { gap: 8 }), fill);
      b.tiers.forEach((t, i) => {
        const [bg, fg] = TONE[i] || TONE[4];
        const row = add(col, F(`Tier｜${t.num}`, { dir: 'H', gap: 24, cross: 'CENTER' }), fill);
        const bc = add(row, F('BarCol', { dir: 'H', main: 'CENTER' }), { w: COLW });
        const bar = add(bc, F('Bar', { dir: 'H', gap: 10, main: 'CENTER', cross: 'CENTER', pad: [10, 14], radius: 10, fill: bg, stroke: i === 0 ? 'ink' : null }), { w: Math.round(COLW * (PCT[i] || 1)), minH: 56 });
        const num = add(bar, F('Num', { main: 'CENTER', cross: 'CENTER', radius: 999, stroke: fg }), { w: 26, h: 26 });
        add(num, T(t.num, { key: 'Deco｜序號', size: 14.4, weight: 900, lh: 1, color: fg }));
        add(bar, T(t.title, { key: `${k}.${i}.title`, weight: 900, lh: 1.35, color: fg, align: 'CENTER' }));
        const why = add(row, F('Why', { gap: 2 }), fill);
        add(why, T(t.head, { key: `${k}.${i}.head`, size: 17.1, weight: 900, lh: 1.6 }), fill);
        add(why, T(t.body, { key: `${k}.${i}.body`, size: 17.1, lh: 1.6 }), fill);
      });
      break;
    }
    case 'flow': { // User Flow × 前後台規則：5 列（標題／前台／狀態／後台／例外）× 5 站
      const tb = add(prose, F('Flow｜User Flow × 前後台規則', {}), fill);
      const rows = ['title', 'front', 'state', 'back', 'exc'];
      rows.forEach((r, ri) => {
        const row = add(tb, F(`Row｜${b.labels[ri] || r}`, { dir: 'H', gap: 10, stroke: ri ? 'ink' : null, strokeOpacity: 0.18, sw: 1.5, sides: ri ? 'T' : null }), fill);
        const lab = add(row, F('Label', { cross: 'MIN', main: 'CENTER', pad: [10, 0] }), { w: 96 });
        lab.layoutSizingVertical = 'FILL';
        add(lab, T(b.labels[ri] || '', { key: `${k}.label.${ri}`, size: 13.5, weight: 900, ls: 0.06, color: 'inkSoft' }), { w: 'fill' });
        b.steps.forEach((st, i) => {
          const c = add(row, F(`Cell｜${st.num}`, { dir: 'V', gap: 6, pad: [10, 0] }), fill);
          c.layoutSizingVertical = 'FILL';
          if (r === 'title') {
            c.layoutMode = 'HORIZONTAL'; c.primaryAxisAlignItems = 'MIN'; c.counterAxisAlignItems = 'CENTER'; c.itemSpacing = 8;
            const n = add(c, F('Num', { main: 'CENTER', cross: 'CENTER', radius: 999, fill: 'ink' }), { w: 30, h: 30 });
            add(n, T(st.num, { key: 'Deco｜序號', size: 17, weight: 900, lh: 1, color: 'paper' }));
            add(c, T(st.title, { key: `${k}.${i}.title`, weight: 900, lh: 1.3 }), fill);
            if (i < b.steps.length - 1) add(c, T('→', { key: 'Arrow', weight: 900, lh: 1 }));
          } else if (r === 'front') {
            const bb = add(c, F('Bubble', { pad: [10, 12], fill: 'ink7', stroke: 'ink', strokeOpacity: 0.18, sw: 1.5 }), fill);
            bb.topLeftRadius = 4; bb.topRightRadius = 14; bb.bottomLeftRadius = 14; bb.bottomRightRadius = 14;
            add(bb, T(st.front, { key: `${k}.${i}.front`, size: 15.5, lh: 1.55 }), fill);
          } else if (r === 'state') {
            if (st.state) {
              const pl = add(c, F('Pill', { dir: 'H', pad: [4, 10], radius: 999, stroke: 'ink', fill: st.stateKind === 'active' ? 'accent' : st.stateKind === 'done' ? 'ink' : null }));
              add(pl, T(st.state, { key: `${k}.${i}.state`, size: 15.3, weight: 900, lh: 1.5, color: st.stateKind === 'done' ? 'paper' : 'ink' }));
            } else add(c, T('—', { key: 'Deco｜無', color: 'inkSoft' }));
          } else if (r === 'back') add(c, T(st.back, { key: `${k}.${i}.back`, size: 15.8, lh: 1.6 }), fill);
          else {
            if (!st.exc.length) add(c, T('—', { key: 'Deco｜無', color: 'inkSoft' }));
            st.exc.forEach((e, j) => {
              const chip = add(c, F('Exception', { pad: [6, 9], radius: 8, stroke: 'inkSoft', sw: 1.5, dash: [4, 3] }), fill);
              add(chip, T(e, { key: `${k}.${i}.exc.${j}`, size: 14.4, lh: 1.5, color: 'inkSoft' }), fill);
            });
          }
        });
      });
      break;
    }
    case 'screens': { // 一段文字搭配一張畫面，左右交錯
      const g = add(prose, F('Screens｜介面展示', { gap: 72, pad: [14, 0] }), fill);
      const MW = 653;
      b.items.forEach((it, i) => {
        const row = add(g, F(`Screen｜${it.title}`, { dir: 'H', gap: 48, cross: 'CENTER' }), fill);
        const pic = it.img && DATA.images && DATA.images[it.img];
        const media = () => {
          if (pic) {
            const img = figma.createImage(figma.base64Decode(pic.b64));
            add(row, F(`Figure｜${it.img.split('/').pop()}`, { radius: 20, stroke: 'ink', strokeOpacity: 0.18, clip: true, image: { type: 'IMAGE', scaleMode: 'FILL', imageHash: img.hash } }), { w: MW, h: Math.round(MW * pic.h / pic.w) });
            return;
          }
          const ph = add(row, F('Figure｜畫面佔位（16:10）', { main: 'CENTER', cross: 'CENTER', pad: 24, radius: 20, fill: 'ink6', stroke: 'ink', strokeOpacity: 0.18 }), { w: MW, h: Math.round(MW * 10 / 16) }); add(ph, T(it.ph, { key: `${k}.${i}.ph`, weight: 700, color: 'inkSoft', align: 'CENTER' }));
        };
        if (i % 2) media();
        const tx = add(row, F('Text', { gap: 10 }), fill);
        const lb = add(tx, F('Label', { dir: 'H', pad: [2, 10], radius: 999, fill: 'ink' }));
        add(lb, T(it.label, { key: `${k}.${i}.label`, size: 14, weight: 900, ls: 0.08, lh: 1.5, color: 'paper' }));
        add(tx, T(it.title, { key: `${k}.${i}.title`, size: 25.9, weight: 900, lh: 1.3 }), fill);
        add(tx, T(it.intro, { key: `${k}.${i}.intro`, rich: true }), fill);
        const ul = add(tx, F('List｜ul', { gap: 9 }), fill);
        it.items.forEach((li, j) => {
          const r2 = add(ul, F('Item', { dir: 'H', gap: 10 }), fill);
          add(r2, T('•', { key: 'Deco｜項目符號', size: 17.1, weight: 900 }));
          add(r2, T(li, { key: `${k}.${i}.items.${j}`, size: 17.1, rich: true }), fill);
        });
        if (it.note) add(tx, T(it.note, { key: `${k}.${i}.note`, size: 15.3, color: 'inkSoft' }), fill);
        if (!(i % 2)) media();
      });
      break;
    }
    case 'workflow': { // S 形閱讀：第一列 01→03 往右，右側往下折，第二列 04→06 往左（畫面上 06 05 04）
      const g = add(prose, F('Workflow｜工作流程（S 形）', { gap: 0, pad: [10, 0] }), fill);
      const CW = Math.round((MAXW - 88) / 3);
      const rowOf = (idx, arrow) => {
        const row = add(g, F('Row', { dir: 'H', gap: 0 }), fill);
        idx.forEach((i, j) => {
          const c = b.cards[i];
          if (!c) return;
          const card = add(row, F(`Card｜${c.num} ${c.title}`, { gap: 8, pad: [18, 20], radius: 16, stroke: 'ink', fill: 'paper' }), { w: 'fill' });
          card.layoutSizingVertical = 'FILL';
          const head = add(card, F('Head', { dir: 'H', main: 'SPACE_BETWEEN', cross: 'CENTER' }), fill);
          add(head, T(c.num, { key: 'Deco｜步驟', display: true, size: 25.2, lh: 1 }));
          if (c.icon && DATA.icons[c.icon]) add(head, svg(DATA.icons[c.icon], `Icon｜${c.title}`, 28));
          add(card, T(c.title, { key: `${k}.${i}.title`, size: 18.9, weight: 900, lh: 1.4 }), fill);
          add(card, T(c.desc, { key: `${k}.${i}.desc`, size: 16.6, lh: 1.6 }), fill);
          if (j < idx.length - 1) {
            const ar = add(row, F('Arrow', { main: 'CENTER', cross: 'CENTER' }), { w: 44 });
            ar.layoutSizingVertical = 'FILL';
            add(ar, T(arrow, { key: 'Arrow', size: 25.2, weight: 900, lh: 1 }));
          }
        });
      };
      if (b.row) { rowOf(b.cards.map((_, i) => i), '→'); break; }
      rowOf([0, 1, 2], '→');
      if (b.cards.length > 3) {
        const x = MAXW - Math.round(CW / 2);
        add(g, svg(`<svg width="${MAXW}" height="44" viewBox="0 0 ${MAXW} 44" xmlns="http://www.w3.org/2000/svg"><path d="M${x} 0 V36" fill="none" stroke="#152c4c" stroke-width="2"/><path d="M${x - 7} 35 L${x + 7} 35 L${x} 44 Z" fill="#152c4c"/></svg>`, 'Icon｜往下箭頭'));
        rowOf([5, 4, 3], '←');
      }
      break;
    }
    case 'team': { // 分工圖：虛線圓圈＋箭頭
      const g = add(prose, F('Team｜分工圖', { dir: 'H', gap: 24, cross: 'CENTER', pad: [8, 0] }), { w: 'fill', wrap: true, rowGap: 24 });
      const tone = { stake: 'paper', me: 'accent35', dev: '#b1bccd' };
      let n = 0;
      b.parts.forEach((p) => {
        if (p.arrow) { add(g, T(p.arrow, { key: 'Arrow', weight: 900, lh: 1 })); return; }
        const c = add(g, F(`Node｜${p.title}`, { main: 'CENTER', cross: 'CENTER', pad: 10, radius: 80, stroke: 'ink', dash: [6, 4], fill: tone[p.kind] || 'paper' }), { w: 160, h: 160 });
        const tt = add(c, F('Title', { pad: [0, 0, 10, 0] }));
        add(tt, T(p.title, { key: `${k}.${n}.title`, size: 24, weight: 900, lh: 1.4, align: 'CENTER' }));
        p.lines.forEach((l, j) => add(c, T(l, { key: `${k}.${n}.lines.${j}`, size: 16, weight: 700, lh: 1.5, align: 'CENTER' })));
        n++;
      });
      break;
    }
    case 'deliverables': { // 列點：icon＋標題＋說明，無外框
      const list = add(prose, F('Deliverables｜交付物', { gap: 18, pad: [6, 0] }), fill);
      b.items.forEach((it, i) => {
        const row = add(list, F(`Item｜${it.title}`, { dir: 'H', gap: 14 }), fill);
        if (it.icon && DATA.icons[it.icon]) add(row, F('Icon', { pad: [2, 0, 0, 0] })).appendChild(svg(DATA.icons[it.icon], `Icon｜${it.title}`, 28));
        const tx = add(row, F('Text', { gap: 2 }), fill);
        add(tx, T(it.title, { key: `${k}.${i}.title`, size: 18.9, weight: 900, lh: 1.5 }), fill);
        add(tx, T(it.desc, { key: `${k}.${i}.desc`, size: 17.1, lh: 1.65, color: 'inkSoft' }), fill);
      });
      break;
    }
    case 'outcome': { // 一句結論＋3 格數字＋一句延伸
      const o = add(prose, F('Outcome｜成果與影響', { gap: 20, pad: [4, 0, 0, 0] }), fill);
      add(o, T(b.lead, { key: `${k}.lead`, size: 27, weight: 900, lh: 1.5 }), fill);
      const st = add(o, F('Stats', { dir: 'H', stroke: 'ink', sides: 'TB' }), fill);
      b.stats.forEach((x, i) => {
        const c = add(st, F(`Stat｜${x.num}${x.unit} ${x.title}`, { gap: 2, pad: [18, 20], stroke: i ? 'ink' : null, strokeOpacity: 0.18, sw: 1.5, sides: 'L' }), { w: 'fill' });
        c.layoutSizingVertical = 'FILL';
        const n = add(c, F('Num', { dir: 'H', gap: 4, cross: 'BASELINE', pad: [0, 0, 8, 0] }));
        add(n, T(x.num, { key: `${k}.${i}.num`, display: true, size: 64.8, lh: 1 }));
        add(n, T(x.unit, { key: `${k}.${i}.unit`, weight: 900, lh: 1.2 }));
        add(c, T(x.title, { key: `${k}.${i}.title`, weight: 900, lh: 1.5 }), fill);
        add(c, T(x.desc, { key: `${k}.${i}.desc`, size: 15.8, lh: 1.6, color: 'inkSoft' }), fill);
      });
      add(o, T(b.reuse, { key: `${k}.reuse`, weight: 700 }), fill);
      add(o, T(b.note, { key: `${k}.note`, size: 14.8, color: 'inkSoft' }), fill);
      break;
    }
    case 'logofinal': { // 正式 LOGO：淺／深兩款橫式＋概念拆解（C ＆ B ＆ ＋ ＝ 完整圖形）
      const g = add(prose, F('LogoFinal｜正式 LOGO', { gap: 56, pad: [6, 0, 14, 0] }), fill);
      const tiles = add(g, F('Tiles', { dir: 'H', gap: 56 }), { w: 'fill', wrap: true, rowGap: 24 });
      const TW = Math.round((MAXW - 56) / 2);
      b.tiles.forEach((t) => {
        const tile = add(tiles, F(`Tile｜${t.dark ? '深色' : '淺色'}`, { main: 'CENTER', cross: 'CENTER', pad: [Math.round(TW * 0.08), Math.round(TW * 0.1)], fill: t.dark ? '#000000' : '#ffffff' }), { w: 'fill', minW: 400, h: Math.round(TW * 264 / 588) });
        picture(tile, t.img, Math.round(TW * 0.8), 'Image', { strokeOpacity: 0, radius: 0, bg: false });
      });
      const row = add(g, F('Concept｜概念拆解', { dir: 'H', gap: 24, main: 'CENTER' }), fill);
      const BOX = 120;
      let n = 0;
      b.parts.forEach((p) => {
        if (p.op != null) {
          const op = add(row, F('Op', { main: 'CENTER', cross: 'CENTER' }), { h: BOX });
          add(op, T(p.op, { key: 'Deco｜運算符號', size: 38.4, weight: 900, lh: 1 }));
          return;
        }
        const part = add(row, F(`Part｜${p.label || '完整圖形'}`, { gap: 18, cross: 'CENTER' }));
        const box = add(part, F('Box', { main: 'CENTER', cross: 'CENTER' }), { w: BOX, h: BOX });
        const vec = DATA.svgs && DATA.svgs[p.img];
        if (vec) box.appendChild(svg(vec, `Vector｜${p.img.split('/').pop()}`, Math.round(BOX * p.w / 107)));
        if (p.label) add(part, T(p.label, { key: `${k}.${n}.label`, size: 24, weight: 900, lh: 1.4, align: 'CENTER' }));
        n++;
      });
      break;
    }
    case 'logos': { // LOGO 提案：兩欄，選定的那張加粗框＋黃色陰影
      const g = add(prose, F('Logos｜LOGO 提案', { dir: 'H', gap: 14, pad: [6, 0] }), { w: 'fill', wrap: true, rowGap: 14 });
      const CW = Math.round((MAXW - 14) / 2);
      b.items.forEach((it, i) => {
        const f = add(g, F(`Logo｜${i + 1}${it.picked ? '（選定）' : ''}`, { gap: 8 }), { w: 'fill', minW: 400 });
        picture(f, it.img, CW, 'Image', it.picked ? { stroke: 'ink', strokeOpacity: 1, sw: 3, effects: [shadow(6, 6, 0, HEX.accent, 1)] } : {});
        add(f, T(it.caption, { key: `${k}.${i}.caption`, size: 15.8, weight: it.picked ? 900 : 400, color: it.picked ? 'ink' : 'inkSoft', rich: true }), fill);
      });
      break;
    }
    case 'compare': { // 兩張並排對照＋圖說
      const g = add(prose, F('Compare｜對照', { dir: 'H', gap: 16, pad: [6, 0, 14, 0] }), { w: 'fill', wrap: true, rowGap: 16 });
      const CW = Math.round((MAXW - 16) / 2);
      b.items.forEach((it, i) => {
        const f = add(g, F(`Figure｜${i + 1}`, { gap: 8 }), { w: 'fill', minW: 400 });
        const cap = () => {
          if (!it.caption && !it.tag) return;
          const row = add(f, F('Caption', { dir: 'H', gap: 8, cross: 'CENTER' }), { w: 'fill', wrap: true, rowGap: 4 });
          if (it.tag) { const pl = add(row, F('Tag', { dir: 'H', pad: [2, 10], radius: 999, fill: 'ink' })); add(pl, T(it.tag, { key: `${k}.${i}.tag`, size: 15.8, weight: 900, lh: 1.5, color: '#ffffff' })); }
          add(row, T(it.caption, { key: `${k}.${i}.caption`, size: 15.8, color: 'inkSoft', rich: true, boldStyle: 'Black' }), it.tag ? {} : fill);
        };
        if (it.top) cap();
        picture(f, it.img, CW, 'Image', { ph: it.ph, key: `${k}.${i}.ph` });
        if (!it.top) cap();
      });
      break;
    }
    case 'swatches': { // 色票
      const g = add(prose, F('Swatches｜品牌色', { dir: 'H', gap: 10, pad: [4, 0] }), { w: 'fill', wrap: true, rowGap: 10 });
      b.items.forEach((it, i) => {
        const row = add(g, F(`Swatch｜${it.name}`, { dir: 'H', gap: 10, cross: 'CENTER' }), { w: 'fill', minW: 150 });
        const chip = add(row, F('Chip', { radius: 10, stroke: 'ink', strokeOpacity: 0.18, sw: 1.5 }), { w: 40, h: 40 });
        chip.fills = [/gradient/.test(it.bg) ? cssGradient(it.bg) : { type: 'SOLID', color: rgb(it.bg) }];
        const tx = add(row, F('Text', { gap: 2 }), fill);
        add(tx, T(it.name, { key: `${k}.${i}.name`, size: 16.2, weight: 900, lh: 1.4 }), fill);
        add(tx, T(it.code, { key: `${k}.${i}.code`, size: 14.4, color: 'inkSoft', lh: 1.4 }), fill);
      });
      break;
    }
    case 'layers': { // 背景色階：畫布 → 側欄＋主卡片 → 篩選列 → 次要按鈕
      const box = add(prose, F('Layers｜背景色階', { gap: 12, pad: 14, radius: 20, fill: b.bg }), fill);
      const label = (parent, it, i) => {
        const t = add(parent, F('Name', { gap: 0 }), fill);
        add(t, T(it.name, { key: `${k}.${i}.name`, size: 15.3, weight: 900, lh: 1.5, color: '#24313d' }), fill);
        add(t, T(it.code, { key: `${k}.${i}.code`, size: 13.5, weight: 500, lh: 1.5, color: '#617285' }), fill);
      };
      let n = 0;
      if (b.canvas) label(box, b.canvas, n++);
      const row = add(box, F('Row', { dir: 'H', gap: 12 }), fill);
      const draw = (parent, ly, depth, top) => {
        const f = add(parent, F(`Layer｜${ly.name}`, { gap: 12, pad: ly.chip ? [8, 16] : [12, 14], radius: ly.chip ? 999 : 14, fill: ly.bg, stroke: depth > 1 ? '#e0e5ea' : '#d7dee5', sw: 1 }), ly.chip ? {} : { w: top && !b.kids.indexOf(ly) ? Math.round((MAXW - 28 - 12) / 3.8) : 'fill', minH: top ? 220 : 64 });
        if (top && b.kids.indexOf(ly) > 0) f.layoutSizingHorizontal = 'FILL';
        label(f, ly, n++);
        ly.kids.forEach((c) => draw(f, c, depth + 1, false));
      };
      b.kids.forEach((ly) => draw(row, ly, 1, true));
      break;
    }
    case 'shot': { // 滿版截圖（is-narrow = 最寬 760）＋圖說
      const pic = DATA.images && DATA.images[b.img];
      const fig = add(prose, F(`Shot｜${b.img.split('/').pop()}`, { gap: 8, pad: [8, 0, 14, 0] }), b.narrow ? { w: 'fill', maxW: 760 } : fill);
      if (pic) {
        const img = figma.createImage(figma.base64Decode(pic.b64));
        const w = b.narrow ? Math.min(760, MAXW) : MAXW;
        const f = add(fig, F('Image', { radius: 20, stroke: 'ink', strokeOpacity: 0.18, clip: true, image: { type: 'IMAGE', scaleMode: 'FIT', imageHash: img.hash }, fill: null }), { w: 'fill', h: Math.round(w * pic.h / pic.w) });
        f.fills = [{ type: 'SOLID', color: rgb('#ffffff') }, { type: 'IMAGE', scaleMode: 'FIT', imageHash: img.hash }];
      }
      if (b.caption) add(fig, T(b.caption, { key: `${k}.caption`, size: 15.3, color: 'inkSoft' }), fill);
      break;
    }
    case 'ph': {
      if (b.variant === 'diagram' && ILLUS.team) { const n = ILLUS.team; ILLUS.team = null; prose.appendChild(n); n.name = 'Illustration｜分工圖'; break; }
      const ph = add(prose, F(b.variant === 'diagram' ? 'Figure｜分工圖佔位' : 'Figure｜示意圖佔位（16:9）', { main: 'CENTER', cross: 'CENTER', pad: 24, radius: 20, fill: 'ink6', stroke: 'ink', strokeOpacity: 0.18 }), b.variant === 'diagram' ? { w: 950, h: 154 } : { w: 'fill', h: 427 });
      add(ph, T(b.text, { key: k, weight: 700, color: 'inkSoft', align: 'CENTER' }));
      break;
    }
    case 'cta': {
      const cta = add(prose, F('CTA', { gap: 16, pad: 24, radius: 20, fill: 'accent', stroke: 'ink' }), fill);
      add(cta, T(b.text, { key: k, rich: true }), fill);
      add(cta, button(b.btn, 'ghost', `${k}.btn`)).opacity = 0.55;
      break;
    }
  }
}
function buildCase(root, which = DATA.caseMain) {
  const d = DATA.cases.find((c) => c.id === which.id);
  const k = `cases.${d.id}`;
  const next = DATA.cases[(DATA.cases.indexOf(d) + 1) % DATA.cases.length];
  header(root);
  const { s, wrap } = section(root, 'Section｜案例開頭', { fill: 'ink', pad: [96, GUTTER], clip: true, stroke: 'ink', sides: 'B' });
  const back = add(wrap, F('Back', { pad: [0, 0, 32, 0] }));
  add(back, T('← 回到作品', { key: 'case.back', weight: 700, underline: true, color: 'paper' }));
  add(wrap, eyebrow(`${d.tier === 'main' ? '主案例' : '其他作品'}・${d.product}`, `${k}.product`, 'paper'));
  const h1 = add(wrap, F('H1', { pad: [16, 0, 20, 0] }), { w: 'fill' });
  add(h1, T(d.title, { key: `${k}.title`, size: 108.8, weight: 900, lh: 1.2, ls: -0.02, color: 'paper' }), { w: 'fill' });
  add(wrap, T(d.summary, { key: `${k}.summary`, size: 22.4, weight: 500, color: 'paper' }), { w: 'fill', maxW: 717 });
  const facts = add(wrap, F('Facts', { dir: 'H', gap: 32, pad: [40, 0, 0, 0] }), { w: 'fill', wrap: true, rowGap: 16 });
  const fact = (label, i) => {
    const f = add(facts, F(`Fact｜${label}`, { gap: 6, pad: [12, 0, 0, 0], stroke: 'paper', sides: 'T' }), { w: 'fill', minW: 240 });
    add(f, T(label, { key: `case.factLabel.${i}`, size: 13.1, weight: 900, ls: 0.12, color: 'paper' }));
    return f;
  };
  add(fact('我的角色', 0), T(d.role, { key: `${k}.role`, weight: 500, color: 'paper' }), { w: 'fill' });
  add(fact('期間', 1), T(d.duration, { key: `${k}.duration`, weight: 500, color: 'paper' }), { w: 'fill' });
  const tags = add(fact('展現能力', 2), F('Tags', { dir: 'H', gap: 6 }), { w: 'fill', wrap: true });
  d.proves.forEach((p, i) => add(tags, pill(`＃${p}`, { key: `${k}.proves.${i}`, stroke: 'paper', color: 'paper' })));
  const num = add(s, T(String(d.order).padStart(2, '0'), { key: 'Deco｜大編號', display: true, size: 448, lh: 1, outline: 'paper', sw: 2, opacity: 0.18 }), { abs: true });
  num.x = s.width - num.width + 22; num.y = -54;
  num.constraints = { horizontal: 'MAX', vertical: 'MIN' };
  // 內文
  const body = section(root, 'Section｜案例內文', { pad: [72 - 65, GUTTER, 120, GUTTER] }).wrap;
  const prose = add(body, F('Prose', { gap: 18 }), { w: 'fill', maxW: MAXW });
  SEC.n = 0;
  which.blocks.forEach((b, i) => proseBlock(prose, b, `${k}.body.${i}`));
  // 下一個案例
  const nx = section(root, 'Section｜下一個案例', { fill: 'ink', pad: [96, GUTTER], gap: 12 }).wrap;
  add(nx, eyebrow('下一個案例', 'case.next', 'paper'));
  const t = add(nx, F('NextTitle', { dir: 'H', gap: 16, cross: 'CENTER' }), { w: 'fill', wrap: true, rowGap: 8 });
  add(t, T(`${next.product}｜${next.title}`, { key: `cases.${next.id}.product｜title`, size: 64, weight: 900, lh: 1.2, color: 'paper' }), { maxW: MAXW - 80 });
  add(t, T('→', { key: 'Arrow', size: 64, weight: 900, lh: 1.2, color: 'accent' }));
  footer(root);
}

// ───────── 03 關於我（鎖定） ─────────
function aboutHero(root) {
  const { s, wrap } = section(root, 'Section｜關於我開頭', { fill: 'ink', pad: [120, GUTTER], clip: true });
  add(wrap, eyebrow('About', 'about.page.eyebrow', 'paper'));
  const h1 = add(wrap, F('H1', { pad: [12, 0, 0, 0] }));
  add(h1, T('關於我', { key: 'about.page.title', size: 128, weight: 900, lh: 1.2, ls: -0.02, color: 'paper' }));
  const deco = add(s, T('ABOUT', { key: 'Deco｜ABOUT', display: true, size: 316.8, lh: 1, color: 'accent', opacity: 0.9 }), { abs: true });
  deco.x = s.width - deco.width + 19; deco.y = s.height - deco.height + 63;
  deco.constraints = { horizontal: 'MAX', vertical: 'MAX' };
}
function aboutContact(main) {
  const cb = add(main, F('ContactBlock', { pad: [40, 0, 120, 0], stroke: 'ink', sides: 'T' }), { w: 'fill' });
  cb.itemSpacing = 20;
  add(cb, T('聯絡與履歷', { key: 'about.contact.title', size: 25.6, weight: 900, lh: 1.2 }));
  add(cb, contactLinks('light'), { w: 'fill', wrap: true });
}
function buildAbout(root) {
  header(root);
  aboutHero(root);
  const main = section(root, 'Section｜密碼門＋聯絡', { pad: [96, GUTTER, 0, GUTTER] }).wrap;
  const gate = add(main, F('Gate｜密碼門', { pad: 40, radius: 24, stroke: 'ink', fill: 'accent22' }), { w: 'fill', maxW: 560 });
  add(gate, svg(LOCK.replace('width="12" height="14"', 'width="40" height="48"').replace('stroke-width="1.6"', 'stroke-width="1.4"'), 'Icon｜鎖'));
  const h2 = add(gate, F('H2', { pad: [16, 0, 10, 0] }), { w: 'fill' });
  add(h2, T('這一頁需要密碼', { key: 'about.gate.title', size: 35.2, weight: 900, lh: 1.2 }), { w: 'fill' });
  add(gate, T('經歷與自我介紹僅提供給面試與招募夥伴。若你需要密碼，請透過下方聯絡管道與我聯繫。', { key: 'about.gate.body', color: 'inkSoft' }), { w: 'fill' });
  const label = add(gate, F('Label', { pad: [20, 0, 8, 0] }));
  add(label, T('請輸入 4 位數密碼', { key: 'about.gate.label', weight: 700 }));
  const row = add(gate, F('Row', { dir: 'H', gap: 12, cross: 'CENTER' }), { w: 'fill', wrap: true });
  const input = add(row, F('Input｜密碼', { dir: 'H', cross: 'CENTER', pad: [10, 16], radius: 12, stroke: 'ink', fill: 'paper' }), { w: 'fill', minW: 160 });
  add(input, T('••••', { key: 'Deco｜輸入框', display: true, size: 25.6, ls: 0.5, lh: 1.5, color: 'inkSoft' }));
  add(row, button('解鎖', 'ink', 'about.gate.submit', '→'));
  aboutContact(main);
  // 密碼門上方的外距（網頁 margin 96px）
  main.itemSpacing = 96;
  footer(root);
}

// ───────── 03b 關於我（解鎖後）：內文來自 private/about.md ─────────
// 深藍底區塊：直接放在深底上的文字、時間軸改淺色；本身有底色的（卡片、徽章、詳細區）維持原樣
function onDark(n) {
  for (const c of n.children || []) {
    if (c.type === 'TEXT') {
      const hex = hexOf(c);
      if (hex === HEX.ink) c.fills = [paint('paper')];
      else if (hex === HEX.inkSoft) c.fills = [paint('paper85')];
      continue;
    }
    if (/^Logo｜/.test(c.name)) { // logo 加米白底塊；選中的改黃框
      c.fills = [paint('paper')];
      if (c.strokes && c.strokes.length) c.strokes = [paint('accent')];
      continue;
    }
    if (c.name === 'Line') { c.fills = [paint('paper')]; continue; }
    if (c.name === 'Deco｜節點') { c.fills = [paint('ink')]; c.strokes = [paint('paper')]; continue; }
    if ('fills' in c && c.fills !== figma.mixed && c.fills.length) continue;
    onDark(c);
  }
}
function buildAboutOpen(root, data) {
  header(root);
  aboutHero(root);
  // 依大標題分段（同網頁 scripts/about-sections.mjs）：第 2、4 段深藍底，每段上下留白 96
  const groups = [];
  data.blocks.forEach((b, i) => { if (b.type === 'h2' || !groups.length) groups.push([]); groups[groups.length - 1].push([b, i]); });
  SEC.n = 0;
  groups.forEach((g, gi) => {
    const dark = gi % 2 === 1;
    const title = g[0][0].type === 'h2' ? g[0][0].text : '內容';
    // 第一個 H2 自帶 65 的上外距，所以上內距 96 - 65
    const { wrap } = section(root, `Section｜${title}${dark ? '（深藍底）' : ''}`, { fill: dark ? 'ink' : null, pad: [96 - 65, GUTTER, 96, GUTTER] });
    const prose = add(wrap, F('Prose', { gap: 18 }), { w: 'fill' });
    g.forEach(([b, i]) => proseBlock(prose, b, `aboutPrivate.body.${i}`));
    if (dark) onDark(prose);
  });
  aboutContact(section(root, 'Section｜聯絡與履歷', { pad: [0, GUTTER] }).wrap);
  footer(root);
}

// ───────── 目標位置與執行 ─────────
async function locate() {
  const node = await figma.getNodeByIdAsync(TARGET_ID);
  if (!node) throw new Error(`找不到連結裡的圖層（${TARGET_ID}），請確認是在「C-Min｜工作桌作品集」檔案裡執行`);
  let page = node;
  while (page.type !== 'PAGE') page = page.parent;
  await figma.setCurrentPageAsync(page);
  let mode, container, top = null;
  if (node.type === 'PAGE') { mode = 'page'; container = node; }
  else if (node.type === 'SECTION') { mode = 'section'; container = node; }
  else {
    top = node;
    while (top.parent.type !== 'PAGE' && top.parent.type !== 'SECTION') top = top.parent;
    mode = 'frame'; container = top.parent;
  }
  const generated = container.children.filter((c) => c.getPluginData('pf'));
  return { node, page, mode, container, top, generated };
}
async function describe() {
  const t = await locate();
  const first = !t.generated.length;
  const where = { page: '整個頁面', section: 'Section', frame: 'Frame' }[t.mode];
  let clear = '';
  if (first && t.mode !== 'frame') clear = `會先刪除這個${where}裡現有的 ${t.container.children.length} 個圖層（舊版稿）。`;
  if (first && t.mode === 'frame') clear = `連結的 Frame「${t.top.name}」會被清空，改成新版首頁；其他 3 張稿放在它右邊。`;
  if (!first) clear = `偵測到上次產生的 ${t.generated.length} 張稿，會在原位置重畫（你在 Figma 直接改的內容會被覆蓋，請先確認已回推到網頁）。`;
  return { title: `目標：${where}「${t.node.name}」（頁面：${t.page.name}）`, clear, built: DATA.builtAt };
}
async function loadFonts() {
  const list = [['Noto Sans TC', 'Regular'], ['Noto Sans TC', 'Medium'], ['Noto Sans TC', 'Bold'], ['Noto Sans TC', 'Black'], ['Archivo Black', 'Regular']];
  for (const [family, style] of list) {
    try { await figma.loadFontAsync({ family, style }); }
    catch (e) { throw new Error(`找不到字型 ${family} ${style}`); }
  }
}
function resetRoot(f, name, key) {
  for (const c of [...f.children]) c.remove();
  f.name = name;
  f.setPluginData('pf', key);
  f.layoutMode = 'VERTICAL';
  f.resize(W, Math.max(f.height, 100));
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'FIXED';
  f.itemSpacing = 0;
  f.paddingTop = f.paddingRight = f.paddingBottom = f.paddingLeft = 0;
  f.primaryAxisAlignItems = 'MIN';
  f.counterAxisAlignItems = 'MIN';
  f.fills = [paint('paper')];
  f.strokes = [];
  f.effects = [];
  f.cornerRadius = 0;
  f.rotation = 0;
  f.clipsContent = true;
}
async function build() {
  await loadFonts();
  await loadVars();
  const t = await locate();
  const byKey = {};
  for (const g of t.generated) byKey[g.getPluginData('pf')] = g;
  let x0 = 0, y0 = 0;
  if (!t.generated.length) {
    if (t.mode === 'frame') {
      if (t.top.type === 'FRAME') byKey.home = t.top;
      else { x0 = t.top.x; y0 = t.top.y; t.top.remove(); }
      if (byKey.home) { x0 = byKey.home.x; y0 = byKey.home.y; }
    } else {
      for (const c of [...t.container.children]) c.remove();
      if (t.mode === 'section') { x0 = 80; y0 = 80; }
    }
  } else {
    x0 = Math.min(...t.generated.map((g) => g.x));
    y0 = Math.min(...t.generated.map((g) => g.y));
  }
  const made = [];
  let nextX = x0;
  for (const def of FRAMES) {
    let f = byKey[def.key];
    const isNew = !f;
    if (isNew) { f = figma.createFrame(); t.container.appendChild(f); }
    resetRoot(f, def.name, def.key);
    def.build(f);
    if (isNew) { f.x = Math.max(nextX, ...made.map((m) => m.x + m.width + 200)); f.y = y0; }
    nextX = f.x + f.width + 200;
    made.push(f);
  }
  if (t.mode === 'section') {
    const right = Math.max(...t.container.children.map((c) => c.x + c.width));
    const bottom = Math.max(...t.container.children.map((c) => c.y + c.height));
    t.container.resizeWithoutConstraints(right + 80, bottom + 80);
  }
  // 自我檢查：有子層卻沒套 Auto Layout 的容器（LOGO、icon 這類向量圖除外）
  const skip = (n) => /^(LOGO|Icon｜|Illustration｜)/.test(n.name);
  let bad = 0;
  const walk = (n) => {
    if (skip(n)) return;
    if ('layoutMode' in n && n.layoutMode === 'NONE' && n.children && n.children.length) bad++;
    if (n.children) n.children.forEach(walk);
  };
  made.forEach(walk);
  figma.currentPage.selection = made;
  figma.viewport.scrollAndZoomIntoView(made);
  return bad ? `完成，但有 ${bad} 個容器沒套 Auto Layout，請告訴 Claude` : `✅ 完成：${made.length} 張稿已更新（全部 Auto Layout）`;
}

// ③ 只產生案例頁新版：畫在舊案例頁下方，不覆蓋舊稿；自動複製舊稿裡的兩張手繪插圖
async function buildCaseNew() {
  await loadFonts();
  await loadVars();
  const t = await locate();
  const old = t.generated.find((g) => g.getPluginData('pf') === 'case');
  let f = t.generated.find((g) => g.getPluginData('pf') === 'case2');
  ILLUS.handoff = ILLUS.team = null;
  if (old) {
    const h = old.findOne((n) => n.name.trim() === 'Bot-1v1-Handoff');
    const tm = old.findOne((n) => n.name === 'Group 1' && Math.round(n.width) === 950 && Math.round(n.height) === 154);
    if (h) ILLUS.handoff = h.clone();
    if (tm) ILLUS.team = tm.clone();
  }
  const isNew = !f;
  if (isNew) { f = figma.createFrame(); t.container.appendChild(f); }
  resetRoot(f, '02 案例頁 v2｜Desktop 1440（網頁同步）', 'case2');
  buildCase(f);
  // 沒用到的插圖複本刪掉
  [ILLUS.handoff, ILLUS.team].forEach((n) => n && n.remove());
  if (isNew) {
    if (old) { f.x = old.x; f.y = old.y + old.height + 400; }
    else { f.x = Math.max(...t.generated.map((g) => g.x + g.width), 0) + 200; f.y = 0; }
  }
  figma.currentPage.selection = [f];
  figma.viewport.scrollAndZoomIntoView([f]);
  const got = [old && old.findOne((n) => n.name.trim() === 'Bot-1v1-Handoff') ? '背景插圖' : null, old && old.findOne((n) => n.name === 'Group 1' && Math.round(n.width) === 950) ? '分工圖' : null].filter(Boolean);
  return `✅ 已產生「${f.name}」${got.length ? `，並複製了${got.join('、')}` : '（沒找到舊稿插圖，先放佔位框）'}。舊稿沒有變動。`;
}

// ④⑤⑥ 額外案例頁：各自一張稿，畫在前一張案例頁右邊；重跑只重畫自己那張
// ⑦ 關於我（解鎖後）也走同一套，畫在「03 關於我（鎖定）」右邊
const EXTRA = [
  { cmd: 'about-open', pf: 'about-open', name: '03b 關於我（解鎖後）｜Desktop 1440（私密・網頁同步）', after: ['about'], build: buildAboutOpen },
  { cmd: 'case-progressive', id: '02-line-oa-progressive', pf: 'case-progressive', name: '02b 案例頁｜漸進式訊息｜Desktop 1440（網頁同步）', after: ['case2', 'case'] },
  { cmd: 'case-ds', id: '03-workshub-design-system', pf: 'case-ds', name: '02c 案例頁｜WorksHub+ 設計系統｜Desktop 1440（網頁同步）', after: ['case-progressive', 'case2', 'case'] },
  { cmd: 'case-cis', id: '07-brand-cis', pf: 'case-cis', name: '02d 案例頁｜品牌 CIS 識別規範｜Desktop 1440（網頁同步）', after: ['case-ds', 'case-progressive', 'case2', 'case'] },
];
async function buildCaseExtra(def) {
  const data = def.id ? DATA.extras && DATA.extras[def.id] : DATA.aboutOpen;
  if (!data) throw new Error(def.id ? `網站裡找不到作品檔 ${def.id}` : '打包時找不到 private/about.md，請在專案資料夾執行 npm run figma 後再試');
  await loadFonts();
  await loadVars();
  const t = await locate();
  let f = t.generated.find((g) => g.getPluginData('pf') === def.pf);
  const ref = def.after.map((key) => t.generated.find((g) => g.getPluginData('pf') === key)).find(Boolean);
  const isNew = !f;
  if (isNew) { f = figma.createFrame(); t.container.appendChild(f); }
  ILLUS.handoff = ILLUS.team = null;
  resetRoot(f, def.name, def.pf);
  (def.build || buildCase)(f, data);
  if (isNew) {
    if (ref) { f.x = ref.x + ref.width + 200; f.y = ref.y; }
    else { f.x = Math.max(0, ...t.generated.map((g) => g.x + g.width)) + 200; f.y = 0; }
  }
  figma.currentPage.selection = [f];
  figma.viewport.scrollAndZoomIntoView([f]);
  return `✅ 已${isNew ? '產生' : '更新'}「${f.name}」，其他稿都沒有變動。`;
}

// ⑧ 提案稿：工作經歷改成橫向時間軸＋卡片（只畫進 Figma，網頁不變）
// 左舊右新、預設選中最右邊的現職；logo 先用公司簡稱的虛線框佔位
const tlShort = (t) => { const c = t.split('｜')[0]; return (c.match(/（(.+?)）/) || [])[1] || c.replace(/股份有限公司/, ''); };
const tlItem = (x) => { const m = x.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/); return m ? { t: m[1].replace(/[：:]\s*$/, ''), d: m[2] } : { t: '', d: x }; };
function tlHeading(parent, text, key, size) {
  const h = add(parent, F('H2', { dir: 'H', gap: 12, cross: 'CENTER' }), { w: 'fill' });
  const badge = add(h, F('Badge｜序號', { dir: 'H', pad: [0, 10], radius: 8, fill: 'accent' }));
  add(badge, T('02', { key: 'Deco｜序號', display: true, size: size * 0.7, lh: 1.2 }));
  add(h, T(text, { key, size, weight: 900, lh: 1.2 }), { w: 'fill' });
}
function tlStops(parent, items, k, mobile) {
  const n = items.length;
  items.forEach(({ it, i }, s) => {
    const sel = s === n - 1;
    const short = tlShort(it.title);
    const stop = add(parent, F(`Stop｜${short}`, { gap: 10, cross: 'CENTER' }), mobile ? { w: 132 } : { w: 'fill' });
    add(stop, T(it.date.split('–')[0].trim(), { key: 'Note｜起始年月', size: 13.1, weight: 700, color: sel ? 'ink' : 'inkSoft' }));
    const track = add(stop, F('Track', { dir: 'H', cross: 'CENTER' }), { w: 'fill', h: 24 });
    const line = (o) => add(track, F('Line', { fill: 'ink', opacity: o }), { w: 'fill', h: 2 });
    line(s === 0 ? 0 : 1);
    add(track, F(sel ? 'Deco｜節點（選中）' : 'Deco｜節點', { radius: 999, stroke: 'ink', fill: sel ? 'accent' : 'paper' }), sel ? { w: 24, h: 24 } : { w: 14, h: 14 });
    line(s === n - 1 ? 0.25 : 1);
    const lg = (DATA.tlLogos || []).find((l) => it.title.includes(l.match));
    const [bw, bh] = mobile ? [112, 56] : [160, 64];
    // 外框只在選中的那家顯示（不加黃底，避免紅色 logo 疊黃）；還沒有 logo 檔的佔位框維持虛線
    const logo = add(stop, F(lg ? `Logo｜${lg.file}` : `Logo｜佔位｜${short}`, { main: 'CENTER', cross: 'CENTER', radius: 12, stroke: sel || !lg ? 'ink' : null, dash: lg ? null : [6, 4] }), { w: bw, h: bh });
    if (lg) { // 裁掉原檔四周的透明留白，等比縮放塞進框內
      const b = lg.box, s = Math.min((bw - 24) / b.bw, (bh - 24) / b.bh);
      const img = figma.createImage(figma.base64Decode(lg.b64));
      add(logo, F('Image｜logo', { image: { type: 'IMAGE', scaleMode: 'CROP', imageHash: img.hash, imageTransform: [[b.bw / b.w, 0, b.x / b.w], [0, b.bh / b.h, b.y / b.h]] } }), { w: Math.round(b.bw * s), h: Math.round(b.bh * s) });
    } else add(logo, T(short, { key: 'Note｜logo 佔位', size: 15.2, weight: 900, lh: 1.2 }));
    // 職稱裡的括號補充（如「兼 UI/UX 團隊 Leader」）換到第二行
    add(stop, T(it.title.split('｜').slice(1).join('｜').replace(/\s*（/, '\n（'), { key: `${k}.${i}.role`, size: 14.4, weight: sel ? 900 : 700, lh: 1.5, color: sel ? 'ink' : 'inkSoft', align: 'CENTER' }), { w: 'fill' });
    // 指向下方詳細區的小三角：只有選中的那家看得到，其他的透明（保持高度一致）
    add(stop, T('▲', { key: 'Deco｜指示', size: 22, lh: 1, color: 'accent22', opacity: sel ? 1 : 0 }));
  });
}
function tlPanel(parent, it, i, k, mobile) {
  const [company, ...role] = it.title.split('｜');
  const panel = add(parent, F(`Panel｜詳細卡片｜${tlShort(it.title)}`, { gap: 20, pad: mobile ? 20 : 32, radius: 24, fill: 'accent22' }), { w: 'fill' });
  const head = add(panel, F('Head', { gap: 4 }), { w: 'fill' });
  add(head, T(`${company}｜${role.join('｜')}`, { key: `${k}.${i}.title`, size: mobile ? 17.6 : 22.4, weight: 900, lh: 1.4 }), { w: 'fill' });
  add(head, T([it.date, it.dur, it.meta].filter(Boolean).join('・'), { key: 'Note｜期間地點', size: 14.4, color: 'inkSoft' }), { w: 'fill' });
  const grid = add(panel, F('Cards', { dir: mobile ? 'V' : 'H', gap: 16 }), mobile ? { w: 'fill' } : { w: 'fill', wrap: true, rowGap: 16 });
  it.items.forEach((x, j) => {
    const { t, d } = tlItem(x);
    const card = add(grid, F(`Card｜${t || j + 1}`, { gap: 8, pad: 20, radius: 16, stroke: 'ink', fill: 'paper' }), mobile ? { w: 'fill' } : { w: 'fill', minW: 480 });
    const ico = it.icons && it.icons[j];
    if (ico) { // 編號換成對應標題的 icon（黃底方形小徽章）
      const badge = add(card, F('Badge｜icon', { main: 'CENTER', cross: 'CENTER', radius: 10, fill: 'accent' }), { w: 36, h: 36 });
      add(badge, svg(ico, `Icon｜${t}`, 20));
    } else {
      const badge = add(card, F('Badge', { dir: 'H', pad: [0, 8], radius: 6, fill: 'accent' }));
      add(badge, T(String(j + 1).padStart(2, '0'), { key: 'Deco｜序號', display: true, size: 13.1, lh: 1.5 }));
    }
    if (t) add(card, T(t, { key: `${k}.${i}.items.${j}.title`, size: 17.6, weight: 900, lh: 1.4 }), { w: 'fill' });
    add(card, T(d, { key: `${k}.${i}.items.${j}.desc`, size: 15.2, color: 'inkSoft' }), { w: 'fill' });
    const lk = it.links && it.links[j];
    if (lk) { // 外部連結：文字加底線＋↗（放在亮點之前，網頁上同列亮點才會對齊）
      const a = add(card, F(`Link｜${lk.text}`, { dir: 'H', gap: 4, cross: 'CENTER' }));
      add(a, T(lk.text, { key: `${k}.${i}.items.${j}.link`, size: 14.4, weight: 700, underline: true }));
      add(a, T('↗', { key: 'Arrow', size: 14.4, weight: 700 }));
    }
    const hl = it.hls && it.hls[j];
    if (hl) { // 亮點：星星＋重點文字，淡黃底小框
      const box = add(card, F('Highlight｜亮點', { dir: 'H', gap: 6, pad: [6, 10], radius: 8, fill: 'accent22' }), { w: 'fill' });
      add(box, svg(hl.star, 'Icon｜亮點星星', 16));
      add(box, T(hl.text, { key: `${k}.${i}.items.${j}.highlight`, size: 14.4, weight: 700, lh: 1.5 }), { w: 'fill' });
    }
  });
  return panel;
}
function tlNote(parent, lines) {
  const note = add(parent, F('Note｜互動說明', { gap: 6, pad: [16, 20], radius: 16, stroke: 'inkSoft', dash: [6, 4] }), { w: 'fill' });
  add(note, T('提案說明', { key: 'Note｜標題', size: 14.4, weight: 900 }));
  lines.forEach((x) => add(note, T(`・${x}`, { key: 'Note｜說明', size: 14.4, color: 'inkSoft' }), { w: 'fill' }));
}
function buildTimelineProposal(root, mobile) {
  const blocks = DATA.aboutOpen.blocks;
  const at = blocks.findIndex((b) => b.type === 'timeline');
  const k = `aboutPrivate.body.${at}`;
  const items = blocks[at].items.map((it, i) => ({ it, i })).reverse(); // 左舊右新
  const latest = items[items.length - 1];
  const wrap = section(root, `Section｜工作經歷（橫向提案${mobile ? '・手機' : ''}）`, { pad: mobile ? [56, 16] : [96, GUTTER] }).wrap;
  const body = add(wrap, F('Prose', { gap: mobile ? 20 : 28 }), { w: 'fill' });
  tlHeading(body, '工作經歷', `aboutPrivate.body.${at - 1}`, mobile ? 25.6 : 34.6);
  const exp = add(body, F('Experience', {}), { w: 'fill' });
  const axis = add(exp, F(mobile ? 'Timeline｜橫向（可左右滑動）' : 'Timeline｜橫向', { dir: 'H', main: mobile ? 'MAX' : 'MIN', clip: mobile }), { w: 'fill' });
  tlStops(axis, items, k, mobile);
  tlPanel(exp, latest.it, latest.i, k, mobile);
  tlNote(body, mobile ? [
    '手機寬度放不下 5 個 logo：logo 列可左右滑動，預設捲到最右邊（現職）。',
    '詳細卡片改成單欄，由上往下排。',
  ] : [
    '點擊時間軸上的公司，下方詳細卡片切換成該公司；預設選中最右邊的現職。',
    'Hover 只做輕微提示（logo 上浮），不切換內容，避免滑鼠往下移時經過別家公司而內容亂跳。',
    '順序左舊右新；logo 用原色版（public/images/logo/），已自動裁掉四周透明留白。',
    '酷必出現兩次（2021 UI/UX 設計師、2023 資深產品設計師），靠 logo 下方的職稱與年份區分。',
  ]);
}
async function buildTimelineProposals() {
  if (!DATA.aboutOpen || !DATA.aboutOpen.blocks.some((b) => b.type === 'timeline')) throw new Error('打包時找不到關於我的工作經歷，請在專案資料夾執行 npm run figma 後再試');
  await loadFonts();
  await loadVars();
  const t = await locate();
  const ref = ['about-open', 'about'].map((key) => t.generated.find((g) => g.getPluginData('pf') === key)).find(Boolean);
  const made = [];
  for (const [pf, name, mobile] of [['tl-h', '03c 提案｜工作經歷橫向時間軸＋卡片｜Desktop 1440（靜態稿）', false], ['tl-h-m', '03c 提案｜工作經歷橫向時間軸＋卡片｜Mobile 375（靜態稿）', true]]) {
    let f = t.generated.find((g) => g.getPluginData('pf') === pf);
    const isNew = !f;
    if (isNew) { f = figma.createFrame(); t.container.appendChild(f); }
    resetRoot(f, name, pf);
    if (mobile) f.resize(375, f.height);
    buildTimelineProposal(f, mobile);
    if (isNew) {
      if (made.length) { f.x = made[0].x + made[0].width + 200; f.y = made[0].y; }
      else if (ref) { f.x = ref.x; f.y = ref.y + ref.height + 400; }
      else { f.x = Math.max(0, ...t.generated.map((g) => g.x + g.width)) + 200; f.y = 0; }
    }
    made.push(f);
  }
  figma.currentPage.selection = made;
  figma.viewport.scrollAndZoomIntoView(made);
  return `✅ 已產生提案稿（桌機＋手機），放在關於我稿的下方；其他稿都沒有變動。`;
}

// ② 匯出：文字＋排版數值 → JSON
function hexOf(n, prop = 'fills') {
  if (!n[prop] || n[prop] === figma.mixed || !n[prop].length) return undefined;
  const p = n[prop][0];
  if (p.type !== 'SOLID') return p.type;
  const h = (v) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${h(p.color.r)}${h(p.color.g)}${h(p.color.b)}${p.opacity != null && p.opacity < 1 ? `@${Math.round(p.opacity * 100)}%` : ''}`;
}
function ser(n) {
  const o = { n: n.name };
  if (!n.visible) o.hidden = true;
  if (n.type === 'TEXT') {
    o.text = n.characters;
    o.size = n.fontSize === figma.mixed ? 'mixed' : n.fontSize;
    o.font = n.fontName === figma.mixed ? 'mixed' : `${n.fontName.family} ${n.fontName.style}`;
    o.color = hexOf(n);
    if (n.textAlignHorizontal !== 'LEFT') o.align = n.textAlignHorizontal;
    return o;
  }
  o.t = n.type;
  o.w = Math.round(n.width); o.h = Math.round(n.height);
  if (/^(LOGO|Icon｜)/.test(n.name)) return o;
  if ('layoutMode' in n && n.layoutMode !== 'NONE') {
    o.dir = n.layoutMode === 'HORIZONTAL' ? 'H' : 'V';
    o.gap = n.itemSpacing;
    o.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft];
    o.align = [n.primaryAxisAlignItems, n.counterAxisAlignItems].join('/');
    if (n.layoutWrap === 'WRAP') o.wrap = true;
  }
  if (n.parent && 'layoutMode' in n.parent && n.parent.layoutMode !== 'NONE' && 'layoutSizingHorizontal' in n) o.size = `${n.layoutSizingHorizontal}/${n.layoutSizingVertical}`;
  const fill = hexOf(n);
  if (fill) o.fill = fill;
  // 外框：顏色／粗細（只畫某幾邊時列出 上右下左）／虛線
  const stroke = hexOf(n, 'strokes');
  if (stroke && n.strokes[0].visible !== false) {
    const sides = 'strokeTopWeight' in n ? [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight] : null;
    const w = sides && new Set(sides).size > 1 ? sides.join(',') : n.strokeWeight;
    o.stroke = `${stroke}/${w}${n.dashPattern && n.dashPattern.length ? ' dashed' : ''}`;
  }
  if (n.cornerRadius && n.cornerRadius !== figma.mixed) o.radius = n.cornerRadius;
  if (n.opacity < 1) o.opacity = Math.round(n.opacity * 100) / 100;
  if (n.children && n.children.length) o.c = n.children.map(ser);
  return o;
}
async function doExport() {
  // 有選取圖層時，只匯出選取的那幾張（往上找到頂層 Frame）
  const sel = figma.currentPage.selection;
  if (sel.length) {
    const tops = [...new Set(sel.map((n) => { while (n.parent && n.parent.type !== 'PAGE' && n.parent.type !== 'SECTION') n = n.parent; return n; }))];
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      builtFrom: DATA.builtAt,
      selection: true,
      frames: tops.map((f) => Object.assign({ id: f.id, pf: f.getPluginData('pf') || undefined }, ser(f))),
    });
  }
  const t = await locate();
  if (!t.generated.length) throw new Error('還沒有產生過設計稿，請先執行「① 產生／更新設計稿」');
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    builtFrom: DATA.builtAt,
    frames: t.generated.map((f) => Object.assign({ id: f.id }, ser(f))),
  });
}

(async () => {
  if (figma.command === 'about-tl-proposal') {
    try { figma.closePlugin(await buildTimelineProposals()); }
    catch (e) { figma.closePlugin(`❌ ${e.message}`); }
    return;
  }
  const extra = EXTRA.find((e) => e.cmd === figma.command);
  if (extra) {
    try { figma.closePlugin(await buildCaseExtra(extra)); }
    catch (e) { figma.closePlugin(`❌ ${e.message}`); }
    return;
  }
  if (figma.command === 'case-new') {
    try { figma.closePlugin(await buildCaseNew()); }
    catch (e) { figma.closePlugin(`❌ ${e.message}`); }
    return;
  }
  figma.showUI(__html__, { width: 440, height: 300, themeColors: true });
  figma.ui.onmessage = async (m) => {
    if (m.type === 'go') {
      figma.ui.postMessage({ type: 'busy' });
      try { figma.closePlugin(await build()); }
      catch (e) { figma.ui.postMessage({ type: 'error', text: e.message }); }
    }
    if (m.type === 'close') figma.closePlugin();
  };
  try {
    if (figma.command === 'export') figma.ui.postMessage({ type: 'export', json: await doExport() });
    else figma.ui.postMessage(Object.assign({ type: 'confirm' }, await describe()));
  } catch (e) {
    figma.ui.postMessage({ type: 'error', text: e.message });
  }
})();
