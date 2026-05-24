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
    <article className="border-b border-zinc-200 py-8 dark:border-zinc-800">
      <MediaImage
        className="relative mb-5 aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800"
        media={post.coverImage}
        sizes="(min-width: 768px) 720px, 100vw"
      />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(post.publishedAt)}</p>
      <h2 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-100">
        <Link className="hover:text-zinc-700 dark:hover:text-zinc-300" href={`/blog/${post.slug}`}>
          {post.title}
        </Link>
      </h2>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
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
