# Blog Vercel Analytics And Speed Insights Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Vercel Web Analytics and Speed Insights to the public site with an explicit environment flag.

**Architecture:** Install Vercel's official Next.js packages and mount their App Router components through one small wrapper component. Keep enablement controlled by a pure helper so the flag behavior can be tested without rendering Next.js. Do not add custom analytics storage, `PostMetrics`, cookies, or admin dashboards in this slice.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vercel Web Analytics, Vercel Speed Insights, Node test runner, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Design: `docs/superpowers/specs/2026-05-24-blog-vercel-analytics-design.md`
- Vercel docs checked through Context7:
  - Web Analytics App Router component: `Analytics` from `@vercel/analytics/next`
  - Speed Insights App Router component: `SpeedInsights` from `@vercel/speed-insights/next`

## Implementation Rules

- Use @test-driven-development for the analytics enablement helper.
- Use @verification-before-completion before claiming this slice is done.
- Keep `ANALYTICS_ENABLED=false` as the local default.
- Do not instrument Payload admin separately.
- Do not add custom counters, cookies, IP/user-agent tracking, API routes, `PostMetrics`, or admin dashboards.
- Do not change Payload collections or regenerate Payload types.
- Do not commit unrelated worktree changes.

## File Map

Create:

- `lib/analytics.ts`: pure helper for deciding whether Vercel analytics components should render.
- `lib/analytics.test.ts`: tests analytics flag parsing.
- `components/vercel-insights.tsx`: server component wrapper for Vercel `Analytics` and `SpeedInsights`.

Modify:

- `package.json`: add `@vercel/analytics` and `@vercel/speed-insights`.
- `pnpm-lock.yaml`: update dependency lockfile.
- `app/(site)/layout.tsx`: mount `VercelInsights` at the end of public site body.
- `.env.example`: add `ANALYTICS_ENABLED=false`.
- `README.md`: document local default, Vercel setup, and verification.

## Chunk 1: Analytics Enablement Helper

### Task 1: Add tested flag parser

**Files:**

- Create: `lib/analytics.test.ts`
- Create: `lib/analytics.ts`

- [ ] **Step 1: Write the failing test**
  ```ts
  import assert from "node:assert/strict";
  import { describe, it } from "node:test";

  import { isAnalyticsEnabled } from "./analytics.ts";

  describe("isAnalyticsEnabled", () => {
    it("enables analytics only for the exact true string", () => {
      assert.equal(isAnalyticsEnabled("true"), true);
      assert.equal(isAnalyticsEnabled("false"), false);
      assert.equal(isAnalyticsEnabled("TRUE"), false);
      assert.equal(isAnalyticsEnabled(undefined), false);
      assert.equal(isAnalyticsEnabled(""), false);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `node --test lib/analytics.test.ts`
  Expected: FAIL because `lib/analytics.ts` does not exist.

- [ ] **Step 3: Write minimal implementation**
  ```ts
  export function isAnalyticsEnabled(value: string | undefined) {
    return value === "true";
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --test lib/analytics.test.ts`
  Expected: PASS.

## Chunk 2: Dependencies

### Task 2: Install Vercel packages

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install packages**
  Run:
  ```bash
  pnpm add @vercel/analytics @vercel/speed-insights
  ```

- [ ] **Step 2: Confirm dependencies**
  Run:
  ```bash
  rg -n '"@vercel/analytics"|"@vercel/speed-insights"' package.json pnpm-lock.yaml
  ```
  Expected: both packages are present in `dependencies` and lockfile.

## Chunk 3: Vercel Insights Wrapper

### Task 3: Add wrapper component

**Files:**

- Create: `components/vercel-insights.tsx`

- [ ] **Step 1: Add component**
  ```tsx
  import { Analytics } from "@vercel/analytics/next";
  import { SpeedInsights } from "@vercel/speed-insights/next";

  import { isAnalyticsEnabled } from "@/lib/analytics";

  export function VercelInsights() {
    if (!isAnalyticsEnabled(process.env.ANALYTICS_ENABLED)) {
      return null;
    }

    return (
      <>
        <Analytics />
        <SpeedInsights />
      </>
    );
  }
  ```

- [ ] **Step 2: Run lint feedback**
  Run: `pnpm lint`
  Expected: no import or React component errors.

## Chunk 4: Public Layout Integration

### Task 4: Mount analytics components in the public layout

**Files:**

- Modify: `app/(site)/layout.tsx`

- [ ] **Step 1: Import wrapper**
  Add:
  ```ts
  import { VercelInsights } from "@/components/vercel-insights";
  ```

- [ ] **Step 2: Render wrapper at the end of body**
  Update the body to keep existing children and append:
  ```tsx
  <VercelInsights />
  ```

- [ ] **Step 3: Keep admin untouched**
  Do not modify `app/(payload)/layout.tsx` or Payload admin routes in this slice.

- [ ] **Step 4: Run feedback**
  Run:
  ```bash
  node --test lib/analytics.test.ts
  pnpm lint
  ```
  Expected: both pass.

## Chunk 5: Environment And Docs

### Task 5: Document the analytics flag

**Files:**

- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Add env example**
  Add to `.env.example`:
  ```dotenv
  ANALYTICS_ENABLED=false
  ```

- [ ] **Step 2: Update README environment variables**
  Document:
  - `ANALYTICS_ENABLED=false` for local development;
  - set `ANALYTICS_ENABLED=true` in Vercel preview/production after enabling Web Analytics and Speed Insights in the Vercel project;
  - the flag is not secret.

- [ ] **Step 3: Add manual verification path**
  Add a short "Analytics path" under verification:
  - local build with default `false`;
  - temporary local check with `ANALYTICS_ENABLED=true`;
  - Vercel dashboard confirmation after deploy.

## Chunk 6: Final Verification

### Task 6: Verify the slice

- [ ] **Step 1: Run helper test**
  Run:
  ```bash
  node --test lib/analytics.test.ts
  ```
  Expected: PASS.

- [ ] **Step 2: Run project checks**
  Run:
  ```bash
  pnpm lint
  pnpm build
  git diff --check
  ```
  Expected: all pass.

- [ ] **Step 3: Optional local smoke**
  With the app running:
  - `ANALYTICS_ENABLED=false` keeps public pages rendering normally.
  - `ANALYTICS_ENABLED=true` keeps public pages rendering normally.

## Acceptance Criteria

1. `@vercel/analytics` and `@vercel/speed-insights` are installed.
2. `VercelInsights` renders `Analytics` and `SpeedInsights` only when `ANALYTICS_ENABLED=true`.
3. Public site layout mounts `VercelInsights`.
4. Payload admin layout is not modified.
5. `.env.example` defaults `ANALYTICS_ENABLED=false`.
6. README documents local and Vercel setup.
7. No `PostMetrics`, custom counters, cookies, visitor hashes, API routes, or dashboards are added.
8. `node --test lib/analytics.test.ts`, `pnpm lint`, `pnpm build`, and `git diff --check` pass.
