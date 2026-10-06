// 把 private/about.md 加密成 src/data/about.lock.json。
// 原文與密碼都在 private/（不會上傳 GitHub），網站上只有加密後的亂碼。
// 用法：npm run lock-about
import { readFile, writeFile } from 'node:fs/promises';
import { webcrypto as crypto } from 'node:crypto';
import { marked } from 'marked';

const ITERATIONS = 600_000; // 拖慢每次試密碼的速度

const markdown = await readFile('private/about.md', 'utf8');
const password = (process.env.ABOUT_PASSWORD ?? (await readFile('private/about-password.txt', 'utf8'))).trim();
if (!password) throw new Error('找不到密碼：請在 private/about-password.txt 寫入密碼');

const html = await marked.parse(markdown);
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt'],
);
const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(html));

const b64 = (bytes) => Buffer.from(bytes).toString('base64');
await writeFile(
  'src/data/about.lock.json',
  JSON.stringify({ iterations: ITERATIONS, salt: b64(salt), iv: b64(iv), data: b64(new Uint8Array(cipher)) }, null, 2) + '\n',
);
console.log('✓ About 已加密 → src/data/about.lock.json');
