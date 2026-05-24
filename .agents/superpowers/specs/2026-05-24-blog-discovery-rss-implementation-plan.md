# Blog Discovery And RSS Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add blog search, tag archive pages, and an RSS feed for published posts.

**Architecture:** Keep the feature server-side and native to the existing Payload model. Next.js pages and route handlers call focused helpers in `lib/posts.ts`; pure helpers handle search normalization and RSS XML generation so formatting behavior can be tested without MongoDB. No new collection, external search service, analytics, or public search API route is added.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PayloadCMS 3.84.x, MongoDB, Tailwind CSS 4, Node test runner, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Design: `docs/superpowers/specs/2026-05-24-blog-discovery-rss-design.md`
- Foundation design: `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`

## Implementation Rules

- Use @test-driven-development for pure helpers before production code.
- Use @verification-before-completion before claiming this slice is done.
- Keep all public queries scoped to `status = published`.
- Do not add Algolia, Meilisearch, MongoDB indexes, or any external search service.
- Do not add a public search API route.
- Do not add analytics, post metrics, dark theme, or anti-spam changes.
- Do not change Payload collections unless the existing schema cannot support the required query.
- Do not regenerate Payload types unless Payload config or collection fields change.
- Do not commit unrelated worktree changes.

## File Map

Create:

- `lib/search.ts`: normalize `/blog?q=` values and match posts against title, excerpt, and rich-text content.
- `lib/search.test.ts`: test search query normalization and rich-text content matching.
- `lib/rss.ts`: escape XML and build RSS feed XML from plain feed items.
- `lib/rss.test.ts`: test XML escaping and feed output.
- `app/(site)/tags/[slug]/page.tsx`: public tag archive page.
- `app/(site)/rss.xml/route.ts`: RSS feed route handler.

Modify:

- `lib/posts.ts`: add published post query helpers for search, tags, and RSS.
- `components/post-card.tsx`: link post tags to `/tags/[slug]`.
- `app/(site)/blog/page.tsx`: read `searchParams.q`, render GET search form, and show filtered results.
- `app/(site)/blog/[slug]/page.tsx`: link rendered post tags to tag archive pages if tags are displayed there.
- `README.md`: add manual verification steps for search, tags, and RSS.

## Chunk 1: Search Query Normalization

### Task 1: Add search normalization and matching helper

**Files:**

- Create: `lib/search.test.ts`
- Create: `lib/search.ts`

