# Blog PRD Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining MVP PRD gaps found in the current code audit without changing the already-working blog, comments, projects, analytics, and media flows unnecessarily.

**Architecture:** Treat the remaining gaps as four independent chunks: SEO/discovery hardening, CMS profile/settings completeness, comment hardening, and operations readiness. Each chunk should be independently testable and should reuse the existing Payload Local API, route group, helper, and README verification patterns already present in this repo.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PayloadCMS 3.84.x, MongoDB, Vercel Blob, Vercel Analytics/Speed Insights, Tailwind CSS 4, Node test runner, Playwright, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Current implementation evidence:
  - `payload.config.ts`
  - `collections/Users.ts`
  - `collections/Comments.ts`
  - `globals/SiteSettings.ts`
  - `app/(site)/blog/[slug]/page.tsx`
  - `app/(site)/sitemap.ts`
  - `app/(site)/api/comments/route.ts`
  - `README.md`
- Related existing plans:
  - `.agents/superpowers/specs/2026-05-22-blog-foundation-implementation-plan.md`
  - `.agents/superpowers/specs/2026-05-23-blog-about-contact-implementation-plan.md`
  - `.agents/superpowers/specs/2026-05-23-blog-comments-implementation-plan.md`
  - `.agents/superpowers/specs/2026-05-24-blog-comment-anti-spam-implementation-plan.md`
  - `.agents/superpowers/specs/2026-05-24-blog-discovery-rss-implementation-plan.md`
  - `.agents/superpowers/specs/2026-05-24-blog-post-metrics-implementation-plan.md`
  - `.agents/superpowers/specs/2026-05-24-blog-revalidation-implementation-plan.md`

## Gap List

This plan covers these open or partial PRD items:

- Vercel Hobby / vercel.app production deployment evidence and checklist.
- Manual MongoDB backup/export workflow.
- Reading time display on public post pages.
- Canonical URLs and Open Graph metadata across public pages.
- Sitemap coverage for tag routes.
- `SiteSettings` parity for `seoDefaults` and `navigation`.
- User avatar field.
- More complete About content sections for experience, stack, and education/certifications.
- Comment `deletedAt` soft-delete timestamp.
- Comment minimum fill-time anti-spam check.
- Explicit comment HTML/script rejection.

This plan intentionally does not cover V2/non-MVP items from the PRD:

- Custom domain.
- Sentry/PostHog.
- Email notifications.
- Transactional email.
- Postgres migration.
- Separate NestJS/Express backend.

## Implementation Rules

- Use @test-driven-development for pure helpers before production changes.
- Use @verification-before-completion before claiming any chunk is complete.
- Keep changes surgical. Do not refactor unrelated existing page structure or styling.
- Keep `app/layout.tsx` neutral; public shell changes stay under `app/(site)`.
- Do not add Redis, queues, CAPTCHA, paid services, or a new backend.
- Do not collect comment emails in this plan. The PRD allows email hash only if email is collected; current MVP keeps comments as name + body to minimize PII.
- Do not commit unless the user explicitly asks.

## File Map

Create:

- `lib/seo.test.ts`: tests canonical URL helper behavior.
- `lib/comment-submission-timing.ts`: pure minimum fill-time helper.
- `lib/comment-submission-timing.test.ts`: tests minimum fill-time behavior.
- `scripts/backup-mongo.sh`: manual MongoDB export script with a dry-run mode.
- `docs/deployment-checklist.md`: Vercel Hobby / Atlas / Blob / Analytics launch checklist.

Modify:

