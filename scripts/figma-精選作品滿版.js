// Figma 首頁稿（cwhPy5Vs8SpEhREEiSa5u6 ・ 01 首頁｜Desktop 1440）
// 把「精選作品」5 張卡片改成 1440 滿版、全部 Auto Layout。
// 只用標準 Figma Plugin API，可貼進 Scripter 外掛執行，也可交給 Figma MCP 的 use_figma。
// 重複執行是安全的：已經改過就會直接停止。

const page = await figma.getNodeByIdAsync('21:2');
await figma.setCurrentPageAsync(page);

const sec = await figma.getNodeByIdAsync('23:311');
if (!sec || sec.name === 'Section｜精選作品' || !(await figma.getNodeByIdAsync('23:308'))) {
  try { figma.notify('精選作品區塊已經改過（或找不到），這次沒有任何變更'); } catch (e) {}
} else {
  for (const s of ['Bold', 'Black', 'Regular', 'Medium']) await figma.loadFontAsync({ family: 'Noto Sans TC', style: s });
  await figma.loadFontAsync({ family: 'Archivo Black', style: 'Regular' });

  const get = async (id) => {
    const n = await figma.getNodeByIdAsync(id);
    if (!n) throw new Error('找不到圖層 ' + id);
    return n;
  };
  const headWrap = await get('23:111');
  const sideTitle = await get('23:309');
  const inkVar = await figma.variables.getVariableByIdAsync('VariableID:27:3'); // color/ink
  const inkPaint = figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0.082, g: 0.173, b: 0.298 } }, 'color', inkVar);

  // 網頁的點擊熱區（空白 frame），Figma 用不到
  for (const id of ['23:234', '23:274']) {
    const n = await figma.getNodeByIdAsync(id);
    if (n) n.remove();
  }

  const PAD_X = 136; // 對齊網頁 .wrap 內容寬度：(1440 - 1280) / 2 + 56
  const PAD_Y = 86;  // clamp(40px, 6vw, 88px) @1440

  const makeStack = (name) => {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = 'VERTICAL';
    f.primaryAxisSizingMode = 'AUTO';
    f.counterAxisSizingMode = 'FIXED';
    f.itemSpacing = 0;
    f.fills = [];
    f.clipsContent = false;
    return f;
  };

  const convert = async (id, size, stack) => {
    const a = await get(id);
    const oldW = a.width, oldH = a.height;
    const num = a.children.find((c) => c.name === 'Text' && c.type === 'FRAME'); // 背景大數字
    const offR = oldW - num.x, offB = oldH - num.y;

    stack.appendChild(a);
    a.layoutMode = 'VERTICAL';
    num.layoutPositioning = 'ABSOLUTE';
    a.name = size === 'lg' ? 'Card｜主案例' : 'Card｜其他作品';
    a.paddingTop = PAD_Y; a.paddingBottom = PAD_Y;
    a.paddingLeft = PAD_X; a.paddingRight = PAD_X;
    a.itemSpacing = 16;
    a.primaryAxisAlignItems = size === 'lg' ? 'SPACE_BETWEEN' : 'MIN';
    a.counterAxisAlignItems = 'MIN';
    a.cornerRadius = 0;
    a.clipsContent = true;
    a.resize(1440, size === 'lg' ? 620 : 360);
    a.layoutSizingHorizontal = 'FILL';
    if (size === 'lg') {
      a.layoutSizingVertical = 'FIXED';
    } else {
      a.layoutSizingVertical = 'HUG';
      a.minHeight = 360;
    }
    // 只留上緣 2px 深藍分隔線
    a.strokes = [inkPaint];
    a.strokeAlign = 'INSIDE';
    a.strokeTopWeight = 2; a.strokeRightWeight = 0; a.strokeBottomWeight = 0; a.strokeLeftWeight = 0;

    const flow = a.children.filter((c) => c !== num);
    const texts = flow.filter((c) => c.type === 'TEXT');
    const rows = flow.filter((c) => c.type === 'FRAME');
    for (const r of rows) r.layoutSizingHorizontal = 'FILL';
    const [title, summary] = texts;
    title.resize(size === 'lg' ? 883 : 461, title.height); // 網頁 max-width: 12em
    title.textAutoResize = 'HEIGHT';
    title.layoutSizingHorizontal = 'FIXED';
    summary.resize(571, summary.height); // 網頁 max-width: 34em
    summary.textAutoResize = 'HEIGHT';
    summary.layoutSizingHorizontal = 'FIXED';

    num.x = a.width - offR;
    num.y = a.height - offB;
    num.constraints = { horizontal: 'MAX', vertical: 'MAX' };
  };

  // 主案例：3 張滿版卡片
  const stackMain = makeStack('Stack｜主案例（滿版）');
  sec.insertChild(sec.children.indexOf(headWrap) + 1, stackMain);
  stackMain.layoutSizingHorizontal = 'FILL';
  for (const id of ['23:128', '23:164', '23:200']) await convert(id, 'lg', stackMain);

  // 「其他作品」標題列
  sec.insertChild(sec.children.indexOf(stackMain) + 1, sideTitle);
  sideTitle.paddingTop = 120; sideTitle.paddingBottom = 24;
  sideTitle.paddingLeft = PAD_X; sideTitle.paddingRight = PAD_X;
  sideTitle.layoutSizingHorizontal = 'FILL';
  const h3 = await get('23:235');
  h3.layoutMode = 'HORIZONTAL';
  h3.itemSpacing = 16;
  h3.counterAxisAlignItems = 'BASELINE';
  h3.layoutSizingVertical = 'HUG';

  // 其他作品：2 張滿版卡片（改為上下堆疊）
  const stackSide = makeStack('Stack｜其他作品（滿版）');
  sec.insertChild(sec.children.indexOf(sideTitle) + 1, stackSide);
  stackSide.layoutSizingHorizontal = 'FILL';
  for (const id of ['23:243', '23:276']) await convert(id, 'sm', stackSide);

  // 已清空的 Grid 外層
  for (const id of ['23:308', '23:310']) {
    const n = await figma.getNodeByIdAsync(id);
    if (n) n.remove();
  }

  // 區塊本身與標題外層
  headWrap.paddingBottom = 72;
  sec.name = 'Section｜精選作品';
  sec.paddingBottom = 0;
  sec.layoutSizingHorizontal = 'FILL';
  const eyebrowRow = await get('23:125');
  eyebrowRow.layoutMode = 'HORIZONTAL';
  eyebrowRow.counterAxisAlignItems = 'CENTER';
  eyebrowRow.layoutSizingVertical = 'FIXED';

  // 自我檢查：區塊內還有沒有「有子層卻沒套 Auto Layout」的容器
  const noAL = sec.findAll((n) => 'layoutMode' in n && n.layoutMode === 'NONE' && 'children' in n && n.children.length > 0);
  figma.currentPage.selection = [sec];
  figma.viewport.scrollAndZoomIntoView([sec]);
  try {
    figma.notify(noAL.length ? `完成，但還有 ${noAL.length} 個容器沒套 Auto Layout` : '完成：精選作品 5 張卡片已改為滿版 Auto Layout');
  } catch (e) {}
}
