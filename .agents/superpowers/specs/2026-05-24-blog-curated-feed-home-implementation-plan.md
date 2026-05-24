# Blog Curated Feed And CMS Home Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-managed curated feed of external articles/videos/tools and make the home page show CMS-backed recent content.

**Architecture:** Add a separate `CuratedLinks` Payload collection, isolated pure helper functions for type and URL validation, and server-side data helpers for published feed items. Render `/feed` as a paginated public list and update `/` to aggregate `SiteSettings`, recent posts, featured projects, and curated links.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PayloadCMS 3.84.x, MongoDB, Tailwind CSS 4, Node test runner, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Design spec: `docs/superpowers/specs/2026-05-24-blog-curated-feed-home-design.md`
- Existing home page: `app/(site)/page.tsx`
- Existing blog list pattern: `app/(site)/blog/page.tsx`
- Existing project list pattern: `app/(site)/projects/page.tsx`
- Existing collection patterns: `collections/Posts.ts`, `collections/Projects.ts`
- Existing revalidation helpers: `lib/revalidation.ts`, `lib/payload-revalidation.ts`

## Implementation Rules

- Use @test-driven-development for pure helper and revalidation changes.
- Use @verification-before-completion before claiming completion.
- Keep curated external materials separate from blog posts.
- Only admins can write curated links.
- Public users only see `status = published` curated links.
- Do not add URL scraping, embeds, feed comments, feed metrics, or public write
  endpoints.
- Do not mix curated links into `/rss.xml`.
- Do not add `/feed/[slug]` in this slice.
- Do not move the public shell into `app/layout.tsx`; keep `(site)` and
  `(payload)` route groups separate.
- Do not commit unless the user explicitly asks.

## File Map

Create:

- `lib/curated-link-utils.ts`: pure curated link type and URL helpers.
- `lib/curated-link-utils.test.ts`: Node tests for pure helpers.
- `lib/curated-links.ts`: Payload data access for published curated links.
- `collections/CuratedLinks.ts`: Payload collection config.
- `components/curated-link-card.tsx`: public card/row for curated links.
- `app/(site)/feed/page.tsx`: paginated public feed page.

Modify:

- `payload.config.ts`: register `CuratedLinks`.
- `payload-types.ts`: regenerate after schema change.
- `lib/revalidation.ts`: add curated feed paths and include `/` when posts or
  projects change.
- `lib/revalidation.test.ts`: cover curated feed and home aggregation paths.
- `lib/payload-revalidation.ts`: add curated link hooks.
- `lib/projects.ts`: add helper for featured projects for home.
- `app/(site)/page.tsx`: render CMS-backed home sections.
- `app/(site)/sitemap.ts`: include `/feed`.
- `components/site-header.tsx`: add `Feed` navigation link.
- `README.md`: add manual verification checklist.

Do not modify:

- `app/(site)/rss.xml/route.ts`
- `app/(site)/blog/[slug]/page.tsx`
- `app/(site)/projects/[slug]/page.tsx`
- `collections/Posts.ts`, except if revalidation hooks require type imports,
  which should not be needed.
- `collections/Projects.ts`, except if revalidation hooks require type imports,
  which should not be needed.
- `collections/Comments.ts`
- `components/vercel-insights.tsx`
- Payload admin layout files.

## Chunk 1: Pure Curated Link Helpers

### Task 1: Add failing helper tests

**Files:**

- Create: `lib/curated-link-utils.test.ts`

