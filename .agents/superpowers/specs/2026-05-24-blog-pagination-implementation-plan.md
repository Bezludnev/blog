# Blog Pagination Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add URL-based server-side pagination to `/blog` and `/tags/[slug]`.

**Architecture:** Put page parsing, in-memory slicing, out-of-range checks, and URL construction in pure helpers. Keep Payload-backed list queries server-side: use Payload Local API pagination for normal blog and tag lists, and apply in-memory pagination after the existing TypeScript search filter for `/blog?q=...` so result counts stay correct. Render one small shared pagination component with Previous/Next links.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PayloadCMS 3.84.x Local API, MongoDB, Tailwind CSS 4, Node test runner, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Pagination design: `docs/superpowers/specs/2026-05-24-blog-pagination-design.md`
- Discovery/RSS design: `docs/superpowers/specs/2026-05-24-blog-discovery-rss-design.md`
- Next.js docs checked through Context7: App Router page `searchParams` is a Promise and supports filtering/pagination query params.
- Payload docs checked through Context7: Local API `payload.find()` supports `limit`, `page`, and returns `docs`, `totalDocs`, `totalPages`, `page`, `hasPrevPage`, `hasNextPage`, `prevPage`, and `nextPage`.

## Implementation Rules

- Use @test-driven-development for pure pagination helpers before production code.
- Use @verification-before-completion before claiming completion.
- Keep public post lists scoped to `status = published`.
- Preserve the existing search behavior for `/blog?q=...`.
- Do not add MongoDB indexes, external search services, API routes, infinite scroll, or client-side pagination state.
- Do not change Payload collection schemas or regenerate Payload types.
- Do not change RSS, sitemap, comments, analytics, revalidation, admin routes, or theme styling.
- Do not commit unless the user explicitly asks.

## File Map

Create:

- `lib/pagination.ts`: pure pagination constants, page parsing, array slicing, out-of-range checks, and href construction.
- `lib/pagination.test.ts`: Node tests for pagination helper behavior.
- `components/pagination.tsx`: shared Previous/Next pagination navigation component.

Modify:

- `lib/posts.ts`: add paginated published-post helpers while preserving existing all-post helpers for sitemap/RSS callers.
- `app/(site)/blog/page.tsx`: read `page`, call paginated helper, render pagination links, preserve `q`.
- `app/(site)/tags/[slug]/page.tsx`: read `page`, call paginated tag helper, render pagination links.
- `README.md`: add manual verification notes for blog and tag pagination.

Do not modify:

- `payload.config.ts`
- `payload-types.ts`
- `collections/**`
- `globals/**`
- `app/(payload)/**`
- `app/(site)/api/**`
- `app/(site)/rss.xml/route.ts`
- `app/(site)/sitemap.ts`
- `components/comment-form.tsx`
- `components/comments-section.tsx`

## Chunk 1: Pure Pagination Helpers

### Task 1: Write failing pagination tests

**Files:**

- Create: `lib/pagination.test.ts`

- [ ] **Step 1: Add tests**

  ```ts
  import assert from "node:assert/strict";
  import { describe, it } from "node:test";

  import {
    BLOG_POSTS_PER_PAGE,
    buildPaginationHref,
    isPageOutOfRange,
    normalizePageParam,
    paginateItems,
  } from "./pagination.ts";

  describe("normalizePageParam", () => {
    it("defaults missing or invalid values to page 1", () => {
      assert.equal(normalizePageParam(undefined), 1);
      assert.equal(normalizePageParam(""), 1);
      assert.equal(normalizePageParam("0"), 1);
      assert.equal(normalizePageParam("-2"), 1);
      assert.equal(normalizePageParam("abc"), 1);
      assert.equal(normalizePageParam("1.5"), 1);
    });

    it("accepts positive integer strings and uses the first array value", () => {
      assert.equal(normalizePageParam("2"), 2);
      assert.equal(normalizePageParam(["3", "4"]), 3);
    });
  });

  describe("paginateItems", () => {
    it("returns a Payload-like first page", () => {
      const result = paginateItems(["a", "b", "c"], 1, 2);

      assert.deepEqual(result.docs, ["a", "b"]);
      assert.equal(result.totalDocs, 3);
      assert.equal(result.limit, 2);
      assert.equal(result.totalPages, 2);
      assert.equal(result.page, 1);
      assert.equal(result.hasPrevPage, false);
      assert.equal(result.hasNextPage, true);
      assert.equal(result.prevPage, null);
      assert.equal(result.nextPage, 2);
    });

    it("returns later pages", () => {
      const result = paginateItems(["a", "b", "c"], 2, 2);

      assert.deepEqual(result.docs, ["c"]);
      assert.equal(result.hasPrevPage, true);
      assert.equal(result.hasNextPage, false);
      assert.equal(result.prevPage, 1);
      assert.equal(result.nextPage, null);
    });

    it("uses the blog page size constant", () => {
      assert.equal(BLOG_POSTS_PER_PAGE, 10);
    });
  });

  describe("isPageOutOfRange", () => {
    it("allows empty first pages", () => {
      assert.equal(isPageOutOfRange(1, 0, 0), false);
    });

    it("rejects empty later pages and pages beyond the total", () => {
      assert.equal(isPageOutOfRange(2, 0, 0), true);
      assert.equal(isPageOutOfRange(3, 2, 11), true);
    });
  });

  describe("buildPaginationHref", () => {
    it("omits page 1 and blank query values", () => {
      assert.equal(
        buildPaginationHref({ page: 1, pathname: "/blog", query: "" }),
        "/blog",
      );
    });

    it("preserves search query and page values", () => {
      assert.equal(
        buildPaginationHref({
          page: 2,
          pathname: "/blog",
          query: "payload cms",
        }),
        "/blog?q=payload+cms&page=2",
      );
    });

    it("builds tag pagination URLs", () => {
      assert.equal(
        buildPaginationHref({ page: 3, pathname: "/tags/payload" }),
        "/tags/payload?page=3",
      );
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test lib/pagination.test.ts`

  Expected: FAIL because `lib/pagination.ts` does not exist.

