import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { isPageOutOfRange, normalizePageParam } from "@/lib/pagination";
import { getPublishedPostsPage } from "@/lib/posts";
import { normalizeSearchQuery } from "@/lib/search";

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
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
};

export const revalidate = 3600;

export default async function BlogPage({ searchParams }: Args) {
  const { page: pageParam, q } = await searchParams;
  const query = normalizeSearchQuery(q);
  const page = normalizePageParam(pageParam);
  const postsPage = await getPublishedPostsPage({ page, query });

  if (isPageOutOfRange(page, postsPage.totalPages, postsPage.totalDocs)) {
    notFound();
  }

  return (
    <div className="site-page">
      <SiteHeader />
      <main className="site-main">
        <h1 className="page-title">Blog</h1>
        <p className="page-lede">
          Published notes from the CMS.
        </p>
        <form action="/blog" className="mt-8 flex max-w-2xl gap-3" method="GET">
          <input
            className="form-field min-w-0 flex-1 dark:bg-zinc-900"
            defaultValue={query}
            name="q"
            placeholder="Search posts"
            type="search"
          />
          <button
            className="action-link action-primary border border-zinc-950 dark:border-zinc-100"
            type="submit"
          >
            Search
          </button>
        </form>
        {query ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <p>
              Search results for{" "}
              <span className="font-medium text-zinc-950 dark:text-zinc-100">{query}</span>
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
