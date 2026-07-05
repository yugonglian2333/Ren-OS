import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(["AI 周记", "TIL", "项目复盘", "学习笔记"]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };