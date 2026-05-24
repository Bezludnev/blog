# Blog Revalidation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure manual and CMS-triggered revalidation for public Payload-backed pages.

**Architecture:** Use pure helper functions to map content changes to known public paths, then call Next.js `revalidatePath` from a protected route handler and Payload hooks. Convert CMS-backed public routes from forced dynamic rendering to ISR so path revalidation has an observable effect.

**Tech Stack:** Next.js 16 App Router, PayloadCMS 3.84.x hooks, TypeScript, MongoDB, Node test runner, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Revalidation design: `docs/superpowers/specs/2026-05-24-blog-revalidation-design.md`
- Next.js docs checked through Context7: App Router `revalidatePath` in route handlers and `revalidateTag` alternatives.
- Payload docs checked through Context7: collection `afterChange`, collection `afterDelete`, and global `afterChange` hook signatures.

## Implementation Rules

- Use @test-driven-development for pure path mapping and request validation.
- Use @verification-before-completion before claiming completion.
- Do not accept arbitrary paths from the public route.
- Do not add cache tags unless path revalidation becomes insufficient.
- Do not add a new Payload collection.
- Do not change comment moderation, analytics, rate limiting, or UI styling.
- Do not regenerate Payload types; no schema fields are added.
- Do not commit unless the user explicitly asks.

## File Map

Create:

- `lib/revalidation.ts`: pure helpers for secret checks, slug normalization, path deduplication, and known target mapping.
- `lib/revalidation.test.ts`: Node tests for pure revalidation helpers.
- `lib/payload-revalidation.ts`: Payload hook functions that call `revalidatePath`.
- `app/(site)/api/revalidate/route.ts`: protected manual revalidation route.

Modify:

- `collections/Posts.ts`: register post revalidation hooks.
- `collections/Projects.ts`: register project revalidation hooks.
- `collections/Comments.ts`: register comment revalidation hooks.
- `globals/SiteSettings.ts`: register site settings revalidation hook.
- `app/(site)/about/page.tsx`: replace `force-dynamic` with `revalidate = 3600`.
- `app/(site)/contact/page.tsx`: replace `force-dynamic` with `revalidate = 3600`.
- `app/(site)/blog/page.tsx`: replace `force-dynamic` with `revalidate = 3600`.
- `app/(site)/blog/[slug]/page.tsx`: replace `force-dynamic` with `revalidate = 3600`.
- `app/(site)/tags/[slug]/page.tsx`: replace `force-dynamic` with `revalidate = 3600`.
- `app/(site)/projects/page.tsx`: replace `force-dynamic` with `revalidate = 3600`.
- `app/(site)/projects/[slug]/page.tsx`: replace `force-dynamic` with `revalidate = 3600`.
- `app/(site)/rss.xml/route.ts`: replace `force-dynamic` with `revalidate = 3600`.
- `app/(site)/sitemap.ts`: replace `force-dynamic` with `revalidate = 3600`.
- `.env.example`: add `REVALIDATION_SECRET`.
- `README.md`: document setup and manual verification.

Do not modify:

- `payload.config.ts`
- `payload-types.ts`
- `app/(payload)/**`
- `app/(site)/api/comments/route.ts`
- `components/comment-form.tsx`
- `components/comments-section.tsx`

## Chunk 1: Pure Revalidation Helpers

### Task 1: Write failing helper tests

**Files:**

- Create: `lib/revalidation.test.ts`

- [ ] **Step 1: Add tests**
  Add:

  ```ts
  import assert from "node:assert/strict";
  import { describe, it } from "node:test";

  import {
    getAllRevalidationPaths,
    getCommentRevalidationPaths,
    getPostRevalidationPaths,
    getProjectRevalidationPaths,
    getRevalidationPathsForTarget,
    getSiteRevalidationPaths,
    isRevalidationSecretValid,
    normalizeSlug,
  } from "./revalidation.ts";

  describe("isRevalidationSecretValid", () => {
    it("requires a configured expected secret", () => {
      assert.equal(isRevalidationSecretValid("secret", undefined), false);
    });

    it("accepts an exact secret match", () => {
      assert.equal(isRevalidationSecretValid("secret", "secret"), true);
    });

    it("rejects missing or different input", () => {
      assert.equal(isRevalidationSecretValid(undefined, "secret"), false);
      assert.equal(isRevalidationSecretValid("other", "secret"), false);
    });
  });

  describe("normalizeSlug", () => {
    it("trims slashes and whitespace", () => {
      assert.equal(normalizeSlug(" /hello-world/ "), "hello-world");
    });

    it("rejects empty slugs", () => {
      assert.equal(normalizeSlug(" / "), undefined);
    });
  });

  describe("known path mapping", () => {
    it("returns site paths", () => {
      assert.deepEqual(getSiteRevalidationPaths(), [
        "/",
        "/about",
        "/contact",
        "/sitemap.xml",
      ]);
    });

    it("returns aggregate and detail post paths", () => {
      assert.deepEqual(
        getPostRevalidationPaths({
          previousSlug: "old-post",
          previousTagSlugs: ["payload"],
          slug: "new-post",
          tagSlugs: ["nextjs", "payload"],
        }),
        [
          "/blog",
          "/rss.xml",
          "/sitemap.xml",
          "/blog/new-post",
          "/blog/old-post",
          "/tags/nextjs",
          "/tags/payload",
        ],
      );
    });

    it("returns aggregate and detail project paths", () => {
      assert.deepEqual(
        getProjectRevalidationPaths({
          previousSlug: "old-project",
          slug: "new-project",
        }),
        [
          "/projects",
          "/sitemap.xml",
          "/projects/new-project",
          "/projects/old-project",
        ],
      );
    });

    it("returns a post path for comment changes", () => {
      assert.deepEqual(getCommentRevalidationPaths("hello-world"), [
        "/blog/hello-world",
      ]);
    });

    it("deduplicates all-content paths", () => {
      assert.deepEqual(getAllRevalidationPaths(), [
        "/",
        "/about",
        "/contact",
        "/sitemap.xml",
        "/blog",
        "/rss.xml",
        "/projects",
      ]);
    });
  });

  describe("getRevalidationPathsForTarget", () => {
    it("maps known route targets", () => {
      assert.deepEqual(getRevalidationPathsForTarget({ target: "posts" }), [
        "/blog",
        "/rss.xml",
        "/sitemap.xml",
      ]);
    });

    it("maps a post target with optional slugs", () => {
      assert.deepEqual(
        getRevalidationPathsForTarget({
          previousSlug: "old-post",
          slug: "new-post",
          tagSlugs: ["payload"],
          target: "post",
        }),
        [
          "/blog",
          "/rss.xml",
          "/sitemap.xml",
          "/blog/new-post",
          "/blog/old-post",
          "/tags/payload",
        ],
      );
    });

    it("returns null for unknown targets", () => {
      assert.equal(getRevalidationPathsForTarget({ target: "unknown" }), null);
    });
  });
  ```

- [ ] **Step 2: Run and confirm the test fails**
  Run:

  ```bash
  node --test lib/revalidation.test.ts
  ```

  Expected: FAIL because `lib/revalidation.ts` does not exist yet.

### Task 2: Implement pure helpers

**Files:**

- Create: `lib/revalidation.ts`

- [ ] **Step 1: Add implementation**
  Add:

  ```ts
  export const CMS_REVALIDATE_SECONDS = 3600;

  type RevalidationTargetInput = {
    previousSlug?: unknown;
    previousTagSlugs?: unknown;
    slug?: unknown;
    tagSlugs?: unknown;
    target?: unknown;
  };

  type PostPathInput = {
    previousSlug?: string;
    previousTagSlugs?: string[];
    slug?: string;
    tagSlugs?: string[];
  };

  type ProjectPathInput = {
    previousSlug?: string;
    slug?: string;
  };

  function asString(value: unknown) {
    return typeof value === "string" ? value : undefined;
  }

  function asStringArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  }

  export function normalizeSlug(value: unknown) {
    const slug = asString(value)?.trim().replace(/^\/+|\/+$/g, "");

    return slug || undefined;
  }

  function uniquePaths(paths: Array<string | undefined>) {
    return Array.from(new Set(paths.filter((path): path is string => Boolean(path))));
  }

  function tagPaths(slugs: string[]) {
    return slugs
      .map((slug) => normalizeSlug(slug))
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => `/tags/${slug}`);
  }

  export function isRevalidationSecretValid(
    value: string | undefined,
    expected: string | undefined,
  ) {
    return Boolean(expected) && value === expected;
  }

  export function getSiteRevalidationPaths() {
    return ["/", "/about", "/contact", "/sitemap.xml"];
  }

  export function getPostRevalidationPaths(input: PostPathInput = {}) {
    const slug = normalizeSlug(input.slug);
    const previousSlug = normalizeSlug(input.previousSlug);
    const tags = [...(input.tagSlugs || []), ...(input.previousTagSlugs || [])];

    return uniquePaths([
      "/blog",
      "/rss.xml",
      "/sitemap.xml",
      slug ? `/blog/${slug}` : undefined,
      previousSlug ? `/blog/${previousSlug}` : undefined,
      ...tagPaths(tags),
    ]);
  }

  export function getProjectRevalidationPaths(input: ProjectPathInput = {}) {
    const slug = normalizeSlug(input.slug);
    const previousSlug = normalizeSlug(input.previousSlug);

    return uniquePaths([
      "/projects",
      "/sitemap.xml",
      slug ? `/projects/${slug}` : undefined,
      previousSlug ? `/projects/${previousSlug}` : undefined,
    ]);
  }

  export function getCommentRevalidationPaths(postSlug: unknown) {
    const slug = normalizeSlug(postSlug);

    return uniquePaths([slug ? `/blog/${slug}` : undefined]);
  }

  export function getAllRevalidationPaths() {
    return uniquePaths([
      ...getSiteRevalidationPaths(),
      ...getPostRevalidationPaths(),
      ...getProjectRevalidationPaths(),
    ]);
  }

  export function getRevalidationPathsForTarget(input: RevalidationTargetInput) {
    switch (input.target) {
      case "all":
        return getAllRevalidationPaths();
      case "site":
        return getSiteRevalidationPaths();
      case "posts":
        return getPostRevalidationPaths();
      case "projects":
        return getProjectRevalidationPaths();
      case "post":
        return getPostRevalidationPaths({
          previousSlug: normalizeSlug(input.previousSlug),
          previousTagSlugs: asStringArray(input.previousTagSlugs),
          slug: normalizeSlug(input.slug),
          tagSlugs: asStringArray(input.tagSlugs),
        });
      case "project":
        return getProjectRevalidationPaths({
          previousSlug: normalizeSlug(input.previousSlug),
          slug: normalizeSlug(input.slug),
        });
      default:
        return null;
    }
  }
  ```

- [ ] **Step 2: Run helper tests**
  Run:

  ```bash
  node --test lib/revalidation.test.ts
  ```

  Expected: PASS.

## Chunk 2: Manual Revalidation Route

### Task 3: Add protected route handler

**Files:**

- Create: `app/(site)/api/revalidate/route.ts`