- [ ] **Step 1: Write tests**

  ```ts
  import assert from "node:assert/strict";
  import { describe, it } from "node:test";

  import {
    CURATED_LINK_TYPES,
    getCuratedLinkTypeLabel,
    isCuratedLinkType,
    isSafeExternalUrl,
  } from "./curated-link-utils.ts";

  describe("isCuratedLinkType", () => {
    it("accepts only supported curated link types", () => {
      assert.equal(isCuratedLinkType("article"), true);
      assert.equal(isCuratedLinkType("video"), true);
      assert.equal(isCuratedLinkType("tool"), true);
      assert.equal(isCuratedLinkType("repo"), true);
      assert.equal(isCuratedLinkType("other"), true);
      assert.equal(isCuratedLinkType("podcast"), false);
      assert.equal(isCuratedLinkType(null), false);
    });

    it("keeps the type list stable for Payload select options", () => {
      assert.deepEqual(CURATED_LINK_TYPES, [
        "article",
        "video",
        "tool",
        "repo",
        "other",
      ]);
    });
  });

  describe("getCuratedLinkTypeLabel", () => {
    it("returns display labels for supported types", () => {
      assert.equal(getCuratedLinkTypeLabel("article"), "Article");
      assert.equal(getCuratedLinkTypeLabel("video"), "Video");
      assert.equal(getCuratedLinkTypeLabel("tool"), "Tool");
      assert.equal(getCuratedLinkTypeLabel("repo"), "Repository");
      assert.equal(getCuratedLinkTypeLabel("other"), "Other");
    });
  });

  describe("isSafeExternalUrl", () => {
    it("accepts http and https URLs", () => {
      assert.equal(isSafeExternalUrl("https://example.com/article"), true);
      assert.equal(isSafeExternalUrl("http://example.com/tool"), true);
    });

    it("rejects relative, malformed, and unsafe-protocol URLs", () => {
      assert.equal(isSafeExternalUrl("/blog"), false);
      assert.equal(isSafeExternalUrl("not a url"), false);
      assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
      assert.equal(isSafeExternalUrl("mailto:test@example.com"), false);
    });
  });
  ```

- [ ] **Step 2: Run focused test**

  Run: `node --test lib/curated-link-utils.test.ts`

  Expected: FAIL because `lib/curated-link-utils.ts` does not exist.

### Task 2: Implement pure helpers

**Files:**

- Create: `lib/curated-link-utils.ts`

- [ ] **Step 1: Add helper exports**

  ```ts
  export const CURATED_LINK_TYPES = [
    "article",
    "video",
    "tool",
    "repo",
    "other",
  ] as const;

  export type CuratedLinkType = (typeof CURATED_LINK_TYPES)[number];

  const TYPE_LABELS: Record<CuratedLinkType, string> = {
    article: "Article",
    other: "Other",
    repo: "Repository",
    tool: "Tool",
    video: "Video",
  };

  export function isCuratedLinkType(value: unknown): value is CuratedLinkType {
    return (
      typeof value === "string" &&
      CURATED_LINK_TYPES.includes(value as CuratedLinkType)
    );
  }

  export function getCuratedLinkTypeLabel(type: CuratedLinkType) {
    return TYPE_LABELS[type];
  }

  export function isSafeExternalUrl(value: unknown) {
    if (typeof value !== "string") return false;

    try {
      const url = new URL(value);

      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }
  ```

- [ ] **Step 2: Verify helper tests pass**

  Run: `node --test lib/curated-link-utils.test.ts`

  Expected: PASS.

## Chunk 2: Revalidation Paths

### Task 3: Add failing revalidation tests

**Files:**

- Modify: `lib/revalidation.test.ts`

- [ ] **Step 1: Add tests for curated feed and home aggregation**

  Extend the import list:

  ```ts
  import {
    getAllRevalidationPaths,
    getCuratedLinkRevalidationPaths,
    getPostRevalidationPaths,
    getProjectRevalidationPaths,
    getRevalidationPathsForTarget,
  } from "./revalidation.ts";
  ```

  Add a curated-link path test:

  ```ts
  it("returns curated feed paths", () => {
    assert.deepEqual(getCuratedLinkRevalidationPaths(), [
      "/feed",
      "/",
      "/sitemap.xml",
    ]);
  });
  ```

  Update the existing post path expectation so `/` is included:

  ```ts
  [
    "/blog",
    "/",
    "/rss.xml",
    "/sitemap.xml",
    "/blog/new-post",
    "/blog/old-post",
    "/tags/nextjs",
    "/tags/payload",
  ];
  ```

  Update the existing project path expectation so `/` is included:

  ```ts
  [
    "/projects",
    "/",
    "/sitemap.xml",
    "/projects/new-project",
    "/projects/old-project",
  ];
  ```

  Update the all-content path expectation:

  ```ts
  assert.deepEqual(getAllRevalidationPaths(), [
    "/",
    "/about",
    "/contact",
    "/sitemap.xml",
    "/blog",
    "/rss.xml",
    "/projects",
    "/feed",
  ]);
  ```

  Update the known route target test for `posts`:

  ```ts
  assert.deepEqual(getRevalidationPathsForTarget({ target: "posts" }), [
    "/blog",
    "/",
    "/rss.xml",
    "/sitemap.xml",
  ]);
  ```

  Add a target test for curated links:

  ```ts
  assert.deepEqual(getRevalidationPathsForTarget({ target: "curated-links" }), [
    "/feed",
    "/",
    "/sitemap.xml",
  ]);
  assert.deepEqual(getRevalidationPathsForTarget({ target: "curated-link" }), [
    "/feed",
    "/",
    "/sitemap.xml",
  ]);
  ```

