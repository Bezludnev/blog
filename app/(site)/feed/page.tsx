import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CuratedLinkCard } from "@/components/curated-link-card";
import { Pagination } from "@/components/pagination";
import { SiteHeader } from "@/components/site-header";
import { getPublishedCuratedLinksPage } from "@/lib/curated-links";
import { isPageOutOfRange, normalizePageParam } from "@/lib/pagination";
import { canonicalUrl } from "@/lib/seo";

type Args = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

export const metadata: Metadata = {
  title: "Feed | Personal Engineering Blog",
  description: "Articles, videos, tools, and repositories worth saving.",
  alternates: {
    canonical: canonicalUrl("/feed"),
  },
  openGraph: {
    title: "Feed | Personal Engineering Blog",
    description: "Articles, videos, tools, and repositories worth saving.",
    url: canonicalUrl("/feed"),
  },
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
    <div className="site-page">
      <SiteHeader />
      <main className="site-main" data-page>
        <h1 className="page-title">Feed</h1>
        <p className="page-lede">
          Articles, videos, tools, and repositories worth saving.
        </p>
        {linksPage.docs.length > 0 ? (
          <div className="list-panel mt-8">
            {linksPage.docs.map((item) => (
              <CuratedLinkCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <p className="empty-state mt-10">
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