- [ ] **Step 1: Add route**
  Add:

  ```ts
  import { revalidatePath } from "next/cache";
  import { NextResponse } from "next/server";

  import {
    getRevalidationPathsForTarget,
    isRevalidationSecretValid,
  } from "@/lib/revalidation";

  async function parseRequestJson(request: Request) {
    try {
      const body = await request.json();

      if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return null;
      }

      return body as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  export async function POST(request: Request) {
    const body = await parseRequestJson(request);

    if (!body) {
      return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }

    if (!process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { message: "Revalidation is not configured." },
        { status: 500 },
      );
    }

    if (
      !isRevalidationSecretValid(
        typeof body.secret === "string" ? body.secret : undefined,
        process.env.REVALIDATION_SECRET,
      )
    ) {
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const paths = getRevalidationPathsForTarget(body);

    if (!paths) {
      return NextResponse.json(
        { message: "Unknown revalidation target." },
        { status: 400 },
      );
    }

    for (const path of paths) {
      revalidatePath(path);
    }

    return NextResponse.json({ paths, revalidated: true });
  }
  ```

- [ ] **Step 2: Confirm there is no GET route**
  Do not export `GET`.

### Task 4: Run focused checks

- [ ] **Step 1: Run revalidation helper tests**
  Run:

  ```bash
  node --test lib/revalidation.test.ts
  ```

  Expected: PASS.

- [ ] **Step 2: Run lint**
  Run:

  ```bash
  pnpm lint
  ```

  Expected: PASS or only unrelated pre-existing failures. If failures occur, inspect before changing unrelated files.

## Chunk 3: Payload Hook Functions

### Task 5: Add hook side-effect module

**Files:**

- Create: `lib/payload-revalidation.ts`

- [ ] **Step 1: Add hook functions**
  Add:

  ```ts
  import { revalidatePath } from "next/cache";
  import type {
    CollectionAfterChangeHook,
    CollectionAfterDeleteHook,
    GlobalAfterChangeHook,
    PayloadRequest,
  } from "payload";

  import type { Comment, Post, Project, SiteSetting, Tag } from "@/payload-types";

  import {
    getCommentRevalidationPaths,
    getPostRevalidationPaths,
    getProjectRevalidationPaths,
    getSiteRevalidationPaths,
  } from "./revalidation";

  function runRevalidation(paths: string[]) {
    try {
      for (const path of paths) {
        revalidatePath(path);
      }
    } catch (error) {
      console.error("Could not revalidate paths", error);
    }
  }

  function getPublishedSlug(doc?: Pick<Post | Project, "slug" | "status"> | null) {
    return doc?.status === "published" ? doc.slug : undefined;
  }

  function getTagSlugs(tags: Post["tags"] | undefined) {
    return (tags || []).flatMap((tag) => {
      if (typeof tag === "object" && tag !== null) {
        return [(tag as Tag).slug];
      }

      return [];
    });
  }

  function getRelationshipId(value: unknown) {
    if (typeof value === "string") return value;

    if (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      typeof value.id === "string"
    ) {
      return value.id;
    }

    return undefined;
  }

  async function getPublishedPostSlugForComment(
    doc: Comment,
    req: PayloadRequest,
  ) {
    const postId = getRelationshipId(doc.post);

    if (!postId) return undefined;

    try {
      const post = await req.payload.findByID({
        collection: "posts",
        depth: 0,
        id: postId,
        overrideAccess: true,
      });

      return post.status === "published" ? post.slug : undefined;
    } catch (error) {
      console.error("Could not resolve comment post for revalidation", error);
      return undefined;
    }
  }

  export const revalidatePostAfterChange: CollectionAfterChangeHook<Post> = ({
    doc,
    previousDoc,
  }) => {
    runRevalidation(
      getPostRevalidationPaths({
        previousSlug: getPublishedSlug(previousDoc),
        previousTagSlugs: getTagSlugs(previousDoc?.tags),
        slug: getPublishedSlug(doc),
        tagSlugs: getTagSlugs(doc.tags),
      }),
    );

    return doc;
  };

  export const revalidatePostAfterDelete: CollectionAfterDeleteHook<Post> = ({
    doc,
  }) => {
    runRevalidation(
      getPostRevalidationPaths({
        previousSlug: getPublishedSlug(doc),
        previousTagSlugs: getTagSlugs(doc.tags),
      }),
    );
  };

  export const revalidateProjectAfterChange: CollectionAfterChangeHook<Project> = ({
    doc,
    previousDoc,
  }) => {
    runRevalidation(
      getProjectRevalidationPaths({
        previousSlug: getPublishedSlug(previousDoc),
        slug: getPublishedSlug(doc),
      }),
    );

    return doc;
  };

  export const revalidateProjectAfterDelete: CollectionAfterDeleteHook<Project> = ({
    doc,
  }) => {
    runRevalidation(
      getProjectRevalidationPaths({
        previousSlug: getPublishedSlug(doc),
      }),
    );
  };

  export const revalidateCommentAfterChange: CollectionAfterChangeHook<Comment> =
    async ({ doc, req }) => {
      runRevalidation(
        getCommentRevalidationPaths(
          await getPublishedPostSlugForComment(doc, req),
        ),
      );

      return doc;
    };

  export const revalidateCommentAfterDelete: CollectionAfterDeleteHook<Comment> =
    async ({ doc, req }) => {
      runRevalidation(
        getCommentRevalidationPaths(
          await getPublishedPostSlugForComment(doc, req),
        ),
      );
    };

  export const revalidateSiteSettingsAfterChange: GlobalAfterChangeHook<
    SiteSetting
  > = ({ doc }) => {
    runRevalidation(getSiteRevalidationPaths());

    return doc;
  };
  ```