- [ ] **Step 2: Run focused test**

  Run: `node --test lib/revalidation.test.ts`

  Expected: FAIL because curated link paths are not implemented yet and post or
  project paths do not include `/`.

### Task 4: Implement revalidation helpers

**Files:**

- Modify: `lib/revalidation.ts`

- [ ] **Step 1: Extend target input type**

  Add `curated-link` and `curated-links` handling without adding slug logic.

- [ ] **Step 2: Add helper**

  ```ts
  export function getCuratedLinkRevalidationPaths() {
    return ["/feed", "/", "/sitemap.xml"];
  }
  ```

- [ ] **Step 3: Include home in post/project paths**

  Add `/` to both `getPostRevalidationPaths()` and
  `getProjectRevalidationPaths()` because home now shows recent posts and
  featured projects.

- [ ] **Step 4: Include curated links in all-target paths**

  Add `...getCuratedLinkRevalidationPaths()` to `getAllRevalidationPaths()`.

- [ ] **Step 5: Add manual target support**

  In `getRevalidationPathsForTarget`, return curated link paths for:

  - `curated-links`
  - `curated-link`

- [ ] **Step 6: Verify revalidation tests pass**

  Run: `node --test lib/revalidation.test.ts`

  Expected: PASS.

## Chunk 3: Payload Collection

### Task 5: Add `CuratedLinks` collection

**Files:**

- Create: `collections/CuratedLinks.ts`
- Modify later: `payload.config.ts`

- [ ] **Step 1: Create collection config**

  ```ts
  import type { CollectionConfig } from "payload";

  import {
    CURATED_LINK_TYPES,
    isSafeExternalUrl,
  } from "../lib/curated-link-utils.ts";
  import {
    revalidateCuratedLinkAfterChange,
    revalidateCuratedLinkAfterDelete,
  } from "../lib/payload-revalidation.ts";
  import { isAdmin, publishedOrAdmin } from "./access.ts";

  export const CuratedLinks: CollectionConfig = {
    slug: "curated-links",
    admin: {
      defaultColumns: [
        "title",
        "type",
        "source",
        "status",
        "featured",
        "publishedAt",
        "updatedAt",
      ],
      listSearchableFields: ["title", "url", "source", "summary"],
      useAsTitle: "title",
    },
    access: {
      create: isAdmin,
      read: publishedOrAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
    hooks: {
      afterChange: [revalidateCuratedLinkAfterChange],
      afterDelete: [revalidateCuratedLinkAfterDelete],
    },
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
        index: true,
      },
      {
        name: "slug",
        type: "text",
        required: true,
        unique: true,
        index: true,
      },
      {
        name: "url",
        type: "text",
        required: true,
        validate: (value) =>
          isSafeExternalUrl(value) || "Enter an http or https URL.",
      },
      {
        name: "source",
        type: "text",
      },
      {
        name: "type",
        type: "select",
        required: true,
        defaultValue: "article",
        options: CURATED_LINK_TYPES.map((value) => ({
          label:
            value === "repo"
              ? "Repository"
              : value.charAt(0).toUpperCase() + value.slice(1),
          value,
        })),
      },
      {
        name: "summary",
        type: "textarea",
        required: true,
      },
      {
        name: "note",
        type: "textarea",
      },
      {
        name: "tags",
        type: "relationship",
        relationTo: "tags",
        hasMany: true,
      },
      {
        name: "status",
        type: "select",
        required: true,
        defaultValue: "draft",
        options: [
          { label: "Draft", value: "draft" },
          { label: "Published", value: "published" },
          { label: "Archived", value: "archived" },
        ],
      },
      {
        name: "publishedAt",
        type: "date",
        admin: {
          date: {
            pickerAppearance: "dayAndTime",
          },
        },
      },
      {
        name: "featured",
        type: "checkbox",
        defaultValue: false,
      },
      {
        name: "sortOrder",
        type: "number",
        defaultValue: 100,
      },
      {
        name: "seoTitle",
        type: "text",
      },
      {
        name: "seoDescription",
        type: "textarea",
      },
    ],
  };
  ```

