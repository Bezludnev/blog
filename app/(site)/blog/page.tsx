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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-zinc-950 dark:text-zinc-100">Blog</h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Published notes from the CMS.
        </p>
        <form action="/blog" className="mt-8 flex max-w-2xl gap-3" method="GET">
          <input
            className="min-w-0 flex-1 border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100"
            defaultValue={query}
            name="q"
            placeholder="Search posts"
            type="search"
          />
          <button
            className="border border-zinc-950 bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
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
            <Link className="hover:text-zinc-950 dark:hover:text-zinc-100" href="/blog">
              Clear search
            </Link>
          </div>
        ) : null}
        {postsPage.docs.length > 0 ? (
          <div className="mt-8 bg-white px-6 dark:bg-zinc-900">
            {postsPage.docs.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-10 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
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