### Task 2: Implement pagination helpers

**Files:**

- Create: `lib/pagination.ts`

- [ ] **Step 1: Add minimal helper implementation**

  ```ts
  export const BLOG_POSTS_PER_PAGE = 10;

  export type PaginatedResult<T> = {
    docs: T[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: null | number;
    nextPage: null | number;
  };

  type PaginationHrefInput = {
    page: number;
    pathname: string;
    query?: string;
  };

  export function normalizePageParam(value: string | string[] | undefined) {
    const raw = Array.isArray(value) ? value[0] : value;

    if (!raw || !/^[1-9]\d*$/.test(raw)) {
      return 1;
    }

    return Number(raw);
  }

  export function paginateItems<T>(
    items: T[],
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    const totalDocs = items.length;
    const totalPages = Math.ceil(totalDocs / limit);
    const start = (page - 1) * limit;
    const docs = items.slice(start, start + limit);

    return {
      docs,
      totalDocs,
      limit,
      totalPages,
      page,
      pagingCounter: totalDocs === 0 ? 0 : start + 1,
      hasPrevPage: page > 1 && totalDocs > 0,
      hasNextPage: page < totalPages,
      prevPage: page > 1 && totalDocs > 0 ? page - 1 : null,
      nextPage: page < totalPages ? page + 1 : null,
    };
  }

  export function isPageOutOfRange(
    page: number,
    totalPages: number,
    totalDocs: number,
  ) {
    if (page <= 1) {
      return false;
    }

    if (totalDocs === 0) {
      return true;
    }

    return page > totalPages;
  }

  export function buildPaginationHref({
    page,
    pathname,
    query,
  }: PaginationHrefInput) {
    const params = new URLSearchParams();

    if (query?.trim()) {
      params.set("q", query.trim());
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const queryString = params.toString();

    return queryString ? `${pathname}?${queryString}` : pathname;
  }
  ```

- [ ] **Step 2: Run helper test**

  Run: `node --test lib/pagination.test.ts`

  Expected: PASS.

## Chunk 2: Paginated Post Queries

### Task 3: Add paginated post helpers

**Files:**

- Modify: `lib/posts.ts`

- [ ] **Step 1: Inspect current callers**

  Run: `rg -n "getPublishedPosts\\(|getPublishedPostsByTagId\\(" app lib components`

  Expected:

  - `getPublishedPosts()` is still needed by `app/(site)/sitemap.ts`.
  - `/blog` should move to a new paginated helper.
  - `/tags/[slug]` should move to a new paginated tag helper.

- [ ] **Step 2: Add imports and types**

  Update imports in `lib/posts.ts`:

  ```ts
  import {
    BLOG_POSTS_PER_PAGE,
    type PaginatedResult,
    paginateItems,
  } from "./pagination";
  ```

  Add input types:

  ```ts
  type PublishedPostsPageInput = {
    limit?: number;
    page?: number;
    query?: string;
  };

  type PublishedPostsByTagPageInput = {
    limit?: number;
    page?: number;
    tagId: string;
  };
  ```

