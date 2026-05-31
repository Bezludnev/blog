import type { Metadata } from "next";
import Link from "next/link";

import { CommentsSection } from "@/components/comments-section";
import { MediaImage } from "@/components/media-image";
import { PostViewTracker } from "@/components/post-view-tracker";
import { RichText } from "@/components/rich-text";
import { SiteHeader } from "@/components/site-header";
import { getMediaUrl } from "@/lib/media";
import { getPublishedPostBySlug } from "@/lib/posts";
import { canonicalUrl } from "@/lib/seo";
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

function formatReadingTime(value?: null | number) {
  if (!value || !Number.isFinite(value) || value < 1) {
    return null;
  }

  return `${Math.ceil(value)} min read`;
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
  const url = canonicalUrl(`/blog/${post.slug}`);

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt,
      images: coverUrl ? [{ url: coverUrl }] : undefined,
      url,
    },
  };
}

export default async function BlogPostPage({ params }: Args) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  const tags = getTags(post);
  const date = formatDate(post.publishedAt);
  const readingTime = formatReadingTime(post.readingTime);

  return (
    <div className="site-page">
      <SiteHeader />
      <PostViewTracker postSlug={post.slug} />
      <main className="site-main-detail" data-page>
        <article className="blog-detail-shell">
          <header className="blog-detail-hero">
            <p className="meta-copy">
              {readingTime ? `${date} / ${readingTime}` : date}
            </p>
            <h1 className="page-title mt-3">
              {post.title}
            </h1>
            <p className="page-lede-lg">
              {post.excerpt}
            </p>
          </header>
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
            className="blog-detail-cover media-frame"
            media={post.coverImage}
            priority
            sizes="(min-width: 1024px) 1024px, 100vw"
          />
          <div className="blog-detail-grid">
            <div className="blog-detail-content">
              <RichText content={post.content} />
              <CommentsSection postId={post.id} postSlug={post.slug} />
            </div>
            <aside
              aria-label="Article details"
              className="blog-detail-sidebar"
            >
              <h2 className="blog-detail-sidebar-title">Article details</h2>
              <dl className="blog-detail-facts">
                <div>
                  <dt>Published</dt>
                  <dd>{date}</dd>
                </div>
                <div>
                  <dt>Reading time</dt>
                  <dd>{readingTime || "Not estimated"}</dd>
                </div>
                <div>
                  <dt>Topics</dt>
                  <dd>
                    {tags.length > 0
                      ? tags.map((tag) => tag.name).join(", ")
                      : "No topics"}
                  </dd>
                </div>
              </dl>
              <Link className="action-link action-secondary mt-6" href="/blog">
                Back to blog
              </Link>
            </aside>
          </div>
        </article>
      </main>
    </div>
  );
}
