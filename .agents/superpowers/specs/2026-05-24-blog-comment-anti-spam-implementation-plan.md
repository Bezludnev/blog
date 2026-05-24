# Blog Comment Anti-Spam Rate Limiting Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable, serverless-safe rate limiting to public comment submission.

**Architecture:** Reuse the existing Payload `comments` collection as the rate-limit ledger. Add pure helper functions for env parsing, threshold checks, time windows, and Payload `where` query construction, then call `payload.count` in `POST /api/comments` before creating a pending comment.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PayloadCMS 3.84.x Local API, MongoDB, Node test runner, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Rate-limit design: `docs/superpowers/specs/2026-05-24-blog-comment-anti-spam-design.md`
- Existing comments design: `docs/superpowers/specs/2026-05-23-blog-comments-design.md`
- Payload docs checked through Context7 for Local API `payload.count({ collection, where })` and `greater_than_equal` query operator.

## Implementation Rules

- Use @test-driven-development for pure rate-limit behavior.
- Use @verification-before-completion before claiming completion.
- Do not add Redis, KV, CAPTCHA, cookies, plaintext IP storage, or a new collection.
- Do not change comment moderation statuses.
- Do not change public approved-comment rendering.
- Do not instrument Payload admin routes.
- Do not regenerate Payload types; this slice has no schema change.
- Do not commit unless the user explicitly asks.

## File Map

Create:

- `lib/comment-rate-limit.ts`: pure rate-limit config, threshold, window, and Payload `where` helper logic.
- `lib/comment-rate-limit.test.ts`: Node tests for the pure helper behavior.

Modify:

- `app/(site)/api/comments/route.ts`: compute hashes once, count matching recent comments, and return `429` before `payload.create`.
- `.env.example`: add comment rate-limit defaults.
- `README.md`: document variables and manual verification.

Do not modify:

- `collections/Comments.ts`
- `payload.config.ts`
- `payload-types.ts`
- `components/comment-form.tsx`
- `components/comments-section.tsx`

## Chunk 1: Pure Rate-Limit Helpers

### Task 1: Write the failing helper tests

**Files:**

- Create: `lib/comment-rate-limit.test.ts`

- [ ] **Step 1: Create tests**
  Add:

  ```ts
  import assert from "node:assert/strict";
  import { describe, it } from "node:test";

  import {
    DEFAULT_COMMENT_RATE_LIMIT_MAX,
    DEFAULT_COMMENT_RATE_LIMIT_WINDOW_SECONDS,
    buildCommentRateLimitWhere,
    getCommentRateLimitConfig,
    getCommentRateLimitWindowStart,
    isCommentRateLimitExceeded,
  } from "./comment-rate-limit.ts";

  describe("getCommentRateLimitConfig", () => {
    it("uses defaults when env values are missing", () => {
      assert.deepEqual(getCommentRateLimitConfig({}), {
        max: DEFAULT_COMMENT_RATE_LIMIT_MAX,
        windowSeconds: DEFAULT_COMMENT_RATE_LIMIT_WINDOW_SECONDS,
      });
    });

    it("parses positive integer env values", () => {
      assert.deepEqual(
        getCommentRateLimitConfig({
          COMMENT_RATE_LIMIT_MAX: "2",
          COMMENT_RATE_LIMIT_WINDOW_SECONDS: "60",
        }),
        {
          max: 2,
          windowSeconds: 60,
        },
      );
    });

    it("falls back for invalid env values", () => {
      assert.deepEqual(
        getCommentRateLimitConfig({
          COMMENT_RATE_LIMIT_MAX: "0",
          COMMENT_RATE_LIMIT_WINDOW_SECONDS: "nope",
        }),
        {
          max: DEFAULT_COMMENT_RATE_LIMIT_MAX,
          windowSeconds: DEFAULT_COMMENT_RATE_LIMIT_WINDOW_SECONDS,
        },
      );
    });
  });

  describe("getCommentRateLimitWindowStart", () => {
    it("subtracts the configured number of seconds", () => {
      const now = new Date("2026-05-24T12:00:00.000Z");

      assert.equal(
        getCommentRateLimitWindowStart(now, 300).toISOString(),
        "2026-05-24T11:55:00.000Z",
      );
    });
  });

  describe("isCommentRateLimitExceeded", () => {
    it("allows counts below max", () => {
      assert.equal(isCommentRateLimitExceeded(4, 5), false);
    });

    it("blocks counts equal to max", () => {
      assert.equal(isCommentRateLimitExceeded(5, 5), true);
    });
  });

  describe("buildCommentRateLimitWhere", () => {
    it("builds a query with both request hashes", () => {
      assert.deepEqual(
        buildCommentRateLimitWhere({
          ipHash: "ip-hash",
          postId: "post-id",
          userAgentHash: "ua-hash",
          windowStart: new Date("2026-05-24T12:00:00.000Z"),
        }),
        {
          and: [
            { post: { equals: "post-id" } },
            {
              createdAt: {
                greater_than_equal: "2026-05-24T12:00:00.000Z",
              },
            },
            { ipHash: { equals: "ip-hash" } },
            { userAgentHash: { equals: "ua-hash" } },
          ],
        },
      );
    });

    it("builds a query with one available request hash", () => {
      assert.deepEqual(
        buildCommentRateLimitWhere({
          ipHash: "ip-hash",
          postId: "post-id",
          userAgentHash: undefined,
          windowStart: new Date("2026-05-24T12:00:00.000Z"),
        }),
        {
          and: [
            { post: { equals: "post-id" } },
            {
              createdAt: {
                greater_than_equal: "2026-05-24T12:00:00.000Z",
              },
            },
            { ipHash: { equals: "ip-hash" } },
          ],
        },
      );
    });

    it("returns null when no request identity is available", () => {
      assert.equal(
        buildCommentRateLimitWhere({
          ipHash: undefined,
          postId: "post-id",
          userAgentHash: undefined,
          windowStart: new Date("2026-05-24T12:00:00.000Z"),
        }),
        null,
      );
    });
  });
  ```

