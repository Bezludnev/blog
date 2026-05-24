import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Pagination } from "@/components/pagination";
import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { isPageOutOfRange, normalizePageParam } from "@/lib/pagination";
import { getPublishedPostsByTagIdPage, getTagBySlug } from "@/lib/posts";
import { canonicalUrl } from "@/lib/seo";

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

  const url = canonicalUrl(`/tags/${tag.slug}`);

  return {
    title: `${tag.name} | Personal Engineering Blog`,
    description: tag.description || `Published posts tagged ${tag.name}.`,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${tag.name} | Personal Engineering Blog`,
      description: tag.description || `Published posts tagged ${tag.name}.`,
      url,
    },
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
    <div className="site-page">
      <SiteHeader />
      <main className="site-main">
        <p className="page-eyebrow">Tag</p>
        <h1 className="page-title mt-3">
          {tag.name}
        </h1>
        {tag.description ? (
          <p className="page-lede">{tag.description}</p>
        ) : null}
        {postsPage.docs.length > 0 ? (
          <div className="list-panel mt-8">
            {postsPage.docs.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="empty-state mt-10">
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