- `lib/seo.ts`: add small canonical URL helper(s) while preserving `absoluteUrl`.
- `app/(site)/layout.tsx`: add site-wide metadata defaults where appropriate.
- `app/(site)/page.tsx`: add homepage metadata with canonical and Open Graph.
- `app/(site)/about/page.tsx`: render richer profile sections and metadata.
- `app/(site)/contact/page.tsx`: add canonical and Open Graph metadata.
- `app/(site)/projects/page.tsx`: add canonical and Open Graph metadata.
- `app/(site)/projects/[slug]/page.tsx`: add canonical URL and Open Graph URL.
- `app/(site)/blog/page.tsx`: add canonical and Open Graph metadata.
- `app/(site)/blog/[slug]/page.tsx`: display reading time and add canonical URL.
- `app/(site)/tags/[slug]/page.tsx`: add canonical and Open Graph metadata.
- `app/(site)/feed/page.tsx`: add canonical and Open Graph metadata.
- `app/(site)/sitemap.ts`: include tag routes.
- `lib/posts.ts` or `lib/tags.ts`: expose a public tags query for sitemap.
- `globals/SiteSettings.ts`: add `seoDefaults`, `navigation`, and profile section fields.
- `lib/site-settings.ts`: add fallback helpers for navigation, SEO defaults, and profile sections.
- `lib/site-settings.test.ts`: test the new fallback helpers.
- `components/site-header.tsx`: render navigation from `SiteSettings` with static fallback.
- `collections/Users.ts`: add optional avatar upload field.
- `collections/Comments.ts`: add `deletedAt` and hook behavior for soft delete timestamps.
- `lib/comment-validation.ts`: reject HTML/script-like input.
- `lib/comment-validation.test.ts`: cover HTML/script rejection.
- `components/comment-form.tsx`: send a client-side form start timestamp.
- `app/(site)/api/comments/route.ts`: validate minimum fill time before creating comments.
- `payload-types.ts`: regenerate after Payload schema changes.
- `README.md`: document backup, deployment checklist, SEO, and comment hardening verification.
- `Makefile`: add backup helper target.
- `.gitignore`: ignore local backup output.

## Chunk 1: SEO, Reading Time, And Sitemap Hardening

### Task 1: Add canonical URL helper tests

**Files:**

- Create: `lib/seo.test.ts`
- Modify: `lib/seo.ts`

- [ ] **Step 1: Write failing tests**
  Add tests for:
  - `absoluteUrl("/")` uses `NEXT_PUBLIC_SITE_URL` fallback behavior.
  - `canonicalUrl("/blog/example")` returns an absolute URL.
  - `canonicalUrl("blog/example")` normalizes a missing leading slash.

- [ ] **Step 2: Run the focused test**
  Run: `node --test lib/seo.test.ts`
  Expected: FAIL because `canonicalUrl` does not exist yet.

- [ ] **Step 3: Implement minimal helper**
  Extend `lib/seo.ts` with a tiny `canonicalUrl(path: string)` wrapper around `absoluteUrl()`.

- [ ] **Step 4: Verify helper**
  Run: `node --test lib/seo.test.ts`
  Expected: PASS.

### Task 2: Add canonical and Open Graph metadata to public pages

**Files:**

- Modify: `app/(site)/layout.tsx`
- Modify: `app/(site)/page.tsx`
- Modify: `app/(site)/about/page.tsx`
- Modify: `app/(site)/contact/page.tsx`
- Modify: `app/(site)/projects/page.tsx`
- Modify: `app/(site)/projects/[slug]/page.tsx`
- Modify: `app/(site)/blog/page.tsx`
- Modify: `app/(site)/blog/[slug]/page.tsx`
- Modify: `app/(site)/tags/[slug]/page.tsx`
- Modify: `app/(site)/feed/page.tsx`

- [ ] **Step 1: Add site-wide metadata defaults**
  In `app/(site)/layout.tsx`, set `metadataBase` from `getSiteUrl()` and add default site Open Graph metadata that does not override page-specific title/description.

- [ ] **Step 2: Add page-level canonical metadata**
  Add `alternates: { canonical: canonicalUrl("<route>") }` to static public pages.

- [ ] **Step 3: Add detail-page canonical metadata**
  In dynamic metadata functions for posts, projects, and tags, include each resolved public URL as canonical and Open Graph URL.

- [ ] **Step 4: Keep RSS route behavior unchanged**
  Do not change `app/(site)/rss.xml/route.ts`; it already emits absolute post links.

