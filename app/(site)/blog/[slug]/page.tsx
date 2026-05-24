import type { Metadata } from "next";
import Link from "next/link";

import { CommentsSection } from "@/components/comments-section";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import { SiteHeader } from "@/components/site-header";
import { getMediaUrl } from "@/lib/media";
import { getPublishedPostBySlug } from "@/lib/posts";
import type { Post, Tag } from "@/payload-types";

type Args = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function formatDate(value?: null | string) {
  if (!value) return "Unpublished";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "long",
  }).format(new Date(value));
}

function getTags(post: Post) {
  return (post.tags || []).filter((tag): tag is Tag => {
    return typeof tag === "object" && tag !== null;
  });
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  const coverUrl = getMediaUrl(post.coverImage);

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: coverUrl ? [{ url: coverUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Args) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  const tags = getTags(post);

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <article className="bg-white px-6 py-10">
          <p className="text-sm text-zinc-500">{formatDate(post.publishedAt)}</p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-950">
            {post.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-600">
            {post.excerpt}
          </p>
          {tags.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600"
                  href={`/tags/${tag.slug}`}
                  key={tag.id}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : null}
          <MediaImage
            className="relative mt-8 aspect-[16/9] overflow-hidden bg-zinc-100"
            media={post.coverImage}
            priority
            sizes="(min-width: 768px) 768px, 100vw"
          />
          <RichText content={post.content} />
          <CommentsSection postId={post.id} postSlug={post.slug} />
        </article>
      </main>
    </div>
  );
}
