# Blog Projects / Portfolio Slice Design

Status: draft for review
Date: 2026-05-23
Source PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- `docs/superpowers/specs/2026-05-23-blog-media-storage-design.md`

## Goal

Add the portfolio/project section promised by the PRD, managed through PayloadCMS and rendered publicly in Next.js.

This slice proves the project path:

Admin creates and publishes a project -> public visitor opens `/projects` -> visitor opens `/projects/[slug]` -> recruiter can inspect project summary, stack, links, and cover image.

## Scope

Included:

- Add a `Projects` Payload collection.
- Allow admins to create, edit, publish, archive, and delete projects.
- Publicly expose only published projects.
- Add `/projects` list page.
- Add `/projects/[slug]` detail page.
- Add project links to the site header and home page.
- Reuse existing `Media` / `MediaImage` for project cover images.
- Add project URLs to `sitemap.ts`.
- Add project page metadata and Open Graph image metadata when cover image exists.
- Regenerate Payload types/import map.

Excluded:

- Comments on projects.
- Project search/filtering.
- Tag pages.
- Case-study templates with multiple sections/screenshots.
- GitHub API integration.
- Runtime fetching of repository stars/languages.
- Contact form.
- Analytics and post/project metrics.
- Broad visual redesign.

## Current Project Context

The repository already has the foundation and media slices in progress/implemented:

- Payload config imports `Users`, `Media`, `Tags`, and `Posts`.
- `Media` has image-only upload settings and Blob storage configuration through Payload.
- `MediaImage` can render any resolved Payload `Media` object.
- Public site routes live under `app/(site)`.
- Blog data helpers live under `lib/`.
- `publishedOrAdmin` already implements the access pattern needed for public `status = published` reads.
- `sitemap.ts` already collects dynamic post URLs.

The Projects slice should follow these existing patterns instead of introducing a new content layer.

## Content Model

### Projects Collection

Slug: `projects`

Purpose: portfolio entries for public résumé value.

Fields:

- `title`: text, required.
- `slug`: text, required, unique, indexed.
- `summary`: textarea, required. Short card/list description.
- `description`: rich text, required. Detail page body.
- `stack`: array of text items, optional. Technologies/tools used.
- `repositoryUrl`: text, optional.
- `demoUrl`: text, optional.
- `coverImage`: upload relationship to `media`, optional.
- `featured`: checkbox, default `false`.
- `sortOrder`: number, default `100`.
- `status`: select `draft | published | archived`, default `draft`.
- `publishedAt`: date, optional.
- `seoTitle`: text, optional.
- `seoDescription`: textarea, optional.

Access:

- Public read: only `status = published`.
- Admin read: all statuses.
- Create/update/delete: admin only.

Sorting:

- Project list should sort by:
  1. `sortOrder` ascending.
  2. `publishedAt` descending as a secondary preference where practical.

The exact Payload sort expression may be one sort string or a simple query plus JS sorting if Payload's sort syntax is awkward. Keep this simple.

## Public Routes

### `/projects`

Portfolio index page.

Acceptance:

- Displays published projects only.
- Shows empty state if no projects are published.
- Each project card shows title, summary, stack, cover image when present, and links to detail page.
- External demo/repository links may be visible on the card when present, but the main title/card link goes to `/projects/[slug]`.
- Draft and archived projects are not listed.

### `/projects/[slug]`

Project detail page.

Acceptance:

- Published project renders by slug.
- Draft, archived, and unknown slugs return `notFound()`.
- Shows title, summary, cover image when present, stack, repository/demo links, and rich text description.
- Metadata uses `seoTitle`/`seoDescription` when present, otherwise falls back to title/summary.
- Open Graph image uses cover image URL when available.

### Home Page

The home page should link clearly to `/projects`.

Acceptance:

- Existing blog CTA remains.
- A projects CTA is added.
- No project data fetch is required on home in this slice; avoid widening the first portfolio step unless implementation remains trivial.

### Header

Site header should include `Projects`.

Acceptance:

- Header links: `Projects`, `Blog`, `Admin`.
- Admin stays available but public navigation is not moved into Payload admin layout.

### Sitemap

Acceptance:

- Includes `/projects`.
- Includes published project detail URLs.
- Draft/archived projects are excluded.

## Data Flow

Admin path:

`/admin` -> Payload Projects collection -> MongoDB -> optional cover image from Media/Blob.

Public path:

`app/(site)/projects/page.tsx` or `app/(site)/projects/[slug]/page.tsx` -> `lib/projects.ts` -> Payload Local API -> MongoDB -> resolved `Media` cover image -> `MediaImage`.

## Error Handling

- Missing optional cover image should not throw.
- Missing optional external links should simply omit link buttons.
- Missing project should use `notFound()`.
- Draft/archived project should use `notFound()` publicly.
- Project cards should render even if `stack` is empty.

## Testing And Verification

Minimum automated checks:

- `pnpm generate:importmap`
- `pnpm generate:types`
- `pnpm lint`
- `pnpm build`

Manual happy path:

1. Start local MongoDB and Next.js.
2. Open `/admin`.
3. Create one published project with slug, summary, description, stack, and optional cover image.
4. Create one draft project.
5. Open `/projects`.
6. Confirm only the published project appears.
7. Open `/projects/<slug>`.
8. Confirm the project detail page renders.
9. Open the draft project slug and confirm 404.
10. Open sitemap and confirm published project URL appears.

## Acceptance Criteria

This slice is done when:

1. `Projects` collection exists in Payload admin.
2. Admins can create/edit/publish/archive/delete projects.
3. Public readers only see published projects.
4. `/projects` lists published projects.
5. `/projects/[slug]` renders published projects.
6. Draft and archived projects are hidden publicly and return 404 by slug.
7. Project cover images render using existing media support.
8. Header and home page link to `/projects`.
9. Sitemap includes published projects.
10. `pnpm lint` and `pnpm build` pass.

## Follow-Up Slices

Recommended next slices after Projects:

1. Comments collection, public comment endpoint, moderation flow, and anti-spam.
2. RSS and tag pages.
3. About/contact pages.
4. Vercel Web Analytics, Speed Insights, and optional metrics.
5. Project search/filtering and richer case-study content.