- [ ] **Step 5: Verify metadata compile path**
  Run:
  ```bash
  node --test lib/seo.test.ts
  pnpm lint
  ```
  Expected: PASS.

### Task 3: Display reading time on post pages

**Files:**

- Modify: `app/(site)/blog/[slug]/page.tsx`

- [ ] **Step 1: Add a small formatter**
  Add a local formatter that returns `"<n> min read"` only when `post.readingTime` is a positive number.

- [ ] **Step 2: Render it with the date**
  Update the post metadata row to show date and reading time when available.

- [ ] **Step 3: Verify no empty placeholder**
  Confirm posts without `readingTime` still render only the date.

### Task 4: Add tag routes to sitemap

**Files:**

- Modify: `lib/posts.ts` or create/modify `lib/tags.ts`
- Modify: `app/(site)/sitemap.ts`

- [ ] **Step 1: Add a public tag query helper**
  Add a helper that fetches public tags with `slug`, `updatedAt`, and `createdAt`.

- [ ] **Step 2: Include tags in sitemap**
  Add `/tags/<slug>` entries to `app/(site)/sitemap.ts`.

- [ ] **Step 3: Verify sitemap build path**
  Run:
  ```bash
  node --test lib/seo.test.ts
  pnpm build
  ```
  Expected: PASS.

## Chunk 2: CMS Settings, Navigation, Profile Sections, And User Avatar

### Task 5: Add SiteSettings fallback tests

**Files:**

- Modify: `lib/site-settings.test.ts`
- Modify: `lib/site-settings.ts`

- [ ] **Step 1: Write failing tests**
  Add tests for:
  - `getSiteNavigation()` returns configured navigation when valid.
  - `getSiteNavigation()` falls back to current static routes when empty.
  - `getSiteSeoDefaults()` prefers `seoDefaults` but falls back to current site name/description behavior.
  - `getProfileSections()` filters blank sections.

- [ ] **Step 2: Run focused test**
  Run: `node --test lib/site-settings.test.ts`
  Expected: FAIL because the new helpers do not exist.

- [ ] **Step 3: Implement pure helpers**
  Keep fallback constants in `lib/site-settings.ts`; do not fetch Payload in these helpers.

- [ ] **Step 4: Verify helpers**
  Run: `node --test lib/site-settings.test.ts`
  Expected: PASS.

### Task 6: Extend SiteSettings schema

**Files:**

- Modify: `globals/SiteSettings.ts`
- Modify: `payload-types.ts`

- [ ] **Step 1: Add `seoDefaults` group**
  Add optional fields:
  - `title`
  - `description`
  - `openGraphImage` as upload relation to `media`

- [ ] **Step 2: Add `navigation` array**
  Add array rows:
  - `label`
  - `url`
  - optional `newTab`

- [ ] **Step 3: Add `profileSections` array**
  Add array rows:
  - `title`
  - `body`
  Use this for experience, stack, education, and certifications without creating a new collection.

- [ ] **Step 4: Regenerate types**
  Run:
  ```bash
  pnpm generate:types
  ```
  Expected: `payload-types.ts` includes new `SiteSetting` fields.

### Task 7: Render CMS navigation and richer About content

**Files:**

- Modify: `components/site-header.tsx`
- Modify: `app/(site)/about/page.tsx`
- Modify: `README.md`

- [ ] **Step 1: Fetch settings for public navigation**
  Update `SiteHeader` to fetch `SiteSettings` and render `getSiteNavigation(settings)` with the existing static routes as fallback.

- [ ] **Step 2: Keep admin shell untouched**
  Do not modify `app/(payload)/layout.tsx`.

- [ ] **Step 3: Render profile sections on About**
  Render configured `profileSections` below the existing headline/bio block.

- [ ] **Step 4: Document manual CMS path**
  Add README verification steps for configuring navigation and profile sections in Payload admin.

- [ ] **Step 5: Verify**
  Run:
  ```bash
  node --test lib/site-settings.test.ts
  pnpm lint
  ```
  Expected: PASS.

### Task 8: Add optional user avatar

**Files:**

