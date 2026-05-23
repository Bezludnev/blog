# Blog About And Contact Pages Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public About and Contact pages backed by the existing Payload `SiteSettings` global.

**Architecture:** Keep this as a small Next.js App Router slice. Server components fetch SiteSettings through a focused helper, render fallback content for empty optional fields, and add static navigation/sitemap links. No new Payload collection, public write endpoint, or external service is added.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PayloadCMS 3.84.x, MongoDB, Tailwind CSS 4, pnpm.

---

## Source Documents

- Product PRD: `docs/_MConverter.eu_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Design: `docs/superpowers/specs/2026-05-23-blog-about-contact-design.md`
- Foundation design: `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`

## Implementation Rules

- Use @test-driven-development where helper behavior can be isolated.
- Use @verification-before-completion before claiming this slice is done.
- Do not add a contact form in this slice.
- Do not add a `ContactMessages` collection.
- Do not add email sending, CAPTCHA, analytics, RSS, tag pages, or search.
- Do not regenerate Payload types unless implementation changes Payload config or globals.
- Do not commit unrelated worktree changes.

## File Map

Create:

- `lib/site-settings.ts`: fetches and normalizes the existing `SiteSettings` global.
- `components/social-links.tsx`: small reusable external link list.
- `app/(site)/about/page.tsx`: public About page.
- `app/(site)/contact/page.tsx`: public Contact page.

Modify:

- `components/site-header.tsx`: add About and Contact nav links.
- `app/(site)/page.tsx`: add About and Contact calls to action.
- `app/(site)/sitemap.ts`: include `/about` and `/contact`.
- `README.md`: add manual verification steps.

## Chunk 1: Site Settings Helper

### Task 1: Add SiteSettings helper

**Files:**

- Create: `lib/site-settings.ts`

- [ ] **Step 1: Add helper**
  Implement `getSiteSettings()`:
  - calls `getPayloadClient()`
  - reads global `site-settings`
  - returns the Payload global data

- [ ] **Step 2: Add fallback helpers**
  Export:
  - `getSiteName(settings)` -> settings name or `"MConverter.eu"`
  - `getSiteHeadline(settings)` -> settings headline or `"Personal engineering blog"`
  - `getSiteBio(settings)` -> settings bio or a concise static fallback paragraph

- [ ] **Step 3: Keep helper focused**
  Do not import React or page components in this file.

## Chunk 2: Shared Social Links UI

### Task 2: Add reusable social links component

**Files:**

- Create: `components/social-links.tsx`

- [ ] **Step 1: Add component**
  Implement a component that accepts:
  ```ts
  type SocialLink = {
    label?: null | string;
    url?: null | string;
  };
  ```

- [ ] **Step 2: Filter invalid rows**
  Render only rows with both `label` and `url`.

- [ ] **Step 3: Use safe external link attributes**
  Each link should use:
  - `target="_blank"`
  - `rel="noreferrer"`

- [ ] **Step 4: Render nothing for empty links**
  Return `null` when no valid links exist.

## Chunk 3: Public Pages

### Task 3: Add About page

**Files:**

- Create: `app/(site)/about/page.tsx`

- [ ] **Step 1: Add metadata**
  Use static metadata:
  - title: `About | MConverter.eu`
  - description: `Profile, experience, and engineering focus.`

- [ ] **Step 2: Fetch SiteSettings**
  Use `getSiteSettings()`, `getSiteHeadline()`, and `getSiteBio()`.

- [ ] **Step 3: Render page**
  Include:
  - `SiteHeader`
  - page title `About`
  - headline
  - bio paragraph with preserved whitespace
  - `SocialLinks`
  - links to `/projects`, `/blog`, and `/contact`

### Task 4: Add Contact page

**Files:**

- Create: `app/(site)/contact/page.tsx`

- [ ] **Step 1: Add metadata**
  Use static metadata:
  - title: `Contact | MConverter.eu`
  - description: `Ways to contact MConverter.eu.`

- [ ] **Step 2: Fetch SiteSettings**
  Use `getSiteSettings()`.

- [ ] **Step 3: Render contact email**
  If `contactEmail` exists, render a `mailto:` link.

- [ ] **Step 4: Render fallback**
  If `contactEmail` is empty, render a short fallback that points users to configured social links.

- [ ] **Step 5: Render social links and internal links**
  Include `SocialLinks`, plus links to `/about` and `/projects`.

## Chunk 4: Navigation And Sitemap

### Task 5: Update header navigation

**Files:**

- Modify: `components/site-header.tsx`

- [ ] **Step 1: Add About link**
  Add `/about` before `/projects`.

- [ ] **Step 2: Add Contact link**
  Add `/contact` before `/admin`.

- [ ] **Step 3: Keep existing styling**
  Do not redesign the header.

### Task 6: Update home page CTAs

**Files:**

- Modify: `app/(site)/page.tsx`

- [ ] **Step 1: Add About link**
  Add a secondary CTA to `/about`.

- [ ] **Step 2: Add Contact link**
  Add a secondary CTA to `/contact`.

- [ ] **Step 3: Keep current Blog, Projects, Admin links**
  Do not remove existing routes.

### Task 7: Update sitemap

**Files:**

- Modify: `app/(site)/sitemap.ts`

- [ ] **Step 1: Add static URLs**
  Add entries for:
  - `absoluteUrl("/about")`
  - `absoluteUrl("/contact")`

- [ ] **Step 2: Preserve dynamic URLs**
  Keep existing post and project sitemap entries unchanged.

## Chunk 5: Docs And Verification

### Task 8: Add README verification note

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add About/Contact CMS path**
  Document:
  - update SiteSettings in `/admin`
  - verify `/about`
  - verify `/contact`
  - verify sitemap includes both routes

### Task 9: Verify

- [ ] **Step 1: Static checks**
  Run:
  ```bash
  pnpm lint
  pnpm build
  git diff --check
  ```

- [ ] **Step 2: Live smoke checks**
  With MongoDB and Next.js running:
  - `GET /about` returns 200.
  - `GET /contact` returns 200.
  - `GET /sitemap.xml` includes `/about` and `/contact`.

## Acceptance Criteria

1. `/about` exists and renders from SiteSettings.
2. `/contact` exists and renders contact email/social links from SiteSettings.
3. Optional empty SiteSettings fields have fallbacks.
4. Header links to About and Contact.
5. Home page links to About and Contact.
6. Sitemap includes `/about` and `/contact`.
7. No contact form or public write endpoint is added.
8. `pnpm lint` and `pnpm build` pass.