- [ ] **Step 2: Register collection**

  In `payload.config.ts`:

  ```ts
  import { CuratedLinks } from "./collections/CuratedLinks.ts";
  ```

  Add `CuratedLinks` to the `collections` array near other content
  collections:

  ```ts
  collections: [
    Users,
    Media,
    Tags,
    Posts,
    CuratedLinks,
    PostMetrics,
    Projects,
    Comments,
  ],
  ```

### Task 6: Add Payload revalidation hooks

**Files:**

- Modify: `lib/payload-revalidation.ts`

- [ ] **Step 1: Avoid generated-type bootstrapping**

  Do not import `CuratedLink` here before `pnpm generate:types` has run. These
  hooks do not inspect curated link fields, so the generic type can be omitted.

- [ ] **Step 2: Import curated path helper**

  ```ts
  import { getCuratedLinkRevalidationPaths } from "./revalidation";
  ```

- [ ] **Step 3: Add hooks**

  ```ts
  export const revalidateCuratedLinkAfterChange: CollectionAfterChangeHook = ({
    doc,
  }) => {
    runRevalidation(getCuratedLinkRevalidationPaths());

    return doc;
  };

  export const revalidateCuratedLinkAfterDelete: CollectionAfterDeleteHook = () => {
    runRevalidation(getCuratedLinkRevalidationPaths());
  };
  ```

  Keep the hooks simple. There are no public detail pages in this slice, so no
  slug-specific path handling is needed.

## Chunk 4: Data Helpers

### Task 7: Add curated link data helpers

**Files:**

- Create: `lib/curated-links.ts`

- [ ] **Step 1: Add imports**

  ```ts
  import type { CuratedLink } from "../payload-types";
  import type { PaginatedResult } from "./pagination";
  import { getPayloadClient } from "./payload";
  ```

- [ ] **Step 2: Add constants and helper types**

  ```ts
  export const CURATED_LINKS_PER_PAGE = 12;

  type PublishedCuratedLinksPageInput = {
    limit?: number;
    page?: number;
  };
  ```

- [ ] **Step 3: Add list helpers**

  ```ts
  export async function getRecentPublishedCuratedLinks(limit = 3) {
    const payload = await getPayloadClient();

    const result = await payload.find({
      collection: "curated-links",
      depth: 2,
      limit,
      sort: "-publishedAt",
      where: {
        status: {
          equals: "published",
        },
      },
    });

    return result.docs as CuratedLink[];
  }

  export async function getPublishedCuratedLinksPage({
    limit = CURATED_LINKS_PER_PAGE,
    page = 1,
  }: PublishedCuratedLinksPageInput = {}): Promise<PaginatedResult<CuratedLink>> {
    const payload = await getPayloadClient();

    const result = await payload.find({
      collection: "curated-links",
      depth: 2,
      limit,
      page,
      sort: "-publishedAt",
      where: {
        status: {
          equals: "published",
        },
      },
    });

    return {
      ...result,
      docs: result.docs as CuratedLink[],
      nextPage: result.nextPage ?? null,
      page: result.page ?? page,
      prevPage: result.prevPage ?? null,
    };
  }
  ```

### Task 8: Add featured project helper

**Files:**

- Modify: `lib/projects.ts`

- [ ] **Step 1: Add helper**

  ```ts
  export async function getFeaturedProjects(limit = 3) {
    const payload = await getPayloadClient();

    const result = await payload.find({
      collection: "projects",
      depth: 2,
      limit,
      sort: "sortOrder",
      where: {
        and: [
          {
            status: {
              equals: "published",
            },
          },
          {
            featured: {
              equals: true,
            },
          },
        ],
      },
    });

    return sortProjects(result.docs as Project[]).slice(0, limit);
  }
  ```

  Keep `getPublishedProjects()` unchanged for `/projects`.

## Chunk 5: Public UI

### Task 9: Add curated link card

**Files:**

