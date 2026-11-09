// 算出 PNG 不透明區域的外框（logo 四周透明留白不算）
// 給 Figma 外掛（build.mjs）與 scripts/trim-logos.mjs 共用
import { inflateSync } from 'node:zlib';

export function pngBox(buf, alphaMin = 8) { // 只處理 8-bit RGBA 非交錯 PNG，其他格式回傳整張
  let o = 8, w, h, depth, color, inter; const idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8), d = buf.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); depth = d[8]; color = d[9]; inter = d[12]; }
    if (type === 'IDAT') idat.push(d);
    o += 12 + len;
  }
  const whole = { w, h, x: 0, y: 0, bw: w, bh: h };
  if (depth !== 8 || color !== 6 || inter) return whole;
  const raw = inflateSync(Buffer.concat(idat)), bpp = 4, stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) { // 還原 PNG 每列的 filter
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0, b = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      px[y * stride + x] = (src[x] + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f]) & 255;
    }
  }
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (px[y * stride + x * 4 + 3] >= alphaMin) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? whole : { w, h, x: x0, y: y0, bw: x1 - x0 + 1, bh: y1 - y0 + 1 };
}
