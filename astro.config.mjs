// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// 真实域名：renos.top（用于 sitemap / canonical / OG / RSS）
const SITE = "https://renos.top";

// https://astro.build/config
export default defineConfig({
  site: SITE,
  trailingSlash: "ignore",
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});