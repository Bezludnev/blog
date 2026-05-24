# Blog Dark Theme Design

Status: approved for implementation
Date: 2026-05-24
Source PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- `docs/superpowers/specs/2026-05-23-blog-about-contact-design.md`
- `docs/superpowers/specs/2026-05-24-blog-discovery-rss-design.md`
- `docs/superpowers/specs/2026-05-24-blog-comment-replies-design.md`

## Goal

Add a dark theme for the public site without changing Payload admin behavior.

Visitor opens the public site -> the page uses the saved theme preference if
present, otherwise follows the system color scheme -> the visitor can switch
between light and dark from the public header.

This closes the PRD V1 dark theme item as a focused UI slice, not a redesign.

## Scope

Included:

- Add Tailwind dark variant support for a selector-based public theme.
- Add theme CSS variables for public light and dark backgrounds/text.
- Add a small theme bootstrap script to apply the saved preference before the
  page paints.
- Add a small public header theme toggle.
- Add dark styles to existing public pages and shared public components.
- Keep the current layout, content hierarchy, and route structure.
- Add focused tests for pure theme preference helpers.
- Add README manual verification notes.

Excluded:

- Payload admin theming.
- A full visual redesign.
- New content sections, animations, or marketing layout changes.
- Theme customization beyond light and dark.
- User accounts or server-stored preferences.
- Post metrics, backup/export, comments, RSS, sitemap, analytics, or
  revalidation changes.

## Current Project Context

The repository already has:

- Public site layout in `app/(site)/layout.tsx`.
- Public header in `components/site-header.tsx`.
- Global Tailwind CSS in `app/globals.css`.
- Public route group separation from Payload admin through `(site)` and
  `(payload)`.
- Mostly neutral `zinc` styling across blog, projects, comments, and forms.

Tailwind docs checked through Context7 confirm that Tailwind supports `dark:`
utilities and selector-based dark mode with:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

The implementation should use that selector-based approach so a saved user
preference can override the system preference.

## Recommended Approach

Use a class-based dark theme on the public `<html>` element.

Reasons:

- It works with Tailwind's `dark:` utilities.
- It lets a visitor override the system preference.
- It keeps the implementation inside the public route group.
- It does not require server-side user preferences or new backend data.
- It avoids touching Payload admin layout and CSS.

Alternative approaches considered:

1. System-only `prefers-color-scheme`: less JavaScript, but no manual choice.
2. Server-side cookie preference: reduces flash risk, but adds request/cookie
   handling that is not needed for this slice.
3. Full design refresh while adding dark mode: tempting, but it would make the
   diff hard to review and mixes unrelated design work into a theme slice.

## Theme Behavior

Theme source:

1. If `localStorage["blog-theme"]` is `"light"` or `"dark"`, use it.
2. If no saved preference exists, follow `prefers-color-scheme: dark`.
3. The toggle stores either `"light"` or `"dark"` in local storage.

DOM behavior:

- The public `<html>` element gets the `dark` class when dark theme is active.
- `app/(site)/layout.tsx` uses `suppressHydrationWarning` because the bootstrap
  script may update the class before React hydrates.
- The bootstrap script runs before visible content as early as possible.

The admin route is separate and should not receive the public theme toggle or
public theme script.

## Visual Direction

Keep the existing quiet personal-blog style:

- Light theme remains close to the current white/zinc look.
- Dark theme uses neutral dark backgrounds with readable zinc/slate text.
- Links and focus states remain clear.
- Comment form success and error colors keep semantic contrast.
- Cards are not restyled into nested cards.
- No gradient-orb backgrounds, decorative blobs, or hero redesigns.

The implementation should mostly add `dark:` variants and CSS variables rather
than rewrite markup.

## Public Components To Cover

Required public surfaces:

- `app/(site)/page.tsx`
- `app/(site)/about/page.tsx`
- `app/(site)/contact/page.tsx`
- `app/(site)/blog/page.tsx`
- `app/(site)/blog/[slug]/page.tsx`
- `app/(site)/tags/[slug]/page.tsx`
- `app/(site)/projects/page.tsx`
- `app/(site)/projects/[slug]/page.tsx`
- `components/site-header.tsx`
- `components/post-card.tsx`
- `components/project-card.tsx`
- `components/comments-section.tsx`
- `components/comment-form.tsx`
- `components/pagination.tsx`
- `components/rich-text.tsx`
- `components/media-image.tsx` where placeholder backgrounds are visible.

Routes such as `/rss.xml`, `/sitemap.xml`, `/robots.txt`, and `/api/*` do not
need theme changes.

## Accessibility

- Text contrast must remain readable in both themes.
- Toggle button must have an accurate `aria-label`.
- Keyboard focus states must remain visible.
- The toggle must not cause layout shift in the header.
- Forms must preserve label associations and error/success text contrast.

## Testing And Verification

Minimum automated checks:

- Unit tests for pure theme preference helpers.
- `pnpm lint`
- `pnpm build`
- `git diff --check`

Manual checks:

1. Start `pnpm dev`.
2. Open `/`, `/blog`, `/blog/<slug>`, `/projects`, `/about`, and `/contact`.
3. Toggle dark mode and confirm text, forms, cards, tags, pagination, comments,
   and rich text remain readable.
4. Reload the page and confirm the saved preference persists.
5. Clear local storage and confirm the system preference is used.
6. Open `/admin` and confirm Payload admin is not visually wrapped or affected
   by the public header toggle.
7. Check a narrow mobile viewport and a desktop viewport for text overlap.

## Acceptance Criteria

1. Public pages support light and dark themes.
2. The public theme follows system preference when no saved preference exists.
3. The visitor can switch between light and dark themes.
4. The selected theme persists in local storage.
5. Payload admin is not themed by this slice.
6. Existing public layout and content structure remain unchanged.
7. Text and form controls remain readable in both themes.
8. `pnpm lint`, `pnpm build`, and `git diff --check` pass.

## Follow-Up Slices

Recommended later slices:

1. Manual backup/export workflow.
2. Custom post metrics charts if the basic Payload metrics collection is not
   enough.
3. Optional theme polish after real content is loaded.