- [ ] **Step 1: Write the failing test**
  ```ts
  import assert from "node:assert/strict";
  import { describe, it } from "node:test";

  import { normalizeSearchQuery, postMatchesSearch } from "./search.ts";

  describe("normalizeSearchQuery", () => {
    it("trims whitespace", () => {
      assert.equal(normalizeSearchQuery("  payload cms  "), "payload cms");
    });

    it("returns empty string for missing values", () => {
      assert.equal(normalizeSearchQuery(undefined), "");
      assert.equal(normalizeSearchQuery([]), "");
    });

    it("uses the first query value when Next passes an array", () => {
      assert.equal(normalizeSearchQuery(["first", "second"]), "first");
    });
  });

  describe("postMatchesSearch", () => {
    it("matches title, excerpt, and Lexical content text", () => {
      const post = {
        title: "Payload setup",
        excerpt: "CMS notes",
        content: {
          root: {
            children: [
              {
                children: [{ text: "MongoDB adapter" }],
              },
            ],
          },
        },
      };

      assert.equal(postMatchesSearch(post, "payload"), true);
      assert.equal(postMatchesSearch(post, "notes"), true);
      assert.equal(postMatchesSearch(post, "adapter"), true);
      assert.equal(postMatchesSearch(post, "missing"), false);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test lib/search.test.ts`
  Expected: FAIL because `lib/search.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**
  ```ts
  type SearchablePost = {
    title?: null | string;
    excerpt?: null | string;
    content?: unknown;
  };

  export function normalizeSearchQuery(
    value: string | string[] | undefined,
  ): string {
    const raw = Array.isArray(value) ? value[0] : value;

    return (raw || "").trim();
  }

  export function extractLexicalText(value: unknown): string {
    if (!value || typeof value !== "object") {
      return "";
    }

    if (Array.isArray(value)) {
      return value.map(extractLexicalText).join(" ");
    }

    const record = value as Record<string, unknown>;
    const ownText = typeof record.text === "string" ? record.text : "";
    const childText = extractLexicalText(record.children);
    const rootText = extractLexicalText(record.root);

    return [ownText, childText, rootText].filter(Boolean).join(" ");
  }

  export function postMatchesSearch(post: SearchablePost, query: string) {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      post.title || "",
      post.excerpt || "",
      extractLexicalText(post.content),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --test lib/search.test.ts`
  Expected: PASS.

## Chunk 2: RSS XML Builder

### Task 2: Add pure RSS builder

**Files:**

- Create: `lib/rss.test.ts`
- Create: `lib/rss.ts`

- [ ] **Step 1: Write the failing test**
  ```ts
  import assert from "node:assert/strict";
  import { describe, it } from "node:test";

  import { buildRssFeed, escapeXml } from "./rss.ts";

  describe("escapeXml", () => {
    it("escapes XML special characters", () => {
      assert.equal(
        escapeXml(`A & B < C > "D" 'E'`),
        "A &amp; B &lt; C &gt; &quot;D&quot; &apos;E&apos;",
      );
    });
  });

  describe("buildRssFeed", () => {
    it("renders escaped feed and item XML", () => {
      const xml = buildRssFeed({
        title: "Personal Engineering Blog & Notes",
        description: "Published notes",
        siteUrl: "https://example.com",
        feedUrl: "https://example.com/rss.xml",
        items: [
          {
            title: "Payload & Next",
            url: "https://example.com/blog/payload",
            guid: "https://example.com/blog/payload",
            description: "CMS <notes>",
            publishedAt: "2026-05-24T10:00:00.000Z",
          },
        ],
      });

      assert.match(xml, /<rss version="2.0" xmlns:atom="http:\/\/www.w3.org\/2005\/Atom">/);
      assert.match(xml, /Personal Engineering Blog &amp; Notes/);
      assert.match(xml, /<language>en<\/language>/);
      assert.match(xml, /Payload &amp; Next/);
      assert.match(xml, /CMS &lt;notes&gt;/);
      assert.match(xml, /Sun, 24 May 2026 10:00:00 GMT/);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test lib/rss.test.ts`
  Expected: FAIL because `lib/rss.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**
  Create `lib/rss.ts` with:
  - `RssFeedItem` and `RssFeedInput` types;
  - `escapeXml(value: string)`;
  - `buildRssFeed(input: RssFeedInput)`;
  - `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">`;
  - escaped title, link, guid, description, `atom:link`, `<language>en</language>`, and valid optional `pubDate`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --test lib/rss.test.ts`
  Expected: PASS.

## Chunk 3: Payload Query Helpers

### Task 3: Extend post query helpers

**Files:**

- Modify: `lib/posts.ts`

- [ ] **Step 1: Inspect generated types**
  Run: `rg -n "export interface Post|export interface Tag|tags\\?:" payload-types.ts`
  Confirm the `Post.tags` and `Tag` shapes.

- [ ] **Step 2: Add search-aware published posts helper**
  Update `getPublishedPosts(query = "")`:
  - always require `status = published`;
  - sort by `-publishedAt`;
  - when query is non-empty, filter the returned published posts with `postMatchesSearch(post, query)`;
  - match `title`, `excerpt`, and text extracted from Lexical rich-text `content`;
  - keep this TypeScript filtering approach for MVP instead of relying on fragile MongoDB field paths for rich-text content.

- [ ] **Step 3: Add tag lookup helper**
  Add `getTagBySlug(slug: string)` that queries `collection: "tags"`, `limit: 1`, `slug equals slug`, and returns `Tag | undefined`.

- [ ] **Step 4: Add posts-by-tag helper**
  Add `getPublishedPostsByTagId(tagId: number | string)` that queries published posts whose `tags` relationship contains the tag id.
  If Payload requires a different operator for relationship arrays, use the repo-compatible operator after checking generated types or official docs.

- [ ] **Step 5: Add RSS helper**
  Add `getRecentPublishedPostsForFeed(limit = 20)`:
  - `collection: "posts"`;
  - `depth: 0`;
  - `status = published`;
  - `sort: "-publishedAt"`;
  - bounded `limit`.

- [ ] **Step 6: Run feedback**
  Run: `pnpm lint`
  Expected: no lint or type errors from helper changes.

## Chunk 4: Blog Search UI

### Task 4: Update `/blog` for GET search

**Files:**

- Modify: `app/(site)/blog/page.tsx`

- [ ] **Step 1: Update page props**
  Add `searchParams: Promise<{ q?: string | string[] }>` to the page props.

- [ ] **Step 2: Normalize query and fetch filtered posts**
  Await `searchParams`, pass `q` through `normalizeSearchQuery`, then call `getPublishedPosts(query)`.

- [ ] **Step 3: Add GET search form**
  Render a GET form targeting `/blog` with a `type="search"` input named `q` and a submit button. Keep styling consistent with the existing simple Tailwind UI.

- [ ] **Step 4: Add reset link when searching**
  If `query` is non-empty, render a `/blog` link to clear search.

- [ ] **Step 5: Update empty state**
  Use separate copy for no published posts and no search matches.

- [ ] **Step 6: Run feedback**
  Run: `pnpm lint`
  Expected: no errors.

## Chunk 5: Tag Links And Tag Archive Page

### Task 5: Link tags from post surfaces

**Files:**

- Modify: `components/post-card.tsx`
- Modify: `app/(site)/blog/[slug]/page.tsx`

- [ ] **Step 1: Inspect current tag rendering**
  Run:
  ```bash
  sed -n '1,240p' components/post-card.tsx
  sed -n '1,260p' app/'(site)'/blog/'[slug]'/page.tsx
  ```

- [ ] **Step 2: Add safe tag links**
  Where tag relationship values are objects with string `slug` and `name`, render `Link` to `/tags/${tag.slug}`. Leave id-only relationship values unlinked.

- [ ] **Step 3: Preserve styling**
  Keep existing visual classes and spacing. Do not redesign cards or post detail layout.

### Task 6: Add `/tags/[slug]` page

**Files:**

- Create: `app/(site)/tags/[slug]/page.tsx`

- [ ] **Step 1: Create route directory**
  Run: `mkdir -p app/'(site)'/tags/'[slug]'`

- [ ] **Step 2: Add page implementation**
  Implement `dynamic = "force-dynamic"`, `generateMetadata`, and the default page. Use `getTagBySlug`, `getPublishedPostsByTagId`, `notFound()`, `SiteHeader`, and `PostCard`.

- [ ] **Step 3: Add metadata fallback**
  Title: `${tag.name} | Personal Engineering Blog`.
  Description: tag description or `Published posts tagged ${tag.name}.`

- [ ] **Step 4: Run feedback**
  Run: `pnpm lint`
  Expected: no errors.

## Chunk 6: RSS Route

### Task 7: Add RSS route handler

**Files:**

- Create: `app/(site)/rss.xml/route.ts`
- Modify: `app/(site)/blog/page.tsx`

- [ ] **Step 1: Create route directory**
  Run: `mkdir -p app/'(site)'/rss.xml`

- [ ] **Step 2: Add route handler**
  Query `getRecentPublishedPostsForFeed(20)`, map posts to RSS items with absolute `/blog/${post.slug}` URLs, and return `new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } })`.

- [ ] **Step 3: Add RSS discovery metadata**
  In `/blog`, add:
  ```ts
  alternates: {
    types: {
      "application/rss+xml": "/rss.xml",
    },
  },
  ```
  Skip this only if current Next metadata typing rejects it.

- [ ] **Step 4: Run feedback**
  Run:
  ```bash
  node --test lib/rss.test.ts
  pnpm lint
  ```
  Expected: both pass.

## Chunk 7: Documentation And Verification

### Task 8: Update README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add manual verification notes**
  Document:
  - create published and draft posts;
  - verify `/blog?q=...`;
  - verify `/tags/<slug>`;
  - verify `/rss.xml`;
  - confirm draft posts are absent from all three surfaces.

- [ ] **Step 2: Keep docs scoped**
  Do not rewrite unrelated setup sections.

### Task 9: Final verification

- [ ] **Step 1: Run helper tests**
  Run: `node --test lib/search.test.ts lib/rss.test.ts`
  Expected: PASS.

- [ ] **Step 2: Run project checks**
  Run:
  ```bash
  pnpm lint
  pnpm build
  git diff --check
  ```
  Expected: all pass.

- [ ] **Step 3: Live smoke checks**
  With MongoDB and Next.js running:
  - `GET /blog` returns 200.
  - `GET /blog?q=<published-term>` returns 200 and filters posts.
  - `GET /tags/<existing-slug>` returns 200.
  - `GET /tags/<missing-slug>` returns 404.
  - `GET /rss.xml` returns RSS XML with `application/rss+xml`.

## Acceptance Criteria

1. `/blog?q=term` filters published posts through server-side search across title, excerpt, and rich-text content.
2. `/tags/[slug]` exists and lists only published posts for an existing tag.
3. Unknown tag slugs return 404.
4. Tags rendered on public post surfaces link to `/tags/[slug]`.
5. `/rss.xml` returns escaped RSS XML for published posts only.
6. Draft and archived posts do not appear in search, tag pages, or RSS.
7. No new search service, API route, collection, analytics, or dashboard is added.
8. `node --test lib/search.test.ts lib/rss.test.ts`, `pnpm lint`, `pnpm build`, and `git diff --check` pass.