- [ ] **Step 3: Add `getPublishedPostsPage`**

  Add a new helper without removing `getPublishedPosts()`:

  ```ts
  export async function getPublishedPostsPage({
    limit = BLOG_POSTS_PER_PAGE,
    page = 1,
    query = "",
  }: PublishedPostsPageInput = {}): Promise<PaginatedResult<Post>> {
    const payload = await getPayloadClient();
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      const result = await payload.find({
        collection: "posts",
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
        docs: result.docs as Post[],
      };
    }

    const result = await payload.find({
      collection: "posts",
      depth: 2,
      pagination: false,
      sort: "-publishedAt",
      where: {
        status: {
          equals: "published",
        },
      },
    });

    const matches = (result.docs as Post[]).filter((post) =>
      postMatchesSearch(post, normalizedQuery),
    );

    return paginateItems(matches, page, limit);
  }
  ```

  Rationale: this keeps search totals correct. Do not paginate in Payload before
  applying the TypeScript search filter.

- [ ] **Step 4: Add `getPublishedPostsByTagIdPage`**

  Add:

  ```ts
  export async function getPublishedPostsByTagIdPage({
    limit = BLOG_POSTS_PER_PAGE,
    page = 1,
    tagId,
  }: PublishedPostsByTagPageInput): Promise<PaginatedResult<Post>> {
    const payload = await getPayloadClient();

    const result = await payload.find({
      collection: "posts",
      depth: 2,
      limit,
      page,
      sort: "-publishedAt",
      where: {
        and: [
          {
            status: {
              equals: "published",
            },
          },
          {
            tags: {
              equals: tagId,
            },
          },
        ],
      },
    });

    return {
      ...result,
      docs: result.docs as Post[],
    };
  }
  ```

  Keep the existing `getPublishedPostsByTagId(tagId)` helper unless all current
  callers are migrated and no non-paginated tag caller remains.

- [ ] **Step 5: Run helper tests**

  Run: `node --test lib/pagination.test.ts lib/search.test.ts`

  Expected: PASS.

## Chunk 3: Shared Pagination Component

### Task 4: Add Previous/Next component

**Files:**

- Create: `components/pagination.tsx`

- [ ] **Step 1: Implement the component**

  ```tsx
  import Link from "next/link";

  import { buildPaginationHref } from "@/lib/pagination";

  type PaginationProps = {
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: null | number;
    page: number;
    pathname: string;
    prevPage: null | number;
    query?: string;
    totalPages: number;
  };

  export function Pagination({
    hasNextPage,
    hasPrevPage,
    nextPage,
    page,
    pathname,
    prevPage,
    query,
    totalPages,
  }: PaginationProps) {
    if (totalPages <= 1) {
      return null;
    }

    return (
      <nav
        aria-label="Pagination"
        className="mt-8 flex items-center justify-between gap-4 text-sm"
      >
        {hasPrevPage && prevPage ? (
          <Link
            className="border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950"
            href={buildPaginationHref({ page: prevPage, pathname, query })}
          >
            Previous
          </Link>
        ) : (
          <span aria-hidden="true" className="px-4 py-2 text-zinc-400">
            Previous
          </span>
        )}
        <span className="text-zinc-600">
          Page {page} of {totalPages}
        </span>
        {hasNextPage && nextPage ? (
          <Link
            className="border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950"
            href={buildPaginationHref({ page: nextPage, pathname, query })}
          >
            Next
          </Link>
        ) : (
          <span aria-hidden="true" className="px-4 py-2 text-zinc-400">
            Next
          </span>
        )}
      </nav>
    );
  }
  ```

  Match the current site's simple Tailwind style. Do not add a UI library or icon
  dependency in this slice.

- [ ] **Step 2: Run lint after adding JSX**

  Run: `pnpm lint`

  Expected: PASS.

## Chunk 4: Blog Page Integration

### Task 5: Paginate `/blog`

**Files:**

- Modify: `app/(site)/blog/page.tsx`

- [ ] **Step 1: Update imports**

  Add:

  ```ts
  import { notFound } from "next/navigation";

  import { Pagination } from "@/components/pagination";
  import { isPageOutOfRange, normalizePageParam } from "@/lib/pagination";
  ```

  Replace `getPublishedPosts` import with `getPublishedPostsPage`.

- [ ] **Step 2: Add `page` to search params type**

  ```ts
  type Args = {
    searchParams: Promise<{
      page?: string | string[];
      q?: string | string[];
    }>;
  };
  ```

- [ ] **Step 3: Read query and page**

  Replace current post loading with:

  ```ts
  const { page: pageParam, q } = await searchParams;
  const query = normalizeSearchQuery(q);
  const page = normalizePageParam(pageParam);
  const postsPage = await getPublishedPostsPage({ page, query });

  if (
    isPageOutOfRange(page, postsPage.totalPages, postsPage.totalDocs)
  ) {
    notFound();
  }
  ```

