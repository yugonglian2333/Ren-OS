export function remarkReadingTime() {
  return function (tree, { data }) {
    const text = tree.children
      .filter((n) => n.type === "paragraph" || n.type === "heading")
      .map((n) => n.children?.map((c) => c.value || "").join("") || "")
      .join(" ");
    const words = text.split(/\s+/g).filter(Boolean).length;
    const minutes = Math.max(1, Math.ceil(words / 300));
    data.astro.frontmatter.readingTime = minutes;
  };
}
