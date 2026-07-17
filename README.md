# RenOS — 个人网站

> AI builder.
> 在造旅行助手一路记 WayLog，做 Agent 提案式编辑；持续跟踪 AI 前沿，写下所见所学。

技术人版 Bento：首页 Hero 区用 Bento 卡片墙释放视觉冲击，内容区回到稳重单栏。

## 技术栈

- **Astro 5** + **Tailwind CSS 4**（`@tailwindcss/vite`）+ **MDX** + **TypeScript**
- 静态生成，Vercel 部署
- 深浅双模式（跟随系统 + 手动切换，`localStorage` 记忆）
- 内容集合：`src/content/blog/` 丢 md/mdx 即可发文
- 强调色赤陶橙 `#c96442`，设计 token 全在 `src/styles/global.css`

## 本地开发

```bash
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # 生成静态站到 dist/
pnpm preview      # 预览 build 产物
pnpm check        # 类型检查
```

> pnpm 11 默认拒绝运行依赖的 postinstall 脚本。首次安装如提示 `ERR_PNPM_IGNORED_BUILDS`，运行 `pnpm approve-builds --all` 一次即可（已通过 `.npmrc` 的 `onlyBuiltDependencies` 永久放行 esbuild / sharp）。
>
> 若 pnpm corepack 路径损坏报 `Cannot find module ...corepack/dist/pnpm.js`，用 `npx pnpm install` 或 `npx astro dev` 绕过。

---

## 日常维护指南

### 发一篇新文章

1. 在 `src/content/blog/` 下新建 `.md` 或 `.mdx` 文件（文件名即 URL slug，如 `ai-weekly-27.md` → `/blog/ai-weekly-27`）
2. 顶部 frontmatter：

```yaml
---
title: "文章标题"
description: "一句话摘要"
pubDate: 2026-07-05
category: "AI 周记"   # 七选一：AI 周记 / TIL / 工具 / 学习笔记 / 项目介绍 / 项目复盘 / 面经
draft: false          # true 则不发布
---
```

3. 正文用 Markdown / MDX 写，图片放 `public/blog-img/`，引用时写 `![](../../../public/blog-img/xxx.png)` 或用相对路径
4. `pnpm dev` 实时预览，满意后 `draft: false` 提交推送，Vercel 自动部署

**七个栏目定位**：
- **AI 周记**：每周一篇，记本周看到的新东西 + 短判断
- **TIL**：Today I Learned 碎片笔记
- **工具**：记录值得长期使用的工具与实践方法
- **学习笔记**：成体系的学习总结与教程
- **项目介绍**：应用的产品介绍、功能亮点与宣传内容
- **项目复盘**：做完某个功能写"为什么这么设计"
- **面经**：记录每次面试中遇到的问题、回答思路和复盘

> 文章正文样式由 `src/pages/blog/[slug].astro` 里的 `.prose-renos` 全局样式控制，会随深浅模式联动。要调排版改这里。

### 更新"此刻"页

编辑 `src/pages/now.astro`，改 `sections` 数组。五个 section：

| Section | 放什么 |
|---|---|
| 正在投入 | 主项目深度描述 |
| 在跟 / 在学 | 在跟的技术/领域 |
| 在读 / 在听 | 论文/文章/书/音乐 |
| 生活 & 其他 | 生活状态 |
| 暂停 / 不接 | 公开优先级，帮你挡事 |

改完顺手把 `updated` 日期变量改成今天。/now 理念是"告诉一年没见的朋友你最近在干嘛"，是大图景不是 todo 清单。

### 更新"关于"页

编辑 `src/pages/about.astro`，三个数据数组：

- `principles`：造/跟/记/屯 四原则
- `timeline`：经历时间线（year / role / what / link）
- `skills`：技能栈分组

### 更新"项目"页

编辑 `src/pages/projects.astro`，改 `waylogTags` / `waylogPoints` / `waylogLinks` 三个数组。要加新项目，复制旗舰项目卡的 `<article>` 结构再改一份。

### 改首页 Bento 卡片

编辑 `src/pages/index.astro`。Bento Hero 区是 6 块卡片（主卡 / Now / 旗舰项目 / 最新文章 / GitHub / 社交），下方单栏是最新文章列表 + 项目入口。最新文章自动从 `src/content/blog/` 拉取，不用手动改。

### 改导航栏

编辑 `src/components/nav.ts` 的 `navItems` 数组。桌面端导航和移动端抽屉都从这里读，改一处全站生效。当前 5 项：首页 / 项目 / 文章 / 此刻 / 关于。

### 改社交链接