- [ ] **Step 4: Render paginated docs**

  Replace `posts` with `postsPage.docs` in the list and empty-state checks.

  Add after the list/empty state:

  ```tsx
  <Pagination
    hasNextPage={postsPage.hasNextPage}
    hasPrevPage={postsPage.hasPrevPage}
    nextPage={postsPage.nextPage}
    page={postsPage.page}
    pathname="/blog"
    prevPage={postsPage.prevPage}
    query={query}
    totalPages={postsPage.totalPages}
  />
  ```

  This will render `null` for empty or one-page result sets.

- [ ] **Step 5: Run targeted checks**

  Run: `node --test lib/pagination.test.ts lib/search.test.ts`

  Expected: PASS.

  Run: `pnpm lint`

  Expected: PASS.

## Chunk 5: Tag Page Integration

### Task 6: Paginate `/tags/[slug]`

**Files:**

- Modify: `app/(site)/tags/[slug]/page.tsx`

- [ ] **Step 1: Update imports**

  Add:

  ```ts
  import { Pagination } from "@/components/pagination";
  import { isPageOutOfRange, normalizePageParam } from "@/lib/pagination";
  ```

  Replace `getPublishedPostsByTagId` import with
  `getPublishedPostsByTagIdPage`.

- [ ] **Step 2: Add `searchParams` to page args**

  ```ts
  type Args = {
    params: Promise<{
      slug: string;
    }>;
    searchParams: Promise<{
      page?: string | string[];
    }>;
  };
  ```

  `generateMetadata` can keep using `params`; it does not need page-specific
  metadata in this slice.

- [ ] **Step 3: Read page and fetch paginated tag posts**

  In the default page component:

  ```ts
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = normalizePageParam(pageParam);
  const tag = await getTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const postsPage = await getPublishedPostsByTagIdPage({
    page,
    tagId: tag.id,
  });

  if (
    isPageOutOfRange(page, postsPage.totalPages, postsPage.totalDocs)
  ) {
    notFound();
  }
  ```

- [ ] **Step 4: Render paginated docs and navigation**

  Replace `posts` with `postsPage.docs`.

  Add after the list/empty state:

  ```tsx
  <Pagination
    hasNextPage={postsPage.hasNextPage}
    hasPrevPage={postsPage.hasPrevPage}
    nextPage={postsPage.nextPage}
    page={postsPage.page}
    pathname={`/tags/${tag.slug}`}
    prevPage={postsPage.prevPage}
    totalPages={postsPage.totalPages}
  />
  ```

- [ ] **Step 5: Run targeted checks**

  Run: `node --test lib/pagination.test.ts lib/search.test.ts`

  Expected: PASS.

  Run: `pnpm lint`

  Expected: PASS.

## Chunk 6: README And Final Verification

### Task 7: Document manual pagination checks

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add pagination checks under "Blog discovery path"**

  Add:

  ```md
  6. Create more than 10 published posts and verify `/blog?page=2` shows the
     next page.
  7. Verify `/blog?q=<term>&page=2` keeps the search term in pagination links
     when the search has more than 10 matches.
  8. Verify `/tags/<slug>?page=2` works for a tag with more than 10 published
     posts.
  9. Open `/blog?page=999` and `/tags/<slug>?page=999` and verify they return
     404.
  ```

  Adjust numbering around existing RSS checks as needed. Do not rewrite unrelated
  README sections.

- [ ] **Step 2: Run full helper tests**

  Run:

  ```bash
  node --test lib/pagination.test.ts lib/search.test.ts lib/rss.test.ts lib/revalidation.test.ts lib/analytics.test.ts lib/comment-rate-limit.test.ts lib/comment-validation.test.ts lib/site-settings.test.ts
  ```

  Expected: PASS.

- [ ] **Step 3: Run lint**

  Run: `pnpm lint`

  Expected: PASS.

- [ ] **Step 4: Run build**

  Run: `pnpm build`

  Expected: PASS.

- [ ] **Step 5: Check diff hygiene**

  Run: `git diff --check`

  Expected: no output and exit code 0.

## Acceptance Checklist

- [ ] `/blog` reads `page` from `searchParams`.
- [ ] `/blog?q=<term>` paginates after the existing TypeScript search filter.
- [ ] `/tags/[slug]` reads `page` from `searchParams`.
- [ ] Invalid page values normalize to `1`.
- [ ] Out-of-range positive pages call `notFound()`.
- [ ] Pagination links preserve `q` on `/blog`.
- [ ] Pagination links omit `page=1`.
- [ ] Public list helpers keep `status = published`.
- [ ] Existing all-post helpers remain available for sitemap/RSS callers.
- [ ] No Payload schema, generated type, admin, comment, analytics, revalidation, theme, or RSS behavior is changed.
- [ ] Required verification commands pass.
