import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogSearch, type BlogSearchPost } from "@/components/blog-search";
import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { isPageOutOfRange, normalizePageParam } from "@/lib/pagination";
import {
  getPublishedPostsPage,
  getRecentPublishedPostsForSearch,
} from "@/lib/posts";
import { normalizeSearchQuery } from "@/lib/search";
import { canonicalUrl } from "@/lib/seo";
import type { Tag } from "@/payload-types";

type Args = {
  searchParams: Promise<{
    page?: string | string[];
    q?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Blog | Personal Engineering Blog",
  description: "Published notes from this personal engineering blog.",
  alternates: {
    canonical: canonicalUrl("/blog"),
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  openGraph: {
    title: "Blog | Personal Engineering Blog",
    description: "Published notes from this personal engineering blog.",
    url: canonicalUrl("/blog"),
  },
};

export const revalidate = 3600;

export default async function BlogPage({ searchParams }: Args) {
  const { page: pageParam, q } = await searchParams;
  const query = normalizeSearchQuery(q);
  const page = normalizePageParam(pageParam);
  const [postsPage, postsForSearch] = await Promise.all([
    getPublishedPostsPage({ page, query }),
    getRecentPublishedPostsForSearch(50),
  ]);

  if (isPageOutOfRange(page, postsPage.totalPages, postsPage.totalDocs)) {
    notFound();
  }

  const searchPosts: BlogSearchPost[] = postsForSearch.map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? null,
    publishedAt: post.publishedAt ?? null,
    tagNames: (post.tags || [])
      .filter((tag): tag is Tag => typeof tag === "object" && tag !== null)
      .map((tag) => tag.name),
  }));

  return (
    <div className="site-page">
      <SiteHeader />
      <main className="site-main" data-page>
        <h1 className="page-title">Blog</h1>
        <p className="page-lede">
          Published notes from the CMS.
        </p>
        <BlogSearch initialQuery={query} posts={searchPosts} />
        {query ? (
          <div className="search-summary">
            <p>
              Search results for{" "}
              <span className="search-summary-term">{query}</span>
            </p>
            <Link className="text-link" href="/blog">
              Clear search
            </Link>
          </div>
        ) : null}
        {postsPage.docs.length > 0 ? (
          <div className="list-panel mt-8">
            {postsPage.docs.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="empty-state mt-10">
            {query ? "No posts match this search." : "No published posts yet."}
          </p>
        )}
        <Pagination
          hasNextPage={postsPage.hasNextPage}
          hasPrevPage={postsPage.hasPrevPage}
          nextPage={postsPage.nextPage}
          page={postsPage.page}
          pathname="/blog"
          prevPage={postsPage.prevPage}
          query={query}
          totalPages={postsPage.totalPages}
        />
      </main>
    </div>
  );
}