全站社交链接散在三处，改的时候都要同步：

| 位置 | 文件 |
|---|---|
| 页脚 | `src/components/Footer.astro` |
| 首页社交卡 | `src/pages/index.astro`（第 ⑤ 块 Bento 卡） |
| 关于页联系区 | `src/pages/about.astro` |

### 改全站配色 / 字体 / 间距

编辑 `src/styles/global.css` 顶部的 `@theme` 块。所有 token（`--color-bg` / `--color-accent` / `--font-sans` / `--radius-card` 等）都在这里，改一处全站联动。深色模式 token 在 `.dark` 选择器下。

### 改站点域名

拿到真实域名后改 `astro.config.mjs` 第 9 行 `SITE`，影响 sitemap / canonical / RSS / OG 链接。

### 改头像 / OG 图

| 文件 | 用途 |
|---|---|
| `public/ren-avatar.jpg` | 全站头像（Header / 首页主卡 / about / 移动端导航） |
| `public/og-default.jpg` | 社交分享默认预览图（1200×630） |
| `public/favicon.svg` | 浏览器 tab 图标 |

换图直接覆盖同名文件即可。

---

## SEO 与搜索引擎收录

网站已内置完整 SEO：meta 标签、Open Graph、Twitter Card、canonical、sitemap、RSS、robots.txt、JSON-LD 结构化数据（Person + WebSite + Article）。但**搜索引擎不会自动发现你**，需要手动提交收录：

### Google 收录

