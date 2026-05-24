# Blog Dark Theme Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent light/dark theme to the public site while leaving Payload admin unchanged.

**Architecture:** Use Tailwind's selector-based `dark` variant with a `dark` class on the public `<html>` element. A small bootstrap script applies the stored preference before paint, and a public header toggle updates the class and local storage.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, PayloadCMS admin route separation, Node test runner, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Dark theme design: `docs/superpowers/specs/2026-05-24-blog-dark-theme-design.md`
- Foundation design: `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- Comment replies design: `docs/superpowers/specs/2026-05-24-blog-comment-replies-design.md`
- Tailwind docs checked through Context7: Tailwind supports `dark:` utilities and selector-based dark mode with `@custom-variant dark (&:where(.dark, .dark *));`.

## Implementation Rules

- Use @test-driven-development for pure theme helpers before production changes.
- Use @verification-before-completion before claiming completion.
- Keep `/admin` outside the public theme implementation.
- Do not redesign layout or add new public content.
- Do not change post metrics, backup/export, comments behavior, RSS, sitemap,
  analytics, revalidation, Payload collections, or generated types.
- Do not commit unless the user explicitly asks.

## File Map

Create:

- `lib/theme.ts`: theme constants, preference guard, and bootstrap script string.
- `lib/theme.test.ts`: Node tests for theme helpers.
- `components/theme-toggle.tsx`: public client-side light/dark toggle.

Modify:

- `app/globals.css`: add selector-based dark variant and dark CSS variables.
- `app/(site)/layout.tsx`: add public theme bootstrap script and hydration warning.
- `components/site-header.tsx`: add the theme toggle and dark classes.
- Public pages and components that currently hard-code light-only colors:
  - `app/(site)/page.tsx`
  - `app/(site)/about/page.tsx`
  - `app/(site)/contact/page.tsx`
  - `app/(site)/blog/page.tsx`
  - `app/(site)/blog/[slug]/page.tsx`
  - `app/(site)/tags/[slug]/page.tsx`
  - `app/(site)/projects/page.tsx`
  - `app/(site)/projects/[slug]/page.tsx`
  - `components/post-card.tsx`
  - `components/project-card.tsx`
  - `components/comments-section.tsx`
  - `components/comment-form.tsx`
  - `components/pagination.tsx`
  - `components/rich-text.tsx`
  - `components/media-image.tsx`
- `README.md`: add manual dark-theme verification notes.

Do not modify:

- `app/(payload)/layout.tsx`
- `app/(payload)/admin/[[...segments]]/page.tsx`
- `app/(payload)/admin/importMap.js`
- `payload.config.ts`
- Payload collections or globals.
- API routes.

## Chunk 1: Theme Helpers

### Task 1: Add failing helper tests

**Files:**

- Create: `lib/theme.test.ts`

- [ ] **Step 1: Write tests**

  ```ts
  import assert from "node:assert/strict";
  import { describe, it } from "node:test";

  import {
    THEME_STORAGE_KEY,
    getThemeBootstrapScript,
    isStoredTheme,
  } from "./theme.ts";

  describe("isStoredTheme", () => {
    it("accepts only stored light and dark values", () => {
      assert.equal(isStoredTheme("light"), true);
      assert.equal(isStoredTheme("dark"), true);
      assert.equal(isStoredTheme("system"), false);
      assert.equal(isStoredTheme(""), false);
      assert.equal(isStoredTheme(undefined), false);
    });
  });

  describe("getThemeBootstrapScript", () => {
    it("references the storage key and dark class", () => {
      const script = getThemeBootstrapScript();

      assert.match(script, new RegExp(THEME_STORAGE_KEY));
      assert.match(script, /classList/);
      assert.match(script, /dark/);
      assert.match(script, /prefers-color-scheme/);
    });
  });
  ```

- [ ] **Step 2: Run focused test**

  Run: `node --test lib/theme.test.ts`

  Expected: FAIL because `lib/theme.ts` does not exist.

### Task 2: Implement theme helpers

**Files:**

- Create: `lib/theme.ts`

- [ ] **Step 1: Add constants and helpers**

  ```ts
  export const THEME_STORAGE_KEY = "blog-theme";

  export type StoredTheme = "dark" | "light";

  export function isStoredTheme(value: unknown): value is StoredTheme {
    return value === "dark" || value === "light";
  }

  export function getThemeBootstrapScript() {
    return `
      (function () {
        try {
          var storedTheme = window.localStorage.getItem("${THEME_STORAGE_KEY}");
          var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          var shouldUseDark = storedTheme === "dark" || (!storedTheme && prefersDark);
          document.documentElement.classList.toggle("dark", shouldUseDark);
        } catch (_) {}
      })();
    `;
  }
  ```

- [ ] **Step 2: Verify helper tests pass**

  Run: `node --test lib/theme.test.ts`

  Expected: PASS.

## Chunk 2: Tailwind And Layout Wiring

### Task 3: Add dark variant and theme variables

**Files:**

- Modify: `app/globals.css`

- [ ] **Step 1: Add selector-based variant**

  Directly after `@import "tailwindcss";`, add:

  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```

- [ ] **Step 2: Add dark CSS variables**

  Keep existing light variables and add:

  ```css
  .dark {
    --background: #09090b;
    --foreground: #f4f4f5;
  }
  ```

- [ ] **Step 3: Keep body token-driven**

  Preserve the existing `body` use of `var(--background)` and
  `var(--foreground)`.

