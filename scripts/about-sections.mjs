// 關於我：每個 ## 大標題連同底下內容包成一段 <section class="ab-sec">，
// 第 2、4…段加 ab-sec--dark（深藍底），讓區塊淺深交錯。
// 給 lock-about.mjs（加密前）與 export-about-html.mjs（CV 素材）共用
export function wrapSections(html) {
  const parts = html.split(/(?=<h2[\s>])/);
  const lead = /<h2[\s>]/.test(parts[0]) ? '' : parts.shift(); // 第一個標題前若有內容，原樣保留
  return lead + parts.map((p, i) => `<section class="ab-sec${i % 2 ? ' ab-sec--dark' : ''}">\n${p.trim()}\n</section>\n`).join('');
}
