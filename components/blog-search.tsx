"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export type BlogSearchPost = {
  id: string;
  slug: string;
  title: string;
  excerpt?: null | string;
  publishedAt?: null | string;
  tagNames: string[];
};

const RESULT_LIMIT = 6;

function formatResultDate(value?: null | string) {
  if (!value) return "Unpublished";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function postMatches(post: BlogSearchPost, term: string) {
  const haystack = [
    post.title,
    post.excerpt ?? "",
    post.tagNames.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term);
}

type Props = {
  initialQuery: string;
  posts: BlogSearchPost[];
};

export function BlogSearch({ initialQuery, posts }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [trackedQuery, setTrackedQuery] = useState(query);
  const overlayInputRef = useRef<HTMLInputElement>(null);

  if (query !== trackedQuery) {
    setTrackedQuery(query);
    setCursor(0);
  }

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return posts.slice(0, RESULT_LIMIT);
    return posts.filter((p) => postMatches(p, term)).slice(0, RESULT_LIMIT);
  }, [query, posts]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => {
      overlayInputRef.current?.focus();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((c) => Math.min(c + 1, Math.max(results.length - 1, 0)));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((c) => Math.max(c - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        const active = results[cursor];
        if (active) {
          event.preventDefault();
          setIsOpen(false);
          router.push(`/blog/${active.slug}`);
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursor, isOpen, results, router]);

  function openOverlay() {
    setQuery(initialQuery);
    setIsOpen(true);
  }

  function closeOverlay() {
    setIsOpen(false);
  }

  return (
    <>
      <form action="/blog" className="mt-8 flex max-w-2xl gap-3" method="GET">
        <input
          aria-label="Search posts"
          className="form-field search-trigger min-w-0 flex-1"
          defaultValue={initialQuery}
          name="q"
          onClick={openOverlay}
          onFocus={openOverlay}
          placeholder="Search posts"
          readOnly
          type="search"
        />
        <button
          className="action-link action-primary"
          onClick={(event) => {
            event.preventDefault();
            openOverlay();
          }}
          type="button"
        >
          Search
        </button>
      </form>

      <div
        aria-hidden="true"
        className={"search-backdrop" + (isOpen ? " is-open" : "")}
        onClick={closeOverlay}
      />
      <div
        aria-label="Search posts"
        aria-modal="true"
        className={"search-panel" + (isOpen ? " is-open" : "")}
        role="dialog"
      >
        <input
          aria-label="Search posts"
          className="form-field"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search posts, tags, or projects"
          ref={overlayInputRef}
          type="search"
          value={query}
        />
        <div className="search-hint">
          <span>
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> navigate · <kbd>↵</kbd> open ·{" "}
            <kbd>esc</kbd> close
          </span>
        </div>
        <div className="search-results">
          {results.length === 0 ? (
            <p
              className="muted-copy"
              style={{ padding: "0.625rem 0.75rem", fontSize: "0.875rem" }}
            >
              No posts match this search.
            </p>
          ) : (
            results.map((post, index) => (
              <Link
                className={
                  "search-result" + (index === cursor ? " is-active" : "")
                }
                href={`/blog/${post.slug}`}
                key={post.id}
                onClick={closeOverlay}
                onMouseEnter={() => setCursor(index)}
              >
                <span className="r-title">{post.title}</span>
                <span className="r-meta">
                  {formatResultDate(post.publishedAt)} ·{" "}
                  {post.tagNames.length > 0
                    ? post.tagNames.join(" / ")
                    : "untagged"}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}
