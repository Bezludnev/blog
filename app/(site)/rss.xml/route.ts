import { getRecentPublishedPostsForFeed } from "@/lib/posts";
import { buildRssFeed } from "@/lib/rss";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getRecentPublishedPostsForFeed(20);
  const xml = buildRssFeed({
    title: "MConverter.eu Blog",
    description: "Published notes from MConverter.eu.",
    siteUrl: absoluteUrl("/"),
    feedUrl: absoluteUrl("/rss.xml"),
    items: posts.map((post) => {
      const url = absoluteUrl(`/blog/${post.slug}`);

      return {
        title: post.title,
        url,
        guid: url,
        description: post.seoDescription || post.excerpt,
        publishedAt: post.publishedAt,
      };
    }),
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
