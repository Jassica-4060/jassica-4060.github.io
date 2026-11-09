// 把 public/images/logo/*.png 四周的透明留白裁掉，存到 public/images/logo/trim/（原檔不動）
// 網頁關於我的工作經歷用裁好的版本，各家 logo 視覺大小才一致
// 用法：npm run trim-logos（換了 logo 檔之後再跑一次）
import { readFileSync, readdirSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pngBox } from './png-box.mjs';

const dir = 'public/images/logo';
mkdirSync(`${dir}/trim`, { recursive: true });
for (const f of readdirSync(dir).filter((x) => x.endsWith('.png'))) {
  const b = pngBox(readFileSync(`${dir}/${f}`));
  execFileSync('sips', ['-c', String(b.bh), String(b.bw), '--cropOffset', String(b.y), String(b.x), `${dir}/${f}`, '--out', `${dir}/trim/${f}`], { stdio: 'ignore' });
  console.log(`✓ ${f}：${b.w}×${b.h} → ${b.bw}×${b.bh}`);
}