1. 打开 [Google Search Console](https://search.google.com/search-console)
2. 添加资源 → 选"网址前缀"→ 输入 `https://renos.top`
3. 用 DNS TXT 记录验证所有权（Vercel 域名 DNS 里加）
4. 验证后提交 `https://renos.top/sitemap-index.xml` 到 Sitemap
5. 用"网址检查"工具手动请求索引首页和重要页面

### 百度收录

1. 打开 [百度搜索资源平台](https://ziyuan.baidu.com)
2. 添加网站 → 验证（DNS TXT 或文件验证）
3. 提交 sitemap：`https://renos.top/sitemap-index.xml`
4. 用"链接提交"主动推重要 URL

### Bing 收录

1. 打开 [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. 从 GSC 导入或手动添加，流程类似

### 提速收录的技巧

- **文章 URL 用英文/拼音 slug**：`ai-weekly-27.md` 比 `AI周记第27期.md` 更利于 SEO
- **多发外链**：在 X / GitHub / 即刻等平台放 renos.top 链接，爬虫跟着外链发现你
- **保持更新**：定期发文章，爬虫会提高回访频率
- **OG 图要真**：`public/og-default.jpg` 目前是头像占位，换成 1200×630 的真卡片图

---

## 部署到 Vercel

1. GitHub 仓库推送到 Vercel（import project），framework 自动识别为 Astro
2. Build Command：`pnpm build`，Output Directory：`dist`
3. **添加环境变量**（Vercel 项目 → Settings → Environment Variables）：

| 变量名 | 必填 | 说明 |
|---|---|---|
| `GITHUB_TOKEN` | 否 | GitHub Personal Access Token，用于 /now 页拉取仓库动态 |
| `PUBLIC_UMAMI_URL` | 否 | Umami 统计实例地址，如 `https://cloud.umami.is` |
| `PUBLIC_UMAMI_ID` | 否 | Umami 站点 ID |

4. 部署成功后绑自定义域名：Vercel 项目 → Settings → Domains → Add，按提示在你的域名 DNS 加 CNAME（或 A 记录指向 `cname.vercel-dns.com`）
5. 等 DNS 生效（几分钟到几小时），Vercel 自动签发 HTTPS 证书

---

## 内容管理（CMS）

项目使用 Decap CMS（原名 Netlify CMS）作为后台内容管理系统。

### 本地使用

开两个终端：

```bash
# 终端 1：Astro 开发服务器
pnpm dev

# 终端 2：Decap CMS 本地代理
pnpm cms
```

然后访问 `http://localhost:4322/admin/`，无需 GitHub 登录即可直接编辑所有内容。

### 线上部署（可选）

1. 在 GitHub 创建 [OAuth App](https://github.com/settings/developers/new)：
   - Homepage URL：`https://renos.top`
   - Authorization callback URL：`https://api.decapcms.org/auth/callback`
2. 复制 Client ID 和 Client Secret
3. 在 Vercel 项目环境变量中添加：
   - `KEYSTATIC_GITHUB_CLIENT_ID`
   - `KEYSTATIC_GITHUB_CLIENT_SECRET`
4. 修改 `public/admin/config.yml`，去掉 `local_backend: true`
5. 部署后访问 `https://renos.top/admin/` 用 GitHub 登录

---

## 搜索功能

使用 **Pagefind** 实现全站离线搜索。搜索索引在构建时生成：

```bash
pnpm build        # 构建并生成搜索索引
pnpm preview      # 预览时搜索可正常工作
```

> 注意：`pnpm dev` 开发模式下搜索不可用，因为需要 `dist/` 下的索引文件。日常写文章用 `pnpm dev`，要搜的时候跑 `pnpm build && pnpm preview`。

---

## 统计（Umami）

[Umami](https://cloud.umami.is) 是一个隐私友好的访问统计工具。

1. 在 Umami 注册账号 → 添加站点（名称：`RenOS`，域名：`renos.top`）
2. 将 Umami 提供的 Website ID 写入项目根目录 `.env` 文件：

```
PUBLIC_UMAMI_URL=https://cloud.umami.is
PUBLIC_UMAMI_ID=你的站点ID
```

3. 本地自动生效，部署到 Vercel 时需在环境变量中同步配置

---

## /now 页 GitHub 动态

`/now` 页除了手动编辑的 sections，还会在构建时自动拉取 GitHub 公开仓库列表，显示为「最近仓库动态」。

需要配置 `GITHUB_TOKEN`：

1. 在 [GitHub Token 设置页](https://github.com/settings/tokens) 生成 classic token
2. 权限选 `Public repositories`（read-only）
3. 写入 `.env` 文件：

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
PUBLIC_GITHUB_USER=yugonglian2333
```

> `.env` 已在 `.gitignore` 中，不会提交到仓库。部署到 Vercel 时需在 Settings → Environment Variables 中手动添加。

---

## 项目结构

```
src/
├── components/
│   ├── BaseHead.astro       # <head> 内 meta / OG / 字体 / canonical
│   ├── Header.astro          # 顶栏（桌面导航 + 移动端汉堡按钮）
│   ├── MobileNav.astro       # 移动端全屏导航抽屉
│   ├── Footer.astro          # 页脚社交链接
│   ├── ThemeToggle.astro     # 深浅模式切换按钮
│   ├── BentoCard.astro       # Bento 卡片基础组件
│   ├── SectionTitle.astro    # 单栏内容区小标题
│   ├── PostCard.astro        # 文章列表项
│   └── nav.ts                # 导航数据（navItems + isActive）
├── layouts/
│   └── BaseLayout.astro      # 全站骨架（skip-link + Header + main + Footer + MobileNav）
├── pages/
│   ├── index.astro           # 首页（Bento Hero + 最新文章 + 项目入口）
│   ├── projects.astro        # 项目页
│   ├── blog/
│   │   ├── index.astro       # 文章列表
│   │   └── [slug].astro      # 文章详情（含 .prose-renos 正文样式）
│   ├── now.astro             # 此刻页（五段式）
│   ├── about.astro           # 关于页（定位 + 四原则 + 经历 + 技能栈 + 联系）
│   ├── 404.astro             # 404 页
│   └── rss.xml.ts            # RSS 端点
├── content/
│   ├── config.ts             # 内容集合 schema（frontmatter 字段定义）
│   └── blog/                 # 文章 md/mdx 放这里
└── styles/
    └── global.css            # 设计 token + 复用 class + 动效

public/
├── ren-avatar.jpg            # 头像
├── og-default.jpg            # 社交分享图
├── favicon.svg               # tab 图标
└── blog-img/                 # 文章配图
```

设计参考：antfu.me / paco.me / leerob.com（单栏节奏 + Bento Hero 卡片墙），不抄代码，抄思路。

---

## 设计决策备忘

- **赤陶橙只用在三处**：强调符号（&、·、tag）/ 主 CTA / 链接 hover，其余回归中性色。不滥用。
- **移动端导航是全屏覆盖式**（参考苹果官网），不是侧边抽屉。因为 `backdrop-blur` 会破坏 `position: fixed` 的 containing block，全屏方案规避了这个 CSS 坑。
- **关于页合并了简历**：没有独立 /cv 页，经历和技能栈直接放在 /about 里，对标 stevenpetryk.com 的做法。
- **/now 页理念**：参考 Derek Sivers 的 nownownow 运动——"告诉一年没见的朋友你最近在干嘛"，是大图景不是 todo 清单。
- **文章正文样式**：`[slug].astro` 里的 `.prose-renos` 是手写的 prose 样式，用全站 token 体系，会随深浅模式联动。没用 Typora CSS（许可证 + 设计一致性都不允许）。