- Modify: `collections/Users.ts`
- Modify: `payload-types.ts`

- [ ] **Step 1: Add avatar upload field**
  Add optional `avatar` upload relation to `media`.

- [ ] **Step 2: Keep auth behavior unchanged**
  Do not change `auth: true`, first-user bootstrap, or admin access rules.

- [ ] **Step 3: Regenerate types**
  Run: `pnpm generate:types`
  Expected: `User` includes optional `avatar`.

## Chunk 3: Comment Soft Delete And Anti-Spam Completion

### Task 9: Add HTML/script rejection tests

**Files:**

- Modify: `lib/comment-validation.test.ts`
- Modify: `lib/comment-validation.ts`

- [ ] **Step 1: Write failing tests**
  Add cases that reject:
  - `<script>alert(1)</script>`
  - `<b>bold</b>`
  - angle-bracket HTML-like content in `authorName` or `body`

- [ ] **Step 2: Run focused test**
  Run: `node --test lib/comment-validation.test.ts`
  Expected: FAIL before implementation.

- [ ] **Step 3: Implement minimal rejection**
  Reject HTML/script-like input in `validateCommentInput()` with a generic public message such as `"HTML is not allowed."`.

- [ ] **Step 4: Verify**
  Run: `node --test lib/comment-validation.test.ts`
  Expected: PASS.

### Task 10: Add minimum fill-time helper

**Files:**

- Create: `lib/comment-submission-timing.ts`
- Create: `lib/comment-submission-timing.test.ts`

- [ ] **Step 1: Write failing tests**
  Test:
  - missing start timestamp is allowed to avoid blocking old clients.
  - a submission faster than the minimum is rejected.
  - a submission at or above the minimum is allowed.
  - invalid timestamps are allowed or treated as absent, not as server errors.

- [ ] **Step 2: Run focused test**
  Run: `node --test lib/comment-submission-timing.test.ts`
  Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement helper**
  Add a default minimum of 3 seconds. Keep the helper pure and parameterized with `now` for tests.

- [ ] **Step 4: Verify helper**
  Run: `node --test lib/comment-submission-timing.test.ts`
  Expected: PASS.

### Task 11: Wire minimum fill-time into the comment form and API

**Files:**

- Modify: `components/comment-form.tsx`
- Modify: `app/(site)/api/comments/route.ts`
- Modify: `lib/comment-validation.ts`
- Modify: `lib/comment-validation.test.ts`

- [ ] **Step 1: Send form start timestamp**
  In `CommentForm`, capture a timestamp when the component mounts and include it in the JSON body as `startedAt`.

- [ ] **Step 2: Accept timestamp in validation shape**
  Extend `validateCommentInput()` to normalize optional `startedAt`.

- [ ] **Step 3: Check timing in route**
  In `POST /api/comments`, after basic input validation and honeypot handling, call the timing helper and return the same generic moderation success for too-fast submissions.

- [ ] **Step 4: Preserve existing behavior**
  Keep:
  - honeypot filled => generic success and no comment created.
  - invalid post => `404`.
  - rate limit exceeded => `429`.
  - valid comment => pending comment.

- [ ] **Step 5: Verify**
  Run:
  ```bash
  node --test lib/comment-validation.test.ts lib/comment-submission-timing.test.ts lib/comment-rate-limit.test.ts
  pnpm lint
  ```
  Expected: PASS.

### Task 12: Add soft-delete timestamp

**Files:**

- Modify: `collections/Comments.ts`
- Modify: `payload-types.ts`
- Modify: `README.md`

- [ ] **Step 1: Add `deletedAt` field**
  Add a read-only `deletedAt` date field.

- [ ] **Step 2: Add hook behavior**
  Add a hook that:
  - sets `deletedAt` when status changes to `deleted`.
  - clears `deletedAt` if an admin restores status away from `deleted`.

- [ ] **Step 3: Keep public rendering strict**
  Keep public reads limited to `status=approved` through `lib/comments.ts`.

- [ ] **Step 4: Regenerate types**
  Run: `pnpm generate:types`
  Expected: `Comment` includes optional `deletedAt`.