- [ ] **Step 2: Run lint**
  Run:

  ```bash
  pnpm lint
  ```

  Expected: PASS. If the hook type for `GlobalAfterChangeHook<SiteSetting>` does not match, inspect Payload generated type naming before changing behavior.

### Task 6: Register hooks in Payload config files

**Files:**

- Modify: `collections/Posts.ts`
- Modify: `collections/Projects.ts`
- Modify: `collections/Comments.ts`
- Modify: `globals/SiteSettings.ts`

- [ ] **Step 1: Register post hooks**
  In `collections/Posts.ts`, import:

  ```ts
  import {
    revalidatePostAfterChange,
    revalidatePostAfterDelete,
  } from "../lib/payload-revalidation.ts";
  ```

  Add near access/admin:

  ```ts
  hooks: {
    afterChange: [revalidatePostAfterChange],
    afterDelete: [revalidatePostAfterDelete],
  },
  ```

- [ ] **Step 2: Register project hooks**
  In `collections/Projects.ts`, import:

  ```ts
  import {
    revalidateProjectAfterChange,
    revalidateProjectAfterDelete,
  } from "../lib/payload-revalidation.ts";
  ```

  Add:

  ```ts
  hooks: {
    afterChange: [revalidateProjectAfterChange],
    afterDelete: [revalidateProjectAfterDelete],
  },
  ```

- [ ] **Step 3: Register comment hooks**
  In `collections/Comments.ts`, import:

  ```ts
  import {
    revalidateCommentAfterChange,
    revalidateCommentAfterDelete,
  } from "../lib/payload-revalidation.ts";
  ```

  Add:

  ```ts
  hooks: {
    afterChange: [revalidateCommentAfterChange],
    afterDelete: [revalidateCommentAfterDelete],
  },
  ```

- [ ] **Step 4: Register site settings hook**
  In `globals/SiteSettings.ts`, import:

  ```ts
  import { revalidateSiteSettingsAfterChange } from "../lib/payload-revalidation.ts";
  ```

  Add:

  ```ts
  hooks: {
    afterChange: [revalidateSiteSettingsAfterChange],
  },
  ```

## Chunk 4: Route Cache Mode

### Task 7: Convert CMS-backed public routes to ISR

**Files:**

- Modify all CMS-backed routes listed in the File Map.

