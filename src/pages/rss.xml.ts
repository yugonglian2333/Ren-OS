import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { BLOG_CATEGORIES } from "../content/categories";

export async function GET(context: { site: URL }) {
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: "RenOS — AI builder",
    description:
      `${BLOG_CATEGORIES.join(" · ")}。记录做过的产品、学到的知识与长期使用的工具。`,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      categories: [post.data.category],
      link: `/blog/${post.slug}/`,
    })),
  });
}
