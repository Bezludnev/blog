import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
    },
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
    })),
  ];
}
