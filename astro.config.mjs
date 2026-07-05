// @ts-check
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import compress from "astro-compress";
import critters from "astro-critters";
import icon from "astro-icon";
import rehypeAutolink from "rehype-autolink-headings";
import { remarkReadingTime } from "./src/utils/reading-time.mjs";

const SITE = "https://renos.top";

export default defineConfig({
  site: SITE,
  trailingSlash: "ignore",
  integrations: [
    expressiveCode({
    themes: ["vitesse-dark"],
    styleOverrides: {
      borderRadius: "8px",
      frames: { showCopyToClipboardButton: true },
    },
  }),
  mdx(),
  sitemap(),
  compress({
    HTML: true,
    CSS: true,
    JS: true,
    SVG: true,
  }),
  critters(),
  icon(),
  ],
  markdown: {
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      [rehypeAutolink, {
        behavior: "wrap",
        properties: { class: "heading-anchor" },
      }],
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
        "@layouts": fileURLToPath(new URL("./src/layouts", import.meta.url)),
      },
    },
  },
});