### Task 4: Add bootstrap script to public layout

**Files:**

- Modify: `app/(site)/layout.tsx`

- [ ] **Step 1: Import helper**

  Import `getThemeBootstrapScript` from `@/lib/theme`.

- [ ] **Step 2: Update `<html>`**

  Add `suppressHydrationWarning` to the public `<html>` element.

- [ ] **Step 3: Render early script**

  Add:

  ```tsx
  <head>
    <script dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }} />
  </head>
  ```

  Keep this in `app/(site)/layout.tsx`, not the Payload layout.

## Chunk 3: Theme Toggle

### Task 5: Add client toggle

**Files:**

- Create: `components/theme-toggle.tsx`

- [ ] **Step 1: Implement the toggle**

  ```tsx
  "use client";

  import { useEffect, useState } from "react";

  import { THEME_STORAGE_KEY } from "@/lib/theme";

  export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    }, []);

    function toggleTheme() {
      const nextIsDark = !isDark;

      document.documentElement.classList.toggle("dark", nextIsDark);
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        nextIsDark ? "dark" : "light",
      );
      setIsDark(nextIsDark);
    }

    return (
      <button
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className="border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-950 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
        onClick={toggleTheme}
        type="button"
      >
        {isDark ? "Light" : "Dark"}
      </button>
    );
  }
  ```

- [ ] **Step 2: Keep layout stable**

  Do not add animated width changes or dynamic labels longer than the existing
  button can contain.

### Task 6: Mount toggle in public header

**Files:**

- Modify: `components/site-header.tsx`

- [ ] **Step 1: Import `ThemeToggle`**

  Add `import { ThemeToggle } from "./theme-toggle";`.

- [ ] **Step 2: Add dark header classes**

  Update header/nav/link classes with `dark:` variants for borders,
  backgrounds, and text.

- [ ] **Step 3: Render the toggle**

  Render `<ThemeToggle />` at the end of the right-side nav controls.

## Chunk 4: Public Surface Styling

### Task 7: Add dark styles to pages

**Files:**

- Modify public route files listed in the File Map.

- [ ] **Step 1: Search light-only classes**

  Run:

  ```bash
  rg -n "bg-white|bg-zinc-50|bg-zinc-100|text-zinc-950|text-zinc-800|text-zinc-700|text-zinc-600|text-zinc-500|border-zinc-200|border-zinc-300" app components
  ```

- [ ] **Step 2: Update page wrappers**

  Add `dark:bg-zinc-950` or equivalent to public page wrappers currently using
  `bg-zinc-50`, and add matching text colors where needed.

- [ ] **Step 3: Update article/content surfaces**

  Add `dark:bg-zinc-900`, `dark:text-zinc-100`, `dark:text-zinc-300`, and
  `dark:border-zinc-800` variants to visible surfaces.

- [ ] **Step 4: Keep scope surgical**

  Only add theme color variants. Do not change spacing, layout, copy, routes,
  data fetching, or component boundaries.

### Task 8: Add dark styles to shared components

**Files:**

- Modify shared components listed in the File Map.

- [ ] **Step 1: Update cards and lists**

  Cover `PostCard`, `ProjectCard`, pagination, tags, and project links.

- [ ] **Step 2: Update rich text**

  Ensure headings, paragraphs, lists, links, blockquotes, and code-like content
  remain readable in dark mode.

- [ ] **Step 3: Update comments and forms**

  Ensure labels, inputs, textareas, borders, success messages, error messages,
  and disabled states remain readable.

- [ ] **Step 4: Update media placeholders**

  Add dark placeholder backgrounds where image wrappers use light `bg-zinc-100`.

## Chunk 5: Docs And Verification

### Task 9: Update README

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add manual dark-theme checklist**

  Add:

  ```md
  Dark theme path:

  1. Start `pnpm dev`.
  2. Open `/`, `/blog`, `/blog/<slug>`, `/projects`, `/about`, and `/contact`.
  3. Toggle dark mode from the public header.
  4. Refresh and verify the selected theme persists.
  5. Clear local storage and verify the system preference is used.
  6. Open `/admin` and verify Payload admin is not wrapped by the public header or toggle.
  ```

### Task 10: Run verification

- [ ] **Step 1: Run focused helper tests**

  Run: `node --test lib/theme.test.ts`

  Expected: PASS.

- [ ] **Step 2: Run related pure helper tests**

  Run:

  ```bash
  node --test lib/theme.test.ts lib/analytics.test.ts lib/revalidation.test.ts lib/rss.test.ts lib/search.test.ts lib/pagination.test.ts lib/comment-validation.test.ts lib/comment-rate-limit.test.ts lib/comment-replies.test.ts lib/site-settings.test.ts
  ```

  Expected: PASS.

- [ ] **Step 3: Lint and build**

  Run: `pnpm lint`

  Expected: PASS.

  Run: `pnpm build`

  Expected: PASS.

- [ ] **Step 4: Check diff hygiene**

  Run: `git diff --check`

  Expected: no output and exit code 0.

## Manual Smoke Checklist

- [ ] Public pages are readable in light theme.
- [ ] Public pages are readable in dark theme.
- [ ] Theme toggle works by keyboard and pointer.
- [ ] Theme preference persists after reload.
- [ ] Clearing local storage falls back to system preference.
- [ ] `/admin` remains Payload admin, without public header or theme toggle.
- [ ] Mobile and desktop viewports have no text overlap from the toggle.
