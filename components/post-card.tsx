import Link from "next/link";

import { MediaImage } from "./media-image";
import type { Post, Tag } from "../payload-types";

function formatDate(value?: null | string) {
  if (!value) return "Unpublished";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getTags(post: Post) {
  return (post.tags || []).filter((tag): tag is Tag => {
    return typeof tag === "object" && tag !== null;
  });
}

export function PostCard({ post }: { post: Post }) {
  const tags = getTags(post);

  return (
    <article className="card-item">
      <MediaImage
        className="media-frame mb-5"
        media={post.coverImage}
        sizes="(min-width: 768px) 720px, 100vw"
      />
      <p className="meta-copy">{formatDate(post.publishedAt)}</p>
      <h2 className="card-title mt-2">
        <Link className="title-link" href={`/blog/${post.slug}`}>
          {post.title}
        </Link>
      </h2>
      <p className="muted-copy mt-3 max-w-2xl">{post.excerpt}</p>
      {tags.length > 0 ? (
        <div className="tag-row mt-4">
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
    </article>
  );
}
