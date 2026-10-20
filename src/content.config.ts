import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// 每個作品案例 = src/content/cases/ 底下一個 .md 檔
const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: z.object({
    title: z.string(),            // 案例名稱
    product: z.string(),          // 產品／專案歸屬
    tier: z.enum(['main', 'side']), // main = 主案例、side = 次要案例
    order: z.number(),            // 排序（小的在前）
    duration: z.string(),         // 專案期間
    role: z.string(),             // 我的角色
    proves: z.array(z.string()),  // 這個案例證明的能力
    summary: z.string(),          // 一句話重點（卡片與案例頁開頭）
    // ── 首頁作品卡片用 ──
    excerpt: z.string().optional(), // 首頁作品卡的封面說明；留空 = 沿用 summary
    category: z.enum(['產品設計', '平面設計', '網頁設計']), // 首頁 Tab 分類
    kind: z.string(),             // 作品屬性（卡片右上角，例：SaaS 後台）
    date: z.string(),             // 時間（卡片左上角，例：2026.07）
    skills: z.array(z.string()),  // #技能 標籤
    cover: z.string().optional(), // 圖檔路徑（放 public/covers/，例：/covers/bot.jpg）；留空 = 顯示佔位圖
    coverFit: z.enum(['cover', 'contain']).default('cover'), // cover = 裁切填滿卡片；contain = 整張完整顯示（比例不是 16:10 時用）
    template: z.boolean().default(false), // true = 範本文字，等 Figma 定稿後替換
    draft: z.boolean().default(false), // true = 不顯示在網站上
  }),
});

export const collections = { cases };
