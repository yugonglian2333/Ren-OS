# RenOS — 个人网站

> AI builder & BTC holder.
> 在造旅行助手一路记 WayLog，做 Agent 提案式编辑；持续跟踪 AI 前沿，写下所见所学。

技术人版 Bento：首页 Hero 区用 Bento 卡片墙释放视觉冲击，内容区回到稳重单栏。

## 技术栈

- **Astro 5** + **Tailwind CSS 4**（`@tailwindcss/vite`）+ **MDX** + **TypeScript**
- 静态生成，Vercel 部署
- 深浅双模式（跟随系统 + 手动切换，`localStorage` 记忆）
- 内容集合：`src/content/blog/` 丢 mdx 即可发文

## 本地开发

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build       # 生成静态站到 dist/
pnpm preview     # 预览 build 产物
```

> pnpm 11 默认拒绝运行依赖的 postinstall 脚本。首次安装如提示 `ERR_PNPM_IGNORED_BUILDS`，运行 `pnpm approve-builds --all` 一次即可（已通过 `.npmrc` 的 `onlyBuiltDependencies` 永久放行 esbuild / sharp）。

## 写文章

`src/content/blog/` 下新建 `.md` 或 `.mdx`，frontmatter：

```yaml
---
title: "文章标题"
description: "一句话摘要"
pubDate: 2026-07-04
category: "AI 周记"   # AI 周记 / TIL / 项目复盘
draft: false          # true 则不发布
---
```

三个栏目：**AI 周记**（每周一篇，记本周看到的新东西 + 短判断）/ **TIL**（Today I Learned 碎片笔记）/ **项目复盘**（做完某个功能写"为什么这么设计"）。

## 部署到 Vercel

1. GitHub 仓库推送到 Vercel（import project），framework 自动识别为 Astro
2. Build Command：`pnpm build`，Output Directory：`dist`
3. 部署成功后绑自定义域名：Vercel 项目 → Settings → Domains → Add，按提示在你的域名 DNS 加 CNAME（或 A 记录指向 `cname.vercel-dns.com`）
4. 等 DNS 生效（几分钟到几小时），Vercel 自动签发 HTTPS 证书

### 改 site URL

拿到真实域名后改 [`astro.config.mjs`](astro.config.mjs) 里的 `SITE`，影响 sitemap / canonical / RSS。

## 还要填的占位

- [ ] 真实域名 → `astro.config.mjs` `SITE`
- [ ] X / Twitter 账号 → [Header.astro](src/components/Header.astro) 之外，[Footer.astro](src/components/Footer.astro) 和 [index.astro](src/pages/index.astro) 社交卡里的 `https://x.com/`
- [ ] 邮箱 → `hello@example.com`（Footer、About、index 社交卡）
- [ ] 头像 / OG 图 → [public/og-default.png](public/og-default.png)（当前用 favicon 占位）
- [ ] GitHub 统计数字 → 当前静态文字，后续可接 GitHub API
- [ ] Now 页"本周在读"具体内容

## 结构

```
src/
├── components/      BaseHead, Header, Footer, ThemeToggle, BentoCard…
├── layouts/         BaseLayout
├── pages/           index / projects / blog/ / about / now / 404 / rss.xml
├── content/blog/    文章 mdx
└── styles/global.css  设计 token + 复用 class
```

设计参考：antfu.me / paco.me / leerob.com（单栏节奏 + Bento Hero 卡片墙），不抄代码，抄思路。