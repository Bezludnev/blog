import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { isPageOutOfRange, normalizePageParam } from "@/lib/pagination";
import { getPublishedPostsByTagIdPage, getTagBySlug } from "@/lib/posts";

type Args = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

export const revalidate = 3600;

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  return {
    title: `${tag.name} | Personal Engineering Blog`,
    description: tag.description || `Published posts tagged ${tag.name}.`,
  };
}

export default async function TagPage({ params, searchParams }: Args) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = normalizePageParam(pageParam);
  const tag = await getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const postsPage = await getPublishedPostsByTagIdPage({
    page,
    tagId: tag.id,
  });

  if (isPageOutOfRange(page, postsPage.totalPages, postsPage.totalDocs)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Tag
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-950 dark:text-zinc-100">
          {tag.name}
        </h1>
        {tag.description ? (
          <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">{tag.description}</p>
        ) : null}
        {postsPage.docs.length > 0 ? (
          <div className="mt-8 bg-white px-6 dark:bg-zinc-900">
            {postsPage.docs.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-10 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No published posts use this tag yet.
          </p>
        )}
        <Pagination
          hasNextPage={postsPage.hasNextPage}
          hasPrevPage={postsPage.hasPrevPage}
          nextPage={postsPage.nextPage}
          page={postsPage.page}
          pathname={`/tags/${tag.slug}`}
          prevPage={postsPage.prevPage}
          totalPages={postsPage.totalPages}
        />
      </main>
    </div>
  );
}
