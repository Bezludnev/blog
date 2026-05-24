import type { Metadata } from "next";
import Link from "next/link";

import { CommentsSection } from "@/components/comments-section";
import { MediaImage } from "@/components/media-image";
import { PostViewTracker } from "@/components/post-view-tracker";
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

export const revalidate = 3600;

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
    <div className="site-page">
      <SiteHeader />
      <PostViewTracker postSlug={post.slug} />
      <main className="site-main-narrow">
        <article className="article-panel">
          <p className="meta-copy">{formatDate(post.publishedAt)}</p>
          <h1 className="page-title mt-3">
            {post.title}
          </h1>
          <p className="page-lede-lg">
            {post.excerpt}
          </p>
          {tags.length > 0 ? (
            <div className="tag-row mt-5">
              {tags.map((tag) => (
                <Link
                  className="tag-pill"
                  href={`/tags/${tag.slug}`}
                  key={tag.id}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : null}
          <MediaImage
            className="media-frame mt-8"
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
