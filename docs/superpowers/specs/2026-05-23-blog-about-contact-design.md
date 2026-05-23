# Blog About And Contact Pages Design

Status: draft for review
Date: 2026-05-23
Source PRD: `docs/_MConverter.eu_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- `docs/superpowers/specs/2026-05-23-blog-projects-design.md`
- `docs/superpowers/specs/2026-05-23-blog-comments-design.md`

## Goal

Add the profile and contact pages required for the portfolio MVP.

This slice proves the PRD path:

Recruiter opens the site -> reads author positioning on `/about` -> sees stack/profile/contact links -> opens `/contact` -> can contact the author without a paid email service.

## Scope

Included:

- Add `/about` public page.
- Add `/contact` public page.
- Reuse the existing `SiteSettings` Payload global for profile and contact content.
- Add a small site settings helper in `lib/site-settings.ts`.
- Add About and Contact links to the site header.
- Add About and Contact calls to action on the home page.
- Add `/about` and `/contact` to sitemap.
- Add page metadata.
- Add a README manual verification note.

Excluded:

- Contact form.
- `ContactMessages` collection.
- Email sending or notifications.
- CAPTCHA or rate limiting.
- New external services.
- Rich profile CMS sections beyond the existing `SiteSettings` fields.
- Broad home page or visual redesign.

## Current Project Context

The repository already has:

- Next.js public routes under `app/(site)`.
- Payload Local API helper in `lib/payload.ts`.
- `SiteSettings` global with `name`, `headline`, `bio`, `contactEmail`, `socialLinks`, `seoTitle`, and `seoDescription`.
- Existing public pages using simple server components and Tailwind.
- Existing `SiteHeader` and `sitemap.ts`.

This slice should keep the implementation simple and use the existing `SiteSettings` global instead of adding another content model.

## Content Model

No new collection or global is needed.

Use existing `SiteSettings` fields:

- `name`: displayed as site/person identity fallback.
- `headline`: displayed as primary positioning.
- `bio`: displayed on `/about` as the profile narrative.
- `contactEmail`: used to render a `mailto:` link on `/contact`.
- `socialLinks`: rendered on both pages when present.
- `seoTitle`: optional metadata title fallback.
- `seoDescription`: optional metadata description fallback.

If fields are empty, public pages should render sensible static fallback copy rather than crashing.

## Public Routes

### `/about`

Purpose: give recruiters and readers enough context to understand the author's profile.

Acceptance:

- Renders a clear page title.
- Shows `SiteSettings.headline`.
- Shows `SiteSettings.bio` when present.
- Shows a compact fallback paragraph when `bio` is empty.
- Shows social links when configured.
- Links to `/projects`, `/blog`, and `/contact`.
- Has metadata title and description.

### `/contact`

Purpose: provide a free-first contact path without introducing public write storage.

Acceptance:

- Renders a clear page title.
- Shows `mailto:` link when `contactEmail` is configured.
- Shows social links when configured.
- Shows a useful fallback when no contact email exists.
- Links back to `/about` and `/projects`.
- Has metadata title and description.

### Home Page

Acceptance:

- Existing Blog, Projects, and Admin links remain.
- Add links to `/about` and `/contact`.
- No extra CMS fetch is required on the home page for this slice.

### Header

Acceptance:

- Header includes `About`, `Projects`, `Blog`, `Contact`, and `Admin`.
- Keep styling consistent with the existing header.

### Sitemap

Acceptance:

- Includes `/about`.
- Includes `/contact`.
- Existing post and project URLs remain.

## Data Flow

Admin path:

`/admin` -> Payload SiteSettings global -> MongoDB.

Public path:

`app/(site)/about/page.tsx` or `app/(site)/contact/page.tsx` -> `lib/site-settings.ts` -> Payload Local API -> MongoDB -> rendered server page.

## Error Handling

- Missing `bio` should render fallback profile copy.
- Missing `contactEmail` should omit the `mailto:` link and explain that social links are the available contact path.
- Missing `socialLinks` should omit the links section.
- Missing or partially configured SiteSettings should not throw.

## Security And Privacy

- Do not add a public write endpoint in this slice.
- Do not collect visitor messages or personal data.
- `mailto:` exposes the configured public contact address intentionally; if the admin leaves it empty, no email is shown.
- External social links should use `rel="noreferrer"` and open in a new tab.

## Testing And Verification

Minimum automated checks:

- `pnpm lint`
- `pnpm build`
- `git diff --check`

Manual checks:

1. Start MongoDB and Next.js.
2. Open `/admin` and update `SiteSettings` headline, bio, contact email, and social links.
3. Open `/about` and confirm the profile content renders.
4. Open `/contact` and confirm the `mailto:` link and social links render.
5. Open `/sitemap.xml` and confirm `/about` and `/contact` are present.
6. Clear optional `bio` and `contactEmail` locally if practical, then confirm pages still render fallback content.

## Acceptance Criteria

This slice is done when:

1. `/about` exists and renders from `SiteSettings`.
2. `/contact` exists and renders contact email/social links from `SiteSettings`.
3. Empty optional SiteSettings fields do not break public pages.
4. Header and home page link to About and Contact.
5. Sitemap includes `/about` and `/contact`.
6. No contact form or public write endpoint is introduced.
7. `pnpm lint` and `pnpm build` pass.

## Follow-Up Slices

Recommended later slices:

1. Contact form with `ContactMessages` collection and anti-spam if the static contact path is not enough.
2. RSS feed.
3. Tag pages and blog search.
4. Vercel Web Analytics and Speed Insights.
5. Internal post metrics dashboard.
