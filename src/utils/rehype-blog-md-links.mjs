const BLOG_CONTENT_PREFIX = "src/content/blog/";
const SLUG_PUNCTUATION =
  /[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~、，。！？（）【】《》：；“”‘’]/g;

function decodePath(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

function toAstroContentSlug(value) {
  return value.toLowerCase().replace(SLUG_PUNCTUATION, "").replace(/ /g, "-");
}

function toBlogHref(href) {
  if (typeof href !== "string") return href;
  if (/^(?:[a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) return href;

  const [pathPart, suffix = ""] = href.split(/(?=[?#])/u, 2);
  if (!pathPart.endsWith(".md") && !pathPart.endsWith(".mdx")) return href;

  const normalized = decodePath(pathPart).replace(/\\/g, "/");
  const filename = normalized.split("/").pop();
  if (!filename) return href;

  const slug = toAstroContentSlug(filename.replace(/\.(?:md|mdx)$/i, ""));
  return `/blog/${slug}${suffix}`;
}

function visit(node) {
  if (!node || typeof node !== "object") return;

  if (node.type === "element" && node.tagName === "a" && node.properties) {
    node.properties.href = toBlogHref(node.properties.href);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) visit(child);
  }
}

export function rehypeBlogMdLinks() {
  return function transformer(tree, file) {
    const sourcePath = file?.history?.[0]?.replace(/\\/g, "/") ?? "";
    if (!sourcePath.includes(BLOG_CONTENT_PREFIX)) return;

    visit(tree);
  };
}

function visitMarkdown(node) {
  if (!node || typeof node !== "object") return;

  if (node.type === "link") {
    node.url = toBlogHref(node.url);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) visitMarkdown(child);
  }
}

export function remarkBlogMdLinks() {
  return function transformer(tree, file) {
    const sourcePath = file?.history?.[0]?.replace(/\\/g, "/") ?? "";
    if (!sourcePath.includes(BLOG_CONTENT_PREFIX)) return;

    visitMarkdown(tree);
  };
}