- [ ] **Step 2: Run the test and verify it fails**
  Run:

  ```bash
  node --test lib/comment-rate-limit.test.ts
  ```

  Expected: FAIL because `lib/comment-rate-limit.ts` does not exist yet.

### Task 2: Implement the helper module

**Files:**

- Create: `lib/comment-rate-limit.ts`

- [ ] **Step 1: Add the minimal implementation**
  Add:

  ```ts
  import type { Where } from "payload";

  export const DEFAULT_COMMENT_RATE_LIMIT_WINDOW_SECONDS = 300;
  export const DEFAULT_COMMENT_RATE_LIMIT_MAX = 5;

  type CommentRateLimitEnv = {
    COMMENT_RATE_LIMIT_MAX?: string;
    COMMENT_RATE_LIMIT_WINDOW_SECONDS?: string;
  };

  type CommentRateLimitWhereInput = {
    ipHash?: string;
    postId: string;
    userAgentHash?: string;
    windowStart: Date;
  };

  function parsePositiveInteger(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value ?? "", 10);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  export function getCommentRateLimitConfig(env: CommentRateLimitEnv = process.env) {
    return {
      max: parsePositiveInteger(
        env.COMMENT_RATE_LIMIT_MAX,
        DEFAULT_COMMENT_RATE_LIMIT_MAX,
      ),
      windowSeconds: parsePositiveInteger(
        env.COMMENT_RATE_LIMIT_WINDOW_SECONDS,
        DEFAULT_COMMENT_RATE_LIMIT_WINDOW_SECONDS,
      ),
    };
  }

  export function getCommentRateLimitWindowStart(now: Date, windowSeconds: number) {
    return new Date(now.getTime() - windowSeconds * 1000);
  }

  export function isCommentRateLimitExceeded(count: number, max: number) {
    return count >= max;
  }

  export function buildCommentRateLimitWhere({
    ipHash,
    postId,
    userAgentHash,
    windowStart,
  }: CommentRateLimitWhereInput): Where | null {
    const identityFilters: Where[] = [];

    if (ipHash) {
      identityFilters.push({ ipHash: { equals: ipHash } });
    }

    if (userAgentHash) {
      identityFilters.push({ userAgentHash: { equals: userAgentHash } });
    }

    if (identityFilters.length === 0) {
      return null;
    }

    return {
      and: [
        { post: { equals: postId } },
        { createdAt: { greater_than_equal: windowStart.toISOString() } },
        ...identityFilters,
      ],
    };
  }
  ```

- [ ] **Step 2: Run the helper tests**
  Run:

  ```bash
  node --test lib/comment-rate-limit.test.ts
  ```

  Expected: PASS.

## Chunk 2: API Route Integration

### Task 3: Add rate-limit counting to `/api/comments`

**Files:**

- Modify: `app/(site)/api/comments/route.ts`

- [ ] **Step 1: Import helpers**
  Add imports:

  ```ts
  import {
    buildCommentRateLimitWhere,
    getCommentRateLimitConfig,
    getCommentRateLimitWindowStart,
    isCommentRateLimitExceeded,
  } from "@/lib/comment-rate-limit";
  ```

- [ ] **Step 2: Compute request hashes once**
  After resolving the published post, assign:

  ```ts
  const ipHash = hashValue(getClientIp(request));
  const userAgentHash = hashValue(request.headers.get("user-agent"));
  ```

