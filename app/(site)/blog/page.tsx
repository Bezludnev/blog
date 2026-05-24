import type { Metadata } from "next";
import Link from "next/link";

import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { getPublishedPosts } from "@/lib/posts";
import { normalizeSearchQuery } from "@/lib/search";

type Args = {
  searchParams: Promise<{
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

export const dynamic = "force-dynamic";

export default async function BlogPage({ searchParams }: Args) {
  const { q } = await searchParams;
  const query = normalizeSearchQuery(q);
  const posts = await getPublishedPosts(query);

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-zinc-950">Blog</h1>
        <p className="mt-4 max-w-2xl text-zinc-600">
          Published notes from the CMS.
        </p>
        <form action="/blog" className="mt-8 flex max-w-2xl gap-3" method="GET">
          <input
            className="min-w-0 flex-1 border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-500"
            defaultValue={query}
            name="q"
            placeholder="Search posts"
            type="search"
          />
          <button
            className="border border-zinc-950 bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            type="submit"
          >
            Search
          </button>
        </form>
        {query ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <p>
              Search results for{" "}
              <span className="font-medium text-zinc-950">{query}</span>
            </p>
            <Link className="hover:text-zinc-950" href="/blog">
              Clear search
            </Link>
          </div>
        ) : null}
        {posts.length > 0 ? (
          <div className="mt-8 bg-white px-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-10 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600">
            {query ? "No posts match this search." : "No published posts yet."}
          </p>
        )}
      </main>
    </div>
  );
}