- Create: `components/curated-link-card.tsx`

- [ ] **Step 1: Implement card**

  ```tsx
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
  ```

  If Next lint flags external anchors, keep the plain `<a>`; `Link` is only for
  internal routes.

### Task 10: Add `/feed` route

**Files:**

- Create: `app/(site)/feed/page.tsx`

- [ ] **Step 1: Implement paginated page**

  ```tsx
  import type { Metadata } from "next";
  import { notFound } from "next/navigation";

  import { CuratedLinkCard } from "@/components/curated-link-card";
  import { Pagination } from "@/components/pagination";
  import { SiteHeader } from "@/components/site-header";
  import {
    getPublishedCuratedLinksPage,
  } from "@/lib/curated-links";
  import { isPageOutOfRange, normalizePageParam } from "@/lib/pagination";

  type Args = {
    searchParams: Promise<{
      page?: string | string[];
    }>;
  };

  export const metadata: Metadata = {
    title: "Feed | Personal Engineering Blog",
    description: "Articles, videos, tools, and repositories worth saving.",
  };

  export const revalidate = 3600;

  export default async function FeedPage({ searchParams }: Args) {
    const { page: pageParam } = await searchParams;
    const page = normalizePageParam(pageParam);
    const linksPage = await getPublishedCuratedLinksPage({ page });

    if (isPageOutOfRange(page, linksPage.totalPages, linksPage.totalDocs)) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-4xl font-semibold text-zinc-950 dark:text-zinc-100">
            Feed
          </h1>
          <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Articles, videos, tools, and repositories worth saving.
          </p>
          {linksPage.docs.length > 0 ? (
            <div className="mt-8 bg-white px-6 dark:bg-zinc-900">
              {linksPage.docs.map((item) => (
                <CuratedLinkCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <p className="mt-10 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              No curated links published yet.
            </p>
          )}
          <Pagination
            hasNextPage={linksPage.hasNextPage}
            hasPrevPage={linksPage.hasPrevPage}
            nextPage={linksPage.nextPage}
            page={linksPage.page}
            pathname="/feed"
            prevPage={linksPage.prevPage}
            totalPages={linksPage.totalPages}
          />
        </main>
      </div>
    );
  }
  ```

### Task 11: Update public navigation and sitemap

**Files:**

- Modify: `components/site-header.tsx`
- Modify: `app/(site)/sitemap.ts`

- [ ] **Step 1: Add header link**

  Add `Feed` between `Projects` and `Blog`:

  ```tsx
  <Link className="hover:text-zinc-950 dark:hover:text-zinc-100" href="/feed">
    Feed
  </Link>
  ```

- [ ] **Step 2: Add sitemap route**

  Add:

  ```ts
  {
    url: absoluteUrl("/feed"),
    lastModified: now,
  },
  ```

  Keep sitemap limited to internal routes. Do not add external curated link
  URLs.

### Task 12: Update CMS-driven home page

**Files:**

- Modify: `app/(site)/page.tsx`

- [ ] **Step 1: Add data imports**

  ```tsx
  import { CuratedLinkCard } from "@/components/curated-link-card";
  import { PostCard } from "@/components/post-card";
  import { ProjectCard } from "@/components/project-card";
  import { SiteHeader } from "@/components/site-header";
  import { getRecentPublishedCuratedLinks } from "@/lib/curated-links";
  import { getRecentPublishedPostsForFeed } from "@/lib/posts";
  import { getFeaturedProjects } from "@/lib/projects";
  import {
    getSiteBio,
    getSiteHeadline,
    getSiteName,
    getSiteSettings,
  } from "@/lib/site-settings";
  ```

- [ ] **Step 2: Make page async and fetch data**

  Fetch in parallel:

  ```tsx
  const [settings, posts, projects, curatedLinks] = await Promise.all([
    getSiteSettings(),
    getRecentPublishedPostsForFeed(3),
    getFeaturedProjects(3),
    getRecentPublishedCuratedLinks(3),
  ]);
  ```

- [ ] **Step 3: Render hero from SiteSettings**

  Use existing fallback helpers:

  ```tsx
  const siteName = getSiteName(settings);
  const headline = getSiteHeadline(settings);
  const bio = getSiteBio(settings);
  ```

