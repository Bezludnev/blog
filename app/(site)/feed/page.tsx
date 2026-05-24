import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CuratedLinkCard } from "@/components/curated-link-card";
import { Pagination } from "@/components/pagination";
import { SiteHeader } from "@/components/site-header";
import { getPublishedCuratedLinksPage } from "@/lib/curated-links";
import { isPageOutOfRange, normalizePageParam } from "@/lib/pagination";

type Args = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Feed | Personal Engineering Blog",
  description: "Articles, videos, tools, and repositories worth saving.",
};

export const revalidate = 3600;

export default async function FeedPage({ searchParams }: Args) {
  const { page: pageParam } = await searchParams;
  const page = normalizePageParam(pageParam);
  const linksPage = await getPublishedCuratedLinksPage({ page });

  if (isPageOutOfRange(page, linksPage.totalPages, linksPage.totalDocs)) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-zinc-950 dark:text-zinc-100">
          Feed
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Articles, videos, tools, and repositories worth saving.
        </p>
        {linksPage.docs.length > 0 ? (
          <div className="mt-8 bg-white px-6 dark:bg-zinc-900">
            {linksPage.docs.map((item) => (
              <CuratedLinkCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <p className="mt-10 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No curated links published yet.
          </p>
        )}
        <Pagination
          hasNextPage={linksPage.hasNextPage}
          hasPrevPage={linksPage.hasPrevPage}
          nextPage={linksPage.nextPage}
          page={linksPage.page}
          pathname="/feed"
          prevPage={linksPage.prevPage}
          totalPages={linksPage.totalPages}
        />
      </main>
    </div>
  );
}
