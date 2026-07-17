export interface NavItem {
  href: string;
  label: string;
}

export const navItems: NavItem[] = [
  { href: "/", label: "首页" },
  { href: "/projects", label: "项目" },
  { href: "/blog", label: "文章" },
  { href: "/about", label: "关于" },
];

export function isActive(path: string, href: string): boolean {
  return href === "/" ? path === "/" : path.startsWith(href);
}