- [ ] **Step 4: Add sections**

  Add sections for:

  - Recent posts, using `PostCard`.
  - Featured projects, using `ProjectCard`.
  - From the feed, using `CuratedLinkCard`.

  Each section should have a heading, a short link to the full page, an empty
  state, and no nested card layout.

- [ ] **Step 5: Keep styling consistent**

  Reuse existing `bg-zinc-50`, `bg-white`, `dark:bg-zinc-950`,
  `dark:bg-zinc-900`, `text-zinc-*`, and border patterns. Do not redesign the
  whole public site in this slice.

## Chunk 6: Generated Types And Docs

### Task 13: Regenerate Payload artifacts

**Files:**

- Modify: `payload-types.ts`
- Modify only if generated: `app/(payload)/admin/importMap.js`

- [ ] **Step 1: Generate types**

  Run: `pnpm generate:types`

  Expected: command exits 0 and `payload-types.ts` includes `CuratedLink`.

- [ ] **Step 2: Generate import map if Payload asks for it**

  Run only if the build or Payload output indicates the import map is stale:

  `pnpm generate:importmap`

  Expected: command exits 0.

### Task 14: Add README verification notes

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add checklist**

  Add a `Curated feed and home path` checklist near existing manual paths:

  ```md
  Curated feed and home path:

  1. Start MongoDB and `pnpm dev`.
  2. Open `/admin` and create a curated link with `status=draft`.
  3. Verify it does not appear on `/feed` or `/`.
  4. Publish the curated link.
  5. Verify it appears on `/feed`.
  6. Verify recent curated links appear on `/`.
  7. Mark a project as `featured` and verify it appears on `/`.
  8. Open `/sitemap.xml` and verify `/feed` is present.
  9. Toggle dark theme and verify `/` and `/feed` remain readable.
  ```

## Chunk 7: Verification

### Task 15: Run focused automated checks

- [ ] **Step 1: Curated helper tests**

  Run: `node --test lib/curated-link-utils.test.ts`

  Expected: PASS.

- [ ] **Step 2: Revalidation tests**

  Run: `node --test lib/revalidation.test.ts`

  Expected: PASS.

- [ ] **Step 3: Existing helper regression tests**

  Run:

  ```bash
  node --test lib/analytics.test.ts lib/comment-rate-limit.test.ts lib/comment-replies.test.ts lib/comment-validation.test.ts lib/curated-link-utils.test.ts lib/pagination.test.ts lib/post-metrics.test.ts lib/revalidation.test.ts lib/rss.test.ts lib/search.test.ts lib/site-settings.test.ts lib/theme.test.ts
  ```

  Expected: PASS.

### Task 16: Run project checks

- [ ] **Step 1: Lint**

  Run: `pnpm lint`

  Expected: exits 0.

- [ ] **Step 2: Build**

  Run: `pnpm build`

  Expected: exits 0.

- [ ] **Step 3: Diff check**

  Run: `git diff --check`

  Expected: exits 0.

### Task 17: Manual smoke checks

- [ ] **Step 1: Start local app**

  Run: `pnpm dev`

  Expected: Next.js dev server starts.

- [ ] **Step 2: Verify admin creation**

  In `/admin`, create one draft curated link and one published curated link.

  Expected: only the published item is public.

- [ ] **Step 3: Verify public routes**

  Open:

  - `/`
  - `/feed`
  - `/feed?page=999`
  - `/sitemap.xml`

  Expected:

  - `/` shows SiteSettings content, recent posts, featured projects, and latest
    curated links.
  - `/feed` shows the published curated link.
  - `/feed?page=999` returns 404 when the page is out of range.
  - `/sitemap.xml` contains `/feed`.

- [ ] **Step 4: Verify admin isolation**

  Open `/admin`.

  Expected: Payload admin is not wrapped by the public header, feed UI, or home
  layout.

## Completion Criteria

- `CuratedLinks` collection is registered and typed.
- `/feed` exists, paginates published curated links, and hides drafts.
- `/` is CMS-driven and includes recent posts, featured projects, and latest
  curated links.
- Header includes `Feed`.
- Sitemap includes `/feed`.
- Revalidation paths cover `/`, `/feed`, and `/sitemap.xml` for affected
  content changes.
- README manual verification notes are updated.
- Focused tests, lint, build, and `git diff --check` pass.
