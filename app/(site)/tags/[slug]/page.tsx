import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { getPublishedPostsByTagId, getTagBySlug } from "@/lib/posts";

type Args = {
  params: Promise<{
    slug: string;
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

export default async function TagPage({ params }: Args) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const posts = await getPublishedPostsByTagId(tag.id);

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Tag
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-950">
          {tag.name}
        </h1>
        {tag.description ? (
          <p className="mt-4 max-w-2xl text-zinc-600">{tag.description}</p>
        ) : null}
        {posts.length > 0 ? (
          <div className="mt-8 bg-white px-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-10 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600">
            No published posts use this tag yet.
          </p>
        )}
      </main>
    </div>
  );
}
