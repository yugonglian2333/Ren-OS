import { defineCollection, z } from "astro:content";
import { BLOG_CATEGORIES } from "./categories";

const blog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    category: z.enum(BLOG_CATEGORIES),
    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),
    priority: z.number().default(0),
  }),
});

export const collections = { blog };
