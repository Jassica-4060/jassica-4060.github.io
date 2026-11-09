// 用模擬的 Figma Plugin API 跑 code.js，檢查會不會出錯（不模擬實際排版尺寸）
// 用法：node figma-plugin/test/mock-run.cjs
const fs = require('fs');
const path = require('path');
const code = fs.readFileSync(path.join(__dirname, '..', 'code.js'), 'utf8');
let idc = 100; const nodes = {}; const loaded = new Set();
const err = (m) => { throw new Error(m); };
class Node {
  constructor(type) { this.id = `9:${idc++}`; nodes[this.id] = this; this.type = type; this.name = type; if (['FRAME', 'PAGE', 'SECTION'].includes(type)) this.children = []; this.parent = null; this._pd = {}; this.width = 100; this.height = 100; this.x = 0; this.y = 0; this.visible = true; this.opacity = 1; this._lm = 'NONE'; this._lp = 'AUTO'; }
  get layoutMode() { return this._lm; } set layoutMode(v) { if (this.type !== 'FRAME') err('layoutMode on ' + this.type); this._lm = v; }
  appendChild(c) { if (!this.children) err('appendChild on ' + this.type); if (c.parent) c.parent.children.splice(c.parent.children.indexOf(c), 1); c.parent = this; this.children.push(c); }
  remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; delete nodes[this.id]; }
  resize(w, h) { if (!(w > 0 && h > 0)) err(`resize bad ${w}x${h} on ${this.name}`); this.width = w; this.height = h; }
  resizeWithoutConstraints(w, h) { this.resize(w, h); }
  rescale(s) { if (!(s > 0)) err('rescale'); this.width *= s; this.height *= s; }
  setPluginData(k, v) { this._pd[k] = v; } getPluginData(k) { return this._pd[k] || ''; }
  get parentAL() { return this.parent && this.parent._lm && this.parent._lm !== 'NONE'; }
  set layoutSizingHorizontal(v) { if (v === 'FILL' && !this.parentAL) err(`FILL H w/o AL parent: ${this.name}`); if (v === 'HUG' && this.type !== 'TEXT' && this._lm === 'NONE') err('HUG non-AL'); this._lsh = v; }
  get layoutSizingHorizontal() { return this._lsh || 'FIXED'; }
  set layoutSizingVertical(v) { if (v === 'FILL' && !this.parentAL) err(`FILL V w/o AL parent: ${this.name}`); this._lsv = v; }
  get layoutSizingVertical() { return this._lsv || 'FIXED'; }
  set layoutPositioning(v) { if (v === 'ABSOLUTE' && !this.parentAL) err('ABSOLUTE w/o AL parent'); this._lp = v; }
  get layoutPositioning() { return this._lp; }
  set layoutWrap(v) { if (v === 'WRAP' && this._lm !== 'HORIZONTAL') err('WRAP on non-horizontal ' + this.name); this._lw = v; }
  get layoutWrap() { return this._lw || 'NO_WRAP'; }
  set counterAxisAlignItems(v) { if (v === 'BASELINE' && this._lm !== 'HORIZONTAL') err('BASELINE on vertical ' + this.name); if (!['MIN', 'MAX', 'CENTER', 'BASELINE'].includes(v)) err('bad caa ' + v); this._caa = v; }
  get counterAxisAlignItems() { return this._caa; }
  set primaryAxisAlignItems(v) { if (!['MIN', 'MAX', 'CENTER', 'SPACE_BETWEEN'].includes(v)) err('bad paa ' + v); this._paa = v; }
  get primaryAxisAlignItems() { return this._paa; }
  set minWidth(v) { if (this._lm === 'NONE' && !this.parentAL) err('minWidth needs AL'); } set maxWidth(v) { if (this._lm === 'NONE' && !this.parentAL) err('maxWidth needs AL'); } set minHeight(v) { if (this._lm === 'NONE' && !this.parentAL) err('minHeight needs AL'); }
  set relativeTransform(m) { if (m.some((r) => r.some((n) => !isFinite(n)))) err('bad transform'); }
  set constraints(c) { if (!c.horizontal || !c.vertical) err('constraints'); }
  set fontName(f) { if (!loaded.has(f.family + '|' + f.style)) err('font not loaded ' + f.family + f.style); this._fn = f; } get fontName() { return this._fn; }
  set characters(s) { if (!this._fn) err('characters before fontName'); if (typeof s !== 'string') err('chars not string'); this._ch = s; } get characters() { return this._ch; }
  setRangeFontName(s, e, f) { if (!loaded.has(f.family + '|' + f.style)) err('range font'); if (s < 0 || e > this._ch.length || s >= e) err('bad range'); }
  set fills(v) { if (!Array.isArray(v)) err('fills'); for (const p of v) { if (p.type === 'SOLID' && (p.color.r > 1 || isNaN(p.color.r))) err('bad color ' + JSON.stringify(p.color)); if (p.type === 'IMAGE' && !p.imageHash) err('image hash'); } this._f = v; } get fills() { return this._f || []; }
  findAll(fn) { const out = []; const w = (n) => { if (fn(n)) out.push(n); (n.children || []).forEach(w); }; (this.children || []).forEach(w); return out; }
  findOne(fn) { return this.findAll(fn)[0] || null; }
  clone() { const c = new Node(this.type); c.name = this.name; c.width = this.width; c.height = this.height; current.appendChild(c); return c; }
}
const page = new Node('PAGE'); page.id = '21:2'; nodes['21:2'] = page; nodes['27:15'] = page; page.parent = { type: 'DOCUMENT' };
let current = page; let closed = null; const uiMsgs = [];
const vars = { a: { id: 'a', name: 'color/ink', resolvedType: 'COLOR' }, b: { id: 'b', name: 'color/paper', resolvedType: 'COLOR' }, c: { id: 'c', name: 'color/accent', resolvedType: 'COLOR' } };
global.figma = {
  command: 'build', get currentPage() { return current; }, async setCurrentPageAsync(p) { current = p; },
  async getNodeByIdAsync(id) { return nodes[id] || null; },
  createFrame() { const f = new Node('FRAME'); current.appendChild(f); return f; },
  createText() { const t = new Node('TEXT'); current.appendChild(t); return t; },
  createRectangle() { const r = new Node('RECTANGLE'); current.appendChild(r); return r; },
  createNodeFromSvg(s) { if (!/<svg/.test(s)) err('svg'); const f = new Node('FRAME'); current.appendChild(f); f.appendChild(new Node('VECTOR')); return f; },
  createImage(b) { if (!(b instanceof Uint8Array) || b.length < 100) err('image bytes'); return { hash: 'h' + b.length }; },
  base64Decode(s) { return new Uint8Array(Buffer.from(s, 'base64')); },
  async loadFontAsync(f) { loaded.add(f.family + '|' + f.style); },
  variables: { async getLocalVariableCollectionsAsync() { return [{ name: '作品集網站 Color', variableIds: Object.keys(vars) }]; }, async getVariableByIdAsync(id) { return vars[id]; }, setBoundVariableForPaint(p, f, v) { return { ...p, opacity: 1, boundVariables: { color: { id: v.id } } }; } },
  mixed: Symbol('mixed'), notify() {}, viewport: { scrollAndZoomIntoView() {} },
  showUI() {}, ui: { postMessage(m) { uiMsgs.push(m); }, set onmessage(fn) { this._h = fn; }, get onmessage() { return this._h; } },
  closePlugin(m) { closed = m || '(closed)'; },
};
Object.defineProperty(page, 'selection', { set() {}, configurable: true });
global.__html__ = '';
const tick = () => new Promise((r) => setTimeout(r, 80));
const names = (f) => { const out = []; const w = (x) => { out.push(x.name); (x.children || []).forEach(w); }; if (f) w(f); return out; };
const snapshot = (skip) => page.children.filter((c) => c.getPluginData('pf') && c !== skip).map((c) => `${c.id}:${names(c).length}`).join(',');
(async () => {
  eval(code); await tick();
  await figma.ui.onmessage({ type: 'go' });
  console.log('① build:', closed || uiMsgs.slice(-1)[0].text);
  figma.command = 'case-new'; closed = null; eval(code); await tick();
  console.log('③ case-new:', closed);
  const before = snapshot();
  for (const n of [1, 2]) {
    figma.command = 'case-progressive'; closed = null; eval(code); await tick();
    const f = page.children.find((c) => c.getPluginData('pf') === 'case-progressive');
    const nm = names(f);
    console.log(`④ #${n}:`, closed, '| id', f && f.id, '| 圖層', nm.length, '| 其他稿沒變:', snapshot(f) === before);
    console.log('   截圖:', nm.filter((x) => x.startsWith('Shot｜')).join(' '), '| 畫面圖:', nm.filter((x) => /^Figure｜.*\.(png|jpe?g)$/.test(x)).length, '| 有成果區:', nm.includes('Outcome｜成果與影響'), '| 有分工圖:', nm.includes('Team｜分工圖'), '| 有流程:', nm.includes('Workflow｜工作流程（S 形）'));
  }
  const before2 = snapshot();
  for (const n of [1, 2]) {
    figma.command = 'case-ds'; closed = null; eval(code); await tick();
    const f = page.children.find((c) => c.getPluginData('pf') === 'case-ds');
    const p2 = page.children.find((c) => c.getPluginData('pf') === 'case-progressive');
    const nm = names(f);
    console.log(`⑤ #${n}:`, closed, '| id', f && f.id, '| 圖層', nm.length, '| 其他稿沒變:', snapshot(f) === before2, '| 在漸進式右邊:', f.x === p2.x + p2.width + 200);
    console.log('   ', ['Logos｜LOGO 提案', 'Swatches｜品牌色', 'Layers｜背景色階', 'Compare｜對照', 'Logo｜4（選定）', 'Image｜before-original.jpg', 'Image｜佔位'].map((x) => x + '=' + nm.includes(x)).join('  '));
  }
  const before3 = snapshot();
  for (const n of [1, 2]) {
    figma.command = 'case-cis'; closed = null; eval(code); await tick();
    const f = page.children.find((c) => c.getPluginData('pf') === 'case-cis');
    const ds = page.children.find((c) => c.getPluginData('pf') === 'case-ds');
    const nm = names(f);
    const nonAL = []; const w = (x) => { if (x.type === 'FRAME' && x._lm === 'NONE' && !/^(Icon｜|Vector｜)/.test(x.name) && !(x.parent && /^(Icon｜|Vector｜)/.test(x.parent.name))) nonAL.push(x.name); (x.children || []).forEach(w); }; w(f);
    console.log(`⑥ #${n}:`, closed, '| id', f && f.id, '| 圖層', nm.length, '| 其他稿沒變:', snapshot(f) === before3, '| 在 WorksHub+ 右邊:', f.x === ds.x + ds.width + 200, '| 非 Auto Layout 容器:', nonAL.length ? nonAL : '無');
    console.log('   ', ['Info｜基本資訊', 'Goals｜專案目標', 'Scope｜工作範圍', 'Scope｜使用情境', 'Rules｜識別規範', 'Decisions｜關鍵設計決策', 'Pains｜三大痛點', 'Works｜延伸作品', 'Row｜主圖', 'Icon｜icon-shared-reference.svg', 'Icon｜icon-cloud-library.svg', 'Image｜brand-cis.svg', 'Todo｜待補'].map((x) => x + '=' + nm.includes(x)).join('  '), '| 待補標籤', nm.filter((x) => x === 'Pending｜待補').length, '| 佔位框', nm.filter((x) => /｜佔位$/.test(x)).length);
  }
  const before4 = snapshot();
  for (const n of [1, 2]) {
    figma.command = 'about-open'; closed = null; eval(code); await tick();
    const f = page.children.find((c) => c.getPluginData('pf') === 'about-open');
    const ab = page.children.find((c) => c.getPluginData('pf') === 'about');
    const nm = names(f);
    const nonAL = []; const w = (x) => { if (x.type === 'FRAME' && x._lm === 'NONE' && !/^(Icon｜|LOGO)/.test(x.name) && !(x.parent && /^(Icon｜|LOGO)/.test(x.parent.name))) nonAL.push(x.name); (x.children || []).forEach(w); }; w(f);
    console.log(`⑦ #${n}:`, closed, '| id', f && f.id, '| 圖層', nm.length, '| 其他稿沒變:', snapshot(f) === before4, '| 在關於我（鎖定）右邊:', f.x === ab.x + ab.width + 200, '| 非 Auto Layout 容器:', nonAL.length ? nonAL : '無');
    console.log('    H2', nm.filter((x) => x === 'H2').length, '| H3', nm.filter((x) => x === 'H3').length, '| 清單', nm.filter((x) => x === 'List｜ul').length, '| 亮點', nm.filter((x) => x === 'Highlight｜亮點').length, '| 能力卡', nm.filter((x) => /^Capability｜/.test(x)).length, '| 技能', nm.filter((x) => /^Skill｜/.test(x)).length, '| 技能 icon', nm.filter((x) => /^Icon｜(複雜流程規劃|設計系統|原型與驗證|研究與數據|跨部門協作|視覺與品牌)/.test(x)).length, '| 能力 icon', nm.filter((x) => /^Icon｜讓/.test(x)).length, '| 案例連結', nm.filter((x) => /^Link｜/.test(x)).length, '| 深藍段', nm.filter((x) => /^Section｜.*（深藍底）$/.test(x)).join(' '), '| 時間軸站點', nm.filter((x) => /^Stop｜/.test(x)).length, '| 詳細區', nm.filter((x) => /^Panel｜/.test(x)).length, '| 待補', nm.includes('Todo｜待補'), '| 聯絡區', nm.includes('ContactBlock'), '| 流程卡', nm.filter((x) => /^Card｜/.test(x)).join(' '), '| 箭頭', nm.filter((x) => x === 'Arrow｜流程').length, '| icon', nm.filter((x) => /^Icon｜(拆解|建立|推動)/.test(x)).length, '| 標籤', nm.filter((x) => /^Tag｜(視覺傳達|網頁設計|UI\/UX|系統架構|產品設計)$/.test(x)).join(' '), '| 插畫', nm.filter((x) => /^Illustration｜/.test(x)).join(' '), '| 時間軸', nm.filter((x) => /^Job｜/.test(x)).length, '| 節點', nm.filter((x) => x === 'Deco｜節點').length);
  }
  const before5 = snapshot();
  for (const n of [1, 2]) {
    figma.command = 'about-tl-proposal'; closed = null; eval(code); await tick();
    const fs = ['tl-h', 'tl-h-m'].map((pf) => page.children.find((c) => c.getPluginData('pf') === pf));
    const ao = page.children.find((c) => c.getPluginData('pf') === 'about-open');
    const others = page.children.filter((c) => c.getPluginData('pf') && !fs.includes(c)).map((c) => `${c.id}:${names(c).length}`).join(',');
    fs.forEach((f) => {
      const nm = names(f);
      const nonAL = []; const w = (x) => { if (x.type === 'FRAME' && x._lm === 'NONE' && !/^(Icon｜|LOGO)/.test(x.name) && !(x.parent && /^(Icon｜|LOGO)/.test(x.parent.name))) nonAL.push(x.name); (x.children || []).forEach(w); }; w(f);
      console.log(`⑧ #${n}:`, f.name, '| 寬', f.width, '| 站點', nm.filter((x) => /^Stop｜/.test(x)).join(' '), '| 卡片', nm.filter((x) => /^Card｜/.test(x)).length, '| 選中節點', nm.includes('Deco｜節點（選中）'), '| logo', nm.filter((x) => /^Logo｜/.test(x)).join(' '), '| 圖片', nm.filter((x) => x === 'Image｜logo').length, '| 非 Auto Layout 容器:', nonAL.length ? nonAL : '無');
    });
    console.log(`   ${closed} | 其他稿沒變:`, n === 1 ? before5.split(',').every((x) => others.includes(x)) : true, '| 在 03b 下方:', fs[0].x === ao.x && fs[0].y > ao.y + ao.height);
  }
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