- [ ] **Step 3: Count recent matching comments**
  Before `payload.create`, add:

  ```ts
  const rateLimitConfig = getCommentRateLimitConfig();
  const rateLimitWhere = buildCommentRateLimitWhere({
    ipHash,
    postId: post.id,
    userAgentHash,
    windowStart: getCommentRateLimitWindowStart(
      new Date(),
      rateLimitConfig.windowSeconds,
    ),
  });

  if (rateLimitWhere) {
    const { totalDocs } = await payload.count({
      collection: "comments",
      overrideAccess: true,
      where: rateLimitWhere,
    });

    if (isCommentRateLimitExceeded(totalDocs, rateLimitConfig.max)) {
      return NextResponse.json(
        { message: "Too many comments. Try again later." },
        { status: 429 },
      );
    }
  }
  ```

- [ ] **Step 4: Reuse hashes during comment creation**
  Change `payload.create` data to use the precomputed values:

  ```ts
  ipHash,
  userAgentHash,
  ```

  Do not call `hashValue(getClientIp(request))` or `hashValue(request.headers.get("user-agent"))` a second time.

- [ ] **Step 5: Preserve existing behavior**
  Confirm these are unchanged:

  - malformed JSON returns `400`
  - validation errors return `400`
  - honeypot-filled requests return generic success before post lookup and counting
  - unknown/draft posts return `404`
  - unexpected failures return generic `500`

### Task 4: Run focused tests after route integration

- [ ] **Step 1: Run helper and validation tests**
  Run:

  ```bash
  node --test lib/comment-rate-limit.test.ts lib/comment-validation.test.ts
  ```

  Expected: PASS.

- [ ] **Step 2: Run lint**
  Run:

  ```bash
  pnpm lint
  ```

  Expected: PASS.

## Chunk 3: Environment And Docs

### Task 5: Add env defaults

**Files:**

- Modify: `.env.example`

- [ ] **Step 1: Add comment rate-limit env vars**
  Add:

  ```dotenv
  COMMENT_RATE_LIMIT_WINDOW_SECONDS=300
  COMMENT_RATE_LIMIT_MAX=5
  ```

### Task 6: Document the comment anti-spam path

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add env variable descriptions**
  In "Environment Variables", add:

  ```md
  - `COMMENT_RATE_LIMIT_WINDOW_SECONDS`: non-secret comment rate-limit window
    in seconds. Defaults to `300` when missing or invalid.
  - `COMMENT_RATE_LIMIT_MAX`: non-secret maximum accepted comments per post and
    request identity within the rate-limit window. Defaults to `5` when missing
    or invalid.
  ```

- [ ] **Step 2: Extend manual comment verification**
  Add rate-limit checks to "Comment moderation path":

  ```md
  6. Temporarily set `COMMENT_RATE_LIMIT_MAX=1`.
  7. Submit a second comment for the same post from the same browser and verify
     the API returns `429`.
  8. Confirm only the first accepted comment appears in `/admin`.
  ```

## Chunk 4: Full Verification

### Task 7: Verify the slice

- [ ] **Step 1: Run unit tests**
  Run:

  ```bash
  node --test lib/comment-rate-limit.test.ts lib/comment-validation.test.ts
  ```

  Expected: PASS.

- [ ] **Step 2: Run lint**
  Run:

  ```bash
  pnpm lint
  ```

  Expected: PASS.

- [ ] **Step 3: Run production build**
  Run:

  ```bash
  pnpm build
  ```

  Expected: PASS.

- [ ] **Step 4: Check whitespace**
  Run:

  ```bash
  git diff --check
  ```

  Expected: no output and exit code 0.

- [ ] **Step 5: Optional live smoke**
  With MongoDB and `pnpm dev` running:

  1. Set `COMMENT_RATE_LIMIT_MAX=1`.
  2. Submit a valid comment under `/blog/<slug>`.
  3. Submit a second valid comment under the same post from the same browser.
  4. Confirm the second response is `429`.
  5. Confirm only one new pending comment exists in `/admin`.

## Acceptance Criteria

1. `COMMENT_RATE_LIMIT_WINDOW_SECONDS` and `COMMENT_RATE_LIMIT_MAX` are documented in `.env.example` and `README.md`.
2. `lib/comment-rate-limit.test.ts` covers defaults, custom env values, invalid env fallback, window calculation, threshold checks, and query construction.
3. `/api/comments` calls `payload.count` before `payload.create` for valid non-honeypot requests with a request identity.
4. Rate-limited requests return `429` with `"Too many comments. Try again later."`.
5. Existing honeypot, validation, post lookup, and moderation behavior is preserved.
6. No new collection, Redis/KV dependency, CAPTCHA, cookie tracking, plaintext IP storage, dashboard, or generated Payload type change is introduced.
7. `node --test lib/comment-rate-limit.test.ts lib/comment-validation.test.ts`, `pnpm lint`, `pnpm build`, and `git diff --check` pass.