- [ ] **Step 5: Document manual moderation path**
  Update README comment moderation steps to include soft-delete behavior.

## Chunk 4: Backup, Deployment Checklist, And Acceptance Evidence

### Task 13: Add manual MongoDB backup script

**Files:**

- Create: `scripts/backup-mongo.sh`
- Modify: `.gitignore`
- Modify: `Makefile`
- Modify: `README.md`

- [ ] **Step 1: Create script**
  Add a POSIX shell script that:
  - requires `DATABASE_URI`.
  - requires `mongodump`.
  - writes to `backups/<timestamp>/` by default.
  - accepts `BACKUP_DIR` override.
  - supports `--dry-run` for command verification without connecting.

- [ ] **Step 2: Ignore backup output**
  Add `/backups/` to `.gitignore`.

- [ ] **Step 3: Add Makefile target**
  Add `backup-mongo` target that calls `scripts/backup-mongo.sh`.

- [ ] **Step 4: Document usage**
  Add README instructions for local and Atlas backup export.

- [ ] **Step 5: Verify script syntax and target visibility**
  Run:
  ```bash
  bash -n scripts/backup-mongo.sh
  make help
  ```
  Expected: syntax check passes and `backup-mongo` appears in help output.

### Task 14: Add production deployment checklist

**Files:**

- Create: `docs/deployment-checklist.md`
- Modify: `README.md`

- [ ] **Step 1: Add checklist**
  Include:
  - Vercel Hobby project.
  - `*.vercel.app` URL accepted for MVP.
  - MongoDB Atlas Free Tier `DATABASE_URI`.
  - Atlas network access note for Vercel/serverless access.
  - `PAYLOAD_SECRET`.
  - `REVALIDATION_SECRET`.
  - Vercel Blob store and `BLOB_READ_WRITE_TOKEN`.
  - `NEXT_PUBLIC_BLOB_HOSTNAME`.
  - `NEXT_PUBLIC_SITE_URL`.
  - Web Analytics and Speed Insights enabled.
  - `ANALYTICS_ENABLED=true` in Vercel only after Vercel analytics is enabled.
  - First admin login smoke test.
  - Published post with cover image smoke test.
  - Comment moderation smoke test.
  - Backup dry-run or real export command.

- [ ] **Step 2: Link from README**
  Add a short link under `## Deployment`.

- [ ] **Step 3: Verify doc references**
  Run:
  ```bash
  rg -n "deployment-checklist|backup-mongo|Vercel Hobby|MongoDB Atlas" README.md docs/deployment-checklist.md Makefile
  ```
  Expected: all new operational items are discoverable.

## Final Verification

- [ ] **Step 1: Run focused Node tests**
  ```bash
  node --test \
    lib/seo.test.ts \
    lib/site-settings.test.ts \
    lib/comment-validation.test.ts \
    lib/comment-submission-timing.test.ts \
    lib/comment-rate-limit.test.ts
  ```

- [ ] **Step 2: Regenerate Payload artifacts**
  ```bash
  pnpm generate:types
  pnpm generate:importmap
  ```

- [ ] **Step 3: Run lint and build**
  ```bash
  pnpm lint
  pnpm build
  ```

- [ ] **Step 4: Run e2e smoke if MongoDB is available**
  ```bash
  docker compose up -d mongo
  pnpm test:e2e
  ```

- [ ] **Step 5: Manual CMS smoke**
  Verify in `/admin`:
  - User can set avatar.
  - SiteSettings can set navigation, SEO defaults, and profile sections.
  - Comment can be set to `deleted` and receives `deletedAt`.
  - Published post page shows reading time when configured.

- [ ] **Step 6: Manual operations smoke**
  Verify:
  - `make help` lists backup target.
  - `scripts/backup-mongo.sh --dry-run` prints the expected `mongodump` command.
  - `docs/deployment-checklist.md` covers Vercel, Atlas, Blob, Analytics, first admin, publish, comment moderation, and backup acceptance evidence.