- [ ] **Step 1: Replace forced dynamic rendering**
  In each listed route, replace:

  ```ts
  export const dynamic = "force-dynamic";
  ```

  with:

  ```ts
  export const revalidate = 3600;
  ```

- [ ] **Step 2: Leave APIs and admin untouched**
  Confirm these files are not changed:

  - `app/(site)/api/comments/route.ts`
  - `app/(site)/api/revalidate/route.ts`
  - `app/(payload)/**`

- [ ] **Step 3: Search for remaining forced dynamic routes**
  Run:

  ```bash
  rg -n 'dynamic = "force-dynamic"' app/'(site)'
  ```

  Expected: no CMS-backed public pages remain. If a public API route appears, leave it dynamic.

## Chunk 5: Environment And README

### Task 8: Add env example

**Files:**

- Modify: `.env.example`

- [ ] **Step 1: Add secret placeholder**
  Add:

  ```dotenv
  REVALIDATION_SECRET=replace-with-a-long-random-secret
  ```

  Keep it near the other server-side secrets.

### Task 9: Update README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Document environment variable**
  Add to "Environment Variables":

  ```md
  - `REVALIDATION_SECRET`: long random secret for protected manual
    revalidation. Configure it in Vercel preview/production if using
    `/api/revalidate`.
  ```

- [ ] **Step 2: Add manual revalidation path**
  Add a verification section:

  ```md
  Revalidation path:

  1. Set `REVALIDATION_SECRET` locally and start MongoDB plus `pnpm dev`.
  2. Edit or publish a post in `/admin`.
  3. Verify `/blog`, `/blog/<slug>`, `/rss.xml`, and `/sitemap.xml` update
     after the next request.
  4. Approve a pending comment and verify `/blog/<slug>` updates.
  5. POST to `/api/revalidate` with an invalid secret and confirm `401`.
  6. POST to `/api/revalidate` with `{ "secret": "...", "target": "posts" }`
     and confirm the response contains known paths.
  ```

## Chunk 6: Verification

### Task 10: Run the verification suite

- [ ] **Step 1: Run focused revalidation tests**
  Run:

  ```bash
  node --test lib/revalidation.test.ts
  ```

  Expected: PASS.

- [ ] **Step 2: Run existing unit tests**
  Run:

  ```bash
  node --test lib/analytics.test.ts lib/comment-rate-limit.test.ts lib/comment-validation.test.ts lib/rss.test.ts lib/search.test.ts lib/site-settings.test.ts
  ```

  Expected: PASS.

- [ ] **Step 3: Run lint**
  Run:

  ```bash
  pnpm lint
  ```

  Expected: PASS.

- [ ] **Step 4: Run build**
  Run:

  ```bash
  pnpm build
  ```

  Expected: PASS.

- [ ] **Step 5: Check whitespace**
  Run:

  ```bash
  git diff --check
  ```

  Expected: no output and exit code 0.

- [ ] **Step 6: Optional live smoke**
  With MongoDB and `pnpm dev` running:

  1. Call `POST /api/revalidate` with a bad secret and confirm `401`.
  2. Call `POST /api/revalidate` with target `posts` and confirm `200`.
  3. Publish or edit a post and confirm the public post/list/feed/sitemap paths update.
  4. Approve a comment and confirm the public post path updates.

## Acceptance Criteria

1. `.env.example` and README document `REVALIDATION_SECRET`.
2. `lib/revalidation.test.ts` covers secret validation, slug normalization, deduplication, and known target mapping.
3. `POST /api/revalidate` requires the secret and accepts only known targets.
4. Posts, projects, comments, and site settings register Payload revalidation hooks.
5. CMS-backed public routes use `export const revalidate = 3600` instead of `force-dynamic`.
6. No arbitrary-path route, GET secret route, cache-tag convention, new collection, generated type change, dashboard, analytics, or UI redesign is added.
7. `node --test lib/revalidation.test.ts`, the existing helper tests, `pnpm lint`, `pnpm build`, and `git diff --check` pass.
