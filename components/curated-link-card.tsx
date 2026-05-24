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
    <article className="card-item">
      <div className="meta-copy flex flex-wrap items-center gap-3">
        <span>{getCuratedLinkTypeLabel(type)}</span>
        {item.source ? <span>{item.source}</span> : null}
        <span>{formatDate(item.publishedAt)}</span>
      </div>
      <h2 className="card-title mt-2">
        <a
          className="title-link"
          href={item.url}
          rel="noreferrer"
          target="_blank"
        >
          {item.title}
        </a>
      </h2>
      <p className="muted-copy mt-3 max-w-2xl">
        {item.summary}
      </p>
      {item.note ? (
        <p className="body-copy accent-note mt-3 max-w-2xl">
          {item.note}
        </p>
      ) : null}
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
