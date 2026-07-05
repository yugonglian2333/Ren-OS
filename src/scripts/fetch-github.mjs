/**
 * 构建时从 GitHub 拉取最近活动
 * 用于 /now 页面自动展示
 * 用法：node src/scripts/fetch-github.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 手动加载 .env（不依赖 dotenv）
const envPath = path.resolve(fileURLToPath(import.meta.url), "../../../.env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const idx = line.indexOf("=");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const TOKEN = process.env.GITHUB_TOKEN || "";
const USER = process.env.PUBLIC_GITHUB_USER || "yugonglian2333";
const OUTPUT = new URL("../../src/data/github.json", import.meta.url);

if (!TOKEN) {
  console.warn("⚠️  GITHUB_TOKEN 未设置，跳过 GitHub 活动拉取");
  process.exit(0);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "RenOS",
};

async function fetchJSON(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${res.statusText}`);
  return res.json();
}

async function main() {
  const data = {
    updated: new Date().toISOString().slice(0, 10),
    repos: [],
    commits: [],
    stars: [],
  };

  // 1. 获取用户的公开仓库（按更新时间排序）
  const repos = await fetchJSON(
    `https://api.github.com/users/${USER}/repos?sort=updated&per_page=5`
  );
  data.repos = repos.map((r) => ({
    name: r.name,
    url: r.html_url,
    description: r.description,
    language: r.language,
    updatedAt: r.updated_at?.slice(0, 10),
    stars: r.stargazers_count,
  }));

  // 2. 获取最近的公开活动
  const events = await fetchJSON(
    `https://api.github.com/users/${USER}/events/public?per_page=10`
  );
  for (const e of events.slice(0, 5)) {
    if (e.type === "PushEvent") {
      const repoName = e.repo.name;
      const commits = e.payload?.commits || [];
      for (const c of commits.slice(0, 3)) {
        data.commits.push({
          repo: repoName,
          message: c.message?.split("\n")[0],
          url: `https://github.com/${repoName}/commit/${c.sha}`,
          date: e.created_at?.slice(0, 10),
        });
      }
    }
    if (e.type === "WatchEvent" && e.payload?.action === "started") {
      data.stars.push({
        repo: e.repo.name,
        url: `https://github.com/${e.repo.name}`,
        date: e.created_at?.slice(0, 10),
      });
    }
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅  GitHub 活动已更新：${data.repos.length} repos`);
}

main().catch((err) => {
  console.error("❌  GitHub 拉取失败：", err.message);
  process.exit(1);
});
