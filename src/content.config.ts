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
    draft: z.boolean().default(false), // true = 不顯示在網站上
  }),
});

export const collections = { cases };
