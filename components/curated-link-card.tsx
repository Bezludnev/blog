import Link from "next/link";

import {
  getCuratedLinkTypeLabel,
  isCuratedLinkType,
} from "@/lib/curated-link-utils";
import type { CuratedLink, Tag } from "@/payload-types";

function formatDate(value?: null | string) {
  if (!value) return "Unpublished";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getTags(item: CuratedLink) {
  return (item.tags || []).filter((tag): tag is Tag => {
    return typeof tag === "object" && tag !== null;
  });
}

export function CuratedLinkCard({ item }: { item: CuratedLink }) {
  const tags = getTags(item);
  const type = isCuratedLinkType(item.type) ? item.type : "other";

  return (
    <article className="border-b border-zinc-200 py-8 dark:border-zinc-800">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
        <span>{getCuratedLinkTypeLabel(type)}</span>
        {item.source ? <span>{item.source}</span> : null}
        <span>{formatDate(item.publishedAt)}</span>
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-100">
        <a
          className="hover:text-zinc-700 dark:hover:text-zinc-300"
          href={item.url}
          rel="noreferrer"
          target="_blank"
        >
          {item.title}
        </a>
      </h2>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">
        {item.summary}
      </p>
      {item.note ? (
        <p className="mt-3 max-w-2xl border-l border-zinc-300 pl-4 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
          {item.note}
        </p>
      ) : null}
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
