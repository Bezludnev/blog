import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/posts";
import { getPublishedProjects } from "@/lib/projects";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts();
  const projects = await getPublishedProjects();
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: now,
    },
    {
      url: absoluteUrl("/projects"),
      lastModified: now,
    },
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
    })),
    ...projects.map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified: project.updatedAt ? new Date(project.updatedAt) : now,
    })),
  ];
}
