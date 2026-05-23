# Blog Comments Moderation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add moderated visitor comments to published blog posts.

**Architecture:** Reuse the existing Next.js + PayloadCMS monolith. Add a Payload `Comments` collection for admin moderation, a public `/api/comments` endpoint for validated submissions, server helpers for approved comment reads, and a small client form under post pages.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PayloadCMS 3.84.x, MongoDB, Tailwind CSS 4, pnpm.

---

## Source Documents

- Product PRD: `docs/_MConverter.eu_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Comments design: `docs/superpowers/specs/2026-05-23-blog-comments-design.md`
- Foundation design: `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`

## Implementation Rules

- Use @test-driven-development where behavior can be isolated.
- Use @verification-before-completion before claiming completion.
- Do not collect comment email in this slice.
- Do not implement replies, notifications, analytics, or rate-limit storage.
- Do not expose pending/rejected/deleted comments publicly.
- Do not commit unrelated worktree changes.

## File Map

Create:

- `collections/Comments.ts`: Payload comments collection.
- `lib/comments.ts`: approved comment read helper.
- `lib/comment-validation.ts`: shared pure validation helpers.
- `app/(site)/api/comments/route.ts`: public comment submission endpoint.
- `components/comment-form.tsx`: client-side comment form.
- `components/comments-section.tsx`: server-rendered comments section.

Modify:

- `payload.config.ts`: import/register `Comments`.
- `app/(site)/blog/[slug]/page.tsx`: render comments section under post content.
- `payload-types.ts`: regenerate after collection registration.
- `app/(payload)/admin/importMap.js`: regenerate if Payload updates it.
- `README.md`: add manual verification steps.

## Chunk 1: Validation And Payload Model

### Task 1: Add comment validation helpers

**Files:**

- Create: `lib/comment-validation.ts`

- [ ] **Step 1: Add constants and validation**
  Implement:
  - `MAX_COMMENT_NAME_LENGTH = 80`
  - `MAX_COMMENT_BODY_LENGTH = 2000`
  - `validateCommentInput(input)`

  The helper returns either:
  ```ts
  { ok: true, value: { postSlug: string; authorName: string; body: string; website: string } }
  ```
  or:
  ```ts
  { ok: false, message: string }
  ```

- [ ] **Step 2: Keep validation pure**
  Do not import Payload, Next.js, or request APIs in this file.

### Task 2: Create Comments collection

**Files:**

- Create: `collections/Comments.ts`

- [ ] **Step 1: Add collection config**
  Fields:
  - `post`: relationship to `posts`, required, indexed.
  - `authorName`: text, required, maxLength 80.
  - `body`: textarea, required, maxLength 2000.
  - `status`: select `pending | approved | rejected | deleted`, default `pending`.
  - `ipHash`: text, admin read-only.
  - `userAgentHash`: text, admin read-only.

- [ ] **Step 2: Add access rules**
  Use `isAdmin` for create/read/update/delete.

### Task 3: Register collection and regenerate types

**Files:**

- Modify: `payload.config.ts`
- Modify: `payload-types.ts`
- Maybe modify: `app/(payload)/admin/importMap.js`

- [ ] **Step 1: Import `Comments`**
  Add the collection import in `payload.config.ts`.

- [ ] **Step 2: Register `Comments`**
  Update `collections` to include `Comments`.

- [ ] **Step 3: Regenerate generated files**
  Run:
  ```bash
  pnpm generate:importmap
  pnpm generate:types
  ```

- [ ] **Step 4: Verify generated type**
  Run:
  ```bash
  rg -n "interface Comment|comments:" payload-types.ts
  ```
  Expected: generated `Comment` and `comments` entries exist.

## Chunk 2: Public Read And Submit Path

### Task 4: Add approved comment read helper

**Files:**

- Create: `lib/comments.ts`

- [ ] **Step 1: Add `getApprovedCommentsForPost(postId)`**
  Query Payload Local API:
  - collection `comments`
  - where `post equals postId`
  - and `status equals approved`
  - sort `createdAt`
  - limit enough for MVP, for example 100.

### Task 5: Add public comment endpoint

**Files:**

- Create: `app/(site)/api/comments/route.ts`

- [ ] **Step 1: Parse JSON safely**
  Return `400` for malformed JSON.

- [ ] **Step 2: Validate input**
  Use `validateCommentInput`.

- [ ] **Step 3: Honeypot behavior**
  If `website` is non-empty, return generic success without creating a comment.

- [ ] **Step 4: Resolve published post**
  Find a post by `slug` and `status = published`.
  Return `404` if not found.

- [ ] **Step 5: Hash request metadata**
  Use Node `crypto.createHash("sha256")` on IP and user agent strings when present.

- [ ] **Step 6: Create pending comment**
  Use Payload Local API with `overrideAccess: true`.
  Force:
  - `status: "pending"`
  - `post: post.id`
  - trimmed `authorName`
  - trimmed `body`

## Chunk 3: Public UI

### Task 6: Add comment form component

**Files:**

- Create: `components/comment-form.tsx`

- [ ] **Step 1: Add client component**
  Use `"use client"`, `useState`, and a normal `fetch("/api/comments", { method: "POST" })`.

- [ ] **Step 2: Render fields**
  Include:
  - hidden `postSlug` prop payload
  - visible name input
  - visible comment textarea
  - hidden honeypot input named `website`
  - submit button

- [ ] **Step 3: Render states**
  Show pending state while submitting, error message on failure, and success message after accepted submission.

### Task 7: Add comments section component

**Files:**

- Create: `components/comments-section.tsx`

- [ ] **Step 1: Render approved comments**
  Accept `postId` and `postSlug`, fetch comments with `getApprovedCommentsForPost`, and render author name, date, and plain body.

- [ ] **Step 2: Render empty state**
  Show a small empty state when there are no approved comments.

- [ ] **Step 3: Render form**
  Render `CommentForm` below the list.

### Task 8: Render comments under blog posts

**Files:**

- Modify: `app/(site)/blog/[slug]/page.tsx`

- [ ] **Step 1: Import `CommentsSection`**

- [ ] **Step 2: Render below article**
  Pass `post.id` and `post.slug`.

## Chunk 4: Docs And Verification

### Task 9: Add README verification note

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add comment CMS path**
  Document the manual flow:
  - submit comment under a published post
  - confirm it appears as pending in `/admin`
  - approve it
  - confirm it appears publicly

### Task 10: Verify

- [ ] **Step 1: Generated files**
  Run:
  ```bash
  pnpm generate:importmap
  pnpm generate:types
  ```

- [ ] **Step 2: Static checks**
  Run:
  ```bash
  pnpm lint
  pnpm build
  git diff --check
  ```

- [ ] **Step 3: Live smoke checks**
  With MongoDB and Next.js running:
  - `GET /blog/<published-slug>` returns 200.
  - `POST /api/comments` with valid data returns success.
  - Pending comment does not render publicly.
  - After admin approval, the comment renders publicly.

## Acceptance Criteria

1. `Comments` collection exists in Payload admin.
2. Public visitors can submit comments under published posts.
3. New public comments are created as `pending`.
4. Pending comments do not render publicly.
5. Admins can approve comments in Payload admin.
6. Approved comments render under the correct post.
7. Comment form does not collect email.
8. Basic validation and honeypot protection are in place.
9. Generated Payload types include `Comment` and `comments`.
10. `pnpm lint` and `pnpm build` pass.
