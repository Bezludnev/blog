# Blog Post Metrics Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add internal daily post-view metrics that admins can inspect in Payload.

**Architecture:** Record views through a client-side tracker on published post pages and a server route that updates one aggregate `PostMetrics` document per post and UTC date. Keep all counting logic in pure helpers so the storage update path stays small and testable.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PayloadCMS 3.84.x Local API, MongoDB, Tailwind CSS 4, Node test runner, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Metrics design: `docs/superpowers/specs/2026-05-24-blog-post-metrics-design.md`
- Analytics design: `docs/superpowers/specs/2026-05-24-blog-vercel-analytics-design.md`
- Revalidation design: `docs/superpowers/specs/2026-05-24-blog-revalidation-design.md`
- Payload docs checked through Context7: relationship fields use `type: "relationship"` with `relationTo`, collection admin config can define generated admin behavior, and trusted server code can use Local API operations with `overrideAccess`.

## Implementation Rules

- Use @test-driven-development for pure helpers before production changes.
- Use @verification-before-completion before claiming completion.
- Track only published blog posts.
- Store daily aggregate metrics, not individual view events.
- Do not store raw IP addresses or raw user agents.
- Do not change Vercel Analytics, Speed Insights, RSS, sitemap, comments,
  revalidation constants, projects, site settings, or theme styling.
- Do not commit unless the user explicitly asks.

## File Map

Create:

- `lib/post-metrics.ts`: pure date, key, hash, and increment helpers.
- `lib/post-metrics.test.ts`: Node tests for metric helpers.
- `lib/post-metrics-service.ts`: Payload Local API create/update wrapper.
- `collections/PostMetrics.ts`: Payload collection config.
- `components/post-view-tracker.tsx`: client component that sends the view request.
- `app/(site)/api/post-views/route.ts`: public route handler for view tracking.

Modify:

- `payload.config.ts`: register `PostMetrics`.
- `app/(site)/blog/[slug]/page.tsx`: mount `PostViewTracker`.
- `payload-types.ts`: regenerate after schema change.
- `app/(payload)/admin/importMap.js`: regenerate only if Payload updates it.
- `README.md`: document manual metrics verification.

Do not modify:

- `components/vercel-insights.tsx`
- `lib/analytics.ts`
- `lib/revalidation.ts`
- `lib/payload-revalidation.ts`
- `collections/Posts.ts` except if type imports force it, which should not be needed.
- `collections/Comments.ts`
- `app/(site)/rss.xml/route.ts`
- `app/(site)/sitemap.ts`
- Theme-related files.

## Chunk 1: Pure Metrics Helpers

### Task 1: Add failing helper tests

**Files:**

- Create: `lib/post-metrics.test.ts`

- [ ] **Step 1: Write tests**

  ```ts
  import assert from "node:assert/strict";
  import { describe, it } from "node:test";

  import {
    applyPostView,
    getPostMetricKey,
    getUtcDateKey,
    hashMetricVisitor,
  } from "./post-metrics.ts";

  describe("getUtcDateKey", () => {
    it("returns a UTC YYYY-MM-DD key", () => {
      assert.equal(
        getUtcDateKey(new Date("2026-05-24T23:59:59.000Z")),
        "2026-05-24",
      );
    });
  });

  describe("getPostMetricKey", () => {
    it("combines post ID and date key", () => {
      assert.equal(getPostMetricKey("post-1", "2026-05-24"), "post-1:2026-05-24");
    });
  });

  describe("hashMetricVisitor", () => {
    it("returns a stable hash without exposing raw input", () => {
      const first = hashMetricVisitor({
        dateKey: "2026-05-24",
        ip: "203.0.113.10",
        postId: "post-1",
        secret: "secret",
        userAgent: "test-agent",
      });
      const second = hashMetricVisitor({
        dateKey: "2026-05-24",
        ip: "203.0.113.10",
        postId: "post-1",
        secret: "secret",
        userAgent: "test-agent",
      });

      assert.equal(first, second);
      assert.notEqual(first, "203.0.113.10");
      assert.match(first || "", /^[a-f0-9]{64}$/);
    });

    it("returns undefined when no request identity is available", () => {
      assert.equal(
        hashMetricVisitor({
          dateKey: "2026-05-24",
          ip: null,
          postId: "post-1",
          secret: "secret",
          userAgent: null,
        }),
        undefined,
      );
    });
  });

  describe("applyPostView", () => {
    it("increments views and unique views for a new visitor hash", () => {
      assert.deepEqual(
        applyPostView(
          {
            uniqueViewsApprox: 1,
            views: 4,
            visitorHashes: [{ value: "existing" }],
          },
          "new-hash",
        ),
        {
          uniqueViewsApprox: 2,
          views: 5,
          visitorHashes: [{ value: "existing" }, { value: "new-hash" }],
        },
      );
    });

    it("does not increment unique views twice for the same visitor hash", () => {
      assert.deepEqual(
        applyPostView(
          {
            uniqueViewsApprox: 1,
            views: 4,
            visitorHashes: [{ value: "existing" }],
          },
          "existing",
        ),
        {
          uniqueViewsApprox: 1,
          views: 5,
          visitorHashes: [{ value: "existing" }],
        },
      );
    });
  });
  ```

