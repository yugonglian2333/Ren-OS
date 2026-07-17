import { BLOG_CATEGORIES } from "../content/categories";

export interface NavItem {
  href: string;
  label: string;
  eyebrow: string;
  desc: string;
}

export const navItems: NavItem[] = [
  { href: "/", label: "首页", eyebrow: "Start", desc: "回到 RenOS 的第一屏" },
  { href: "/projects", label: "项目", eyebrow: "Build", desc: "WayLog、Saymore 和持续落地的想法" },
  { href: "/blog", label: "文章", eyebrow: "Notes", desc: BLOG_CATEGORIES.join("、") },
  { href: "/about", label: "关于", eyebrow: "About", desc: "背景、兴趣和联系方式" },
];

export function isActive(path: string, href: string): boolean {
  return href === "/" ? path === "/" : path.startsWith(href);
}
