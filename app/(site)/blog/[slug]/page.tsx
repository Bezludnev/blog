import type { Metadata } from "next";

import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import { SiteHeader } from "@/components/site-header";
import { getMediaUrl } from "@/lib/media";
import { getPublishedPostBySlug } from "@/lib/posts";

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
          <MediaImage
            className="relative mt-8 aspect-[16/9] overflow-hidden bg-zinc-100"
            media={post.coverImage}
            priority
            sizes="(min-width: 768px) 768px, 100vw"
          />
          <RichText content={post.content} />
        </article>
      </main>
    </div>
  );
}