- [ ] **Step 2: Run focused test**

  Run: `node --test lib/post-metrics.test.ts`

  Expected: FAIL because `lib/post-metrics.ts` does not exist.

### Task 2: Implement pure helpers

**Files:**

- Create: `lib/post-metrics.ts`

- [ ] **Step 1: Add helpers**

  ```ts
  import { createHash } from "node:crypto";

  export type VisitorHashRow = {
    value?: null | string;
  };

  export type PostMetricSnapshot = {
    uniqueViewsApprox?: null | number;
    views?: null | number;
    visitorHashes?: null | VisitorHashRow[];
  };

  export function getUtcDateKey(date = new Date()) {
    return date.toISOString().slice(0, 10);
  }

  export function getPostMetricKey(postId: string, dateKey: string) {
    return `${postId}:${dateKey}`;
  }

  export function hashMetricVisitor({
    dateKey,
    ip,
    postId,
    secret,
    userAgent,
  }: {
    dateKey: string;
    ip: null | string;
    postId: string;
    secret: string;
    userAgent: null | string;
  }) {
    if (!ip && !userAgent) return undefined;

    return createHash("sha256")
      .update([secret, postId, dateKey, ip || "", userAgent || ""].join("|"))
      .digest("hex");
  }

  export function applyPostView(
    metric: PostMetricSnapshot,
    visitorHash?: string,
  ) {
    const visitorHashes = metric.visitorHashes || [];
    const hasVisitorHash = Boolean(
      visitorHash &&
        visitorHashes.some((entry) => entry.value === visitorHash),
    );
    const nextVisitorHashes =
      visitorHash && !hasVisitorHash
        ? [...visitorHashes, { value: visitorHash }]
        : visitorHashes;

    return {
      uniqueViewsApprox:
        (metric.uniqueViewsApprox || 0) + (visitorHash && !hasVisitorHash ? 1 : 0),
      views: (metric.views || 0) + 1,
      visitorHashes: nextVisitorHashes,
    };
  }
  ```

- [ ] **Step 2: Verify helper tests pass**

  Run: `node --test lib/post-metrics.test.ts`

  Expected: PASS.

## Chunk 2: Payload Collection

### Task 3: Add `PostMetrics` collection

**Files:**

- Create: `collections/PostMetrics.ts`
- Modify: `payload.config.ts`

- [ ] **Step 1: Add collection config**

  ```ts
  import type { CollectionConfig } from "payload";

  import { isAdmin } from "./access.ts";

  export const PostMetrics: CollectionConfig = {
    slug: "post-metrics",
    admin: {
      defaultColumns: ["post", "date", "views", "uniqueViewsApprox", "lastViewedAt"],
      group: "Analytics",
      useAsTitle: "metricKey",
    },
    access: {
      create: isAdmin,
      read: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
    fields: [
      {
        name: "metricKey",
        type: "text",
        required: true,
        unique: true,
        index: true,
        admin: {
          readOnly: true,
        },
      },
      {
        name: "post",
        type: "relationship",
        relationTo: "posts",
        required: true,
        index: true,
      },
      {
        name: "date",
        type: "text",
        required: true,
        index: true,
        admin: {
          readOnly: true,
        },
      },
      {
        name: "views",
        type: "number",
        required: true,
        defaultValue: 0,
        min: 0,
        admin: {
          readOnly: true,
        },
      },
      {
        name: "uniqueViewsApprox",
        type: "number",
        required: true,
        defaultValue: 0,
        min: 0,
        admin: {
          readOnly: true,
        },
      },
      {
        name: "visitorHashes",
        type: "array",
        admin: {
          hidden: true,
          readOnly: true,
        },
        fields: [
          {
            name: "value",
            type: "text",
            required: true,
          },
        ],
      },
      {
        name: "lastViewedAt",
        type: "date",
        admin: {
          readOnly: true,
        },
      },
    ],
  };
  ```

- [ ] **Step 2: Register collection**

  In `payload.config.ts`, import `PostMetrics` and add it to the
  `collections` array after `Posts`.

- [ ] **Step 3: Generate Payload artifacts**

  Run: `pnpm generate:types`

  Expected: PASS and `payload-types.ts` includes `post-metrics`.

## Chunk 3: Metrics Write Path

### Task 4: Add service wrapper

**Files:**

- Create: `lib/post-metrics-service.ts`

- [ ] **Step 1: Implement record helper**

  Implement `recordPostView({ payload, postId, visitorHash, viewedAt })`.

  Required behavior:

  - Compute `dateKey` with `getUtcDateKey(viewedAt)`.
  - Compute `metricKey` with `getPostMetricKey(postId, dateKey)`.
  - Find an existing `post-metrics` document by `metricKey`.
  - Use `applyPostView` to compute `views`, `uniqueViewsApprox`, and
    `visitorHashes`.
  - Update the existing document when found.
  - Create a new document when missing.
  - Use `overrideAccess: true` for Local API writes.

- [ ] **Step 2: Keep race handling simple**

  If a create fails because another request created the same `metricKey`, retry
  once by finding the existing metric and updating it. Do not add queues,
  locks, or a new dependency.

### Task 5: Add public route

**Files:**

- Create: `app/(site)/api/post-views/route.ts`

- [ ] **Step 1: Implement safe JSON parsing and IP extraction**

  Reuse the simple patterns from `app/(site)/api/comments/route.ts`:

  - `parseRequestJson(request)`
  - `getClientIp(request)`

- [ ] **Step 2: Validate input**

  Accept only:

  ```ts
  {
    postSlug: string;
  }
  ```

  Trim the slug and reject blank values with `400`.

- [ ] **Step 3: Resolve a published post**

  Use Payload Local API to find one `posts` document with matching slug and
  `status = published`, `depth: 0`, and `overrideAccess: true`.

- [ ] **Step 4: Record the view**

  Build `visitorHash` with `hashMetricVisitor`, using:

  - `process.env.PAYLOAD_SECRET || ""`
  - post ID
  - UTC date key
  - client IP
  - user agent

  Then call `recordPostView`.

- [ ] **Step 5: Return concise JSON**

  - Success: `{ "recorded": true }`
  - Invalid input: `400`
  - Missing/unpublished post: `404`
  - Unexpected error: `500`

## Chunk 4: Public Tracker

### Task 6: Add client tracker and mount it

**Files:**

- Create: `components/post-view-tracker.tsx`
- Modify: `app/(site)/blog/[slug]/page.tsx`

- [ ] **Step 1: Add client component**

  ```tsx
  "use client";

  import { useEffect } from "react";

  export function PostViewTracker({ postSlug }: { postSlug: string }) {
    useEffect(() => {
      void fetch("/api/post-views", {
        body: JSON.stringify({ postSlug }),
        headers: {
          "Content-Type": "application/json",
        },
        keepalive: true,
        method: "POST",
      }).catch(() => undefined);
    }, [postSlug]);

    return null;
  }
  ```

- [ ] **Step 2: Mount on post page**

  Import and render `<PostViewTracker postSlug={post.slug} />` in
  `BlogPostPage`. It should render outside visible article content and should
  not affect layout.

## Chunk 5: Docs And Verification

### Task 7: Update README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add manual metrics path**

  Add a short "Post metrics path" checklist near the existing manual checks:

  ```md
  Post metrics path:

  1. Start MongoDB and `pnpm dev`.
  2. Open a published post at `/blog/<slug>`.
  3. Open `/admin` and verify a `PostMetrics` row exists for the post and UTC date.
  4. Refresh the post and verify `views` increments.
  5. Confirm raw IP and raw user-agent values are not stored.
  ```

### Task 8: Run verification

- [ ] **Step 1: Run focused tests**

  Run: `node --test lib/post-metrics.test.ts`

  Expected: PASS.

- [ ] **Step 2: Run related pure helper tests**

  Run:

  ```bash
  node --test lib/post-metrics.test.ts lib/analytics.test.ts lib/revalidation.test.ts lib/rss.test.ts lib/search.test.ts lib/pagination.test.ts lib/comment-validation.test.ts lib/comment-rate-limit.test.ts lib/comment-replies.test.ts lib/site-settings.test.ts
  ```

  Expected: PASS.

- [ ] **Step 3: Regenerate Payload artifacts**

  Run: `pnpm generate:types`

  Expected: PASS.

- [ ] **Step 4: Lint and build**

  Run: `pnpm lint`

  Expected: PASS.

  Run: `pnpm build`

  Expected: PASS.

- [ ] **Step 5: Check diff hygiene**

  Run: `git diff --check`

  Expected: no output and exit code 0.

## Manual Smoke Checklist

- [ ] Published post creates a `PostMetrics` row.
- [ ] Refreshing the same post increments `views`.
- [ ] Same visitor does not repeatedly increment `uniqueViewsApprox` for the
  same post/date.
- [ ] Unknown or unpublished post slugs do not create metrics.
- [ ] Metrics are visible in `/admin` only.
- [ ] Vercel Analytics and Speed Insights behavior is unchanged.
