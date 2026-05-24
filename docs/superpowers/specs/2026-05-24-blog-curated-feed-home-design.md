# Blog Curated Feed And CMS Home Design

Status: approved for implementation
Date: 2026-05-24
Source PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- `docs/superpowers/specs/2026-05-23-blog-projects-design.md`
- `docs/superpowers/specs/2026-05-23-blog-about-contact-design.md`
- `docs/superpowers/specs/2026-05-24-blog-pagination-design.md`
- `docs/superpowers/specs/2026-05-24-blog-revalidation-design.md`
- `docs/superpowers/specs/2026-05-24-blog-dark-theme-design.md`

## Goal

Make the home page feel current and add a separate curated feed for interesting
articles, videos, tools, repositories, and other external materials.

Admin creates a curated link in Payload -> public visitor opens `/feed` ->
visitor sees a chronological feed of published external materials -> home page
also shows the latest curated links next to recent posts and featured projects.

This extends the portfolio/blog into a living personal knowledge feed without
mixing external links with full blog posts.

## Scope

Included:

- Add a `CuratedLinks` Payload collection.
- Add a public `/feed` page with published curated links.
- Add a card component for curated feed items.
- Add library helpers for curated link type labels and safe external URL
  validation.
- Add data helpers for published curated links.
- Add curated link revalidation hooks for `/feed`, `/`, and `/sitemap.xml`.
- Update the home page to render data from `SiteSettings`, recent blog posts,
  featured projects, and recent curated links.
- Add a `Feed` link to the public header.
- Add `/feed` to sitemap.
- Add focused unit tests for pure curated link helpers and revalidation paths.
- Document the manual verification flow in README.

Excluded:

- URL scraping, Open Graph preview fetching, or automatic metadata import.
- Embedded video player.
- Separate detail pages such as `/feed/[slug]`.
- Comments, likes, saves, bookmarks, or voting for feed items.
- Merging curated links into the blog post collection.
- Adding curated links to the existing blog RSS feed.
- Email notifications, Sentry, PostHog, custom domain, backups, or comment
  model changes.
- Public write endpoints.
- Payload admin customization beyond the generated collection UI.

## Current Project Context

The repository already has:

- Static home page at `app/(site)/page.tsx`.
- Blog list and post pages under `app/(site)/blog`.
- Project list and detail pages under `app/(site)/projects`.
- Reusable public header in `components/site-header.tsx`.
- Card patterns in `components/post-card.tsx` and `components/project-card.tsx`.
- `SiteSettings` global with `name`, `headline`, `bio`, `contactEmail`,
  `socialLinks`, `seoTitle`, and `seoDescription`.
- Shared pagination helpers and a `Pagination` component.
- Revalidation helpers in `lib/revalidation.ts` and Payload hooks in
  `lib/payload-revalidation.ts`.
- Public route group `(site)` and Payload route group `(payload)`.

The current home page is hardcoded. It does not yet show recent content or
curated external materials.

## Recommended Approach

Use a separate `CuratedLinks` collection and make home a lightweight server
component aggregator.

Reasons:

- Curated external materials are not the same content type as long-form blog
  posts.
- A separate collection keeps admin editing simple: title, URL, source, type,
  summary, personal note, tags, status, and publication date.
- The first public version only needs a list page, so there is no routing or SEO
  complexity for individual feed items.
- Home can reuse existing public data helpers instead of introducing a new
  layout system or frontend framework.

Alternative approaches considered:

1. Add `type = post/news` to `Posts`: fewer collection files, but it mixes
   authored posts with external recommendations and makes blog filtering more
   complicated.
2. Store feed items as short blog posts: simple editorially, but poor for
   external articles and videos because URL/source/type become awkward content
   fields.
3. Build full news pages with embeds and scraped previews now: more polished,
   but it adds external network behavior and failure modes that are not needed
   for the first curated feed slice.

## Content Model

Add collection: `CuratedLinks`.

Fields:

- `title`: required text.
- `slug`: required unique text, indexed. Kept for admin stability and future
  detail pages, but no public detail route is added in this slice.
- `url`: required text. Must be an `http` or `https` URL.
- `source`: optional text, for example `YouTube`, `GitHub`, `Martin Fowler`,
  or the publication name.
- `type`: required select with `article`, `video`, `tool`, `repo`, and `other`.
- `summary`: required textarea with a short public description.
- `note`: optional textarea for the author's personal note.
- `tags`: optional relationship to existing `tags`, many.
- `status`: required select with `draft`, `published`, and `archived`.
- `publishedAt`: date.
- `featured`: checkbox, default `false`.
- `sortOrder`: number, default `100`, used to order featured items on home.
- `seoTitle`: optional text for future detail pages.
- `seoDescription`: optional textarea for future detail pages.

Access:

- Admins can create, update, and delete curated links.
- Public users can read only published curated links through the existing
  `publishedOrAdmin` access pattern.
- No public create/update/delete route is added.

Admin behavior:

- Use Payload's generated collection UI.
- Default columns should include `title`, `type`, `source`, `status`,
  `featured`, `publishedAt`, and `updatedAt`.
- Searchable fields should include `title`, `url`, `source`, and `summary`.

## Public Feed Page

Add route: `/feed`.

The page shows published curated links in reverse publication order. Each item
shows:

- Type label.
- Title.
- Source.
- Published date.
- Summary.
- Personal note when present.
- Tags when present.
- External link.

The page supports pagination using the existing `Pagination` component and a
curated-feed-specific page size constant. Search and type filters are deferred.

Unknown or out-of-range page numbers should follow the existing blog pagination
behavior and return `404`.

## CMS-Driven Home Page

Update `/` from a static page to a server-rendered public page backed by CMS
data.

Home sections:

1. Hero:
   - Uses `SiteSettings.name`, `SiteSettings.headline`, and
     `SiteSettings.bio` with existing fallback helpers.
   - Keeps the existing quiet blog/portfolio visual style.
2. Recent posts:
   - Shows the latest published posts.
   - Links to `/blog`.
3. Featured projects:
   - Shows published projects with `featured = true`, ordered by
     `sortOrder` and publication date fallback.
   - Links to `/projects`.
4. From the feed:
   - Shows the latest published curated links.
   - Links to `/feed`.

The home page should remain a usable first screen, not a marketing landing
page. It should not wrap Payload admin or move the public shell into
`app/layout.tsx`.

## Navigation And Discovery

- Add `Feed` to `components/site-header.tsx`.
- Add `/feed` to `app/(site)/sitemap.ts`.
- Do not add curated links to `/rss.xml` in this slice. The current RSS feed
  remains a blog-post feed.
- Do not add feed detail URLs to sitemap because this slice has no public feed
  detail pages.

## Revalidation

Curated link changes should revalidate:

- `/feed`
- `/`
- `/sitemap.xml`

Because home now depends on recent posts and featured projects, post and project
changes should also revalidate `/`.

Site settings already revalidate `/`, `/about`, `/contact`, and `/sitemap.xml`.

## Privacy And Security

- Curated links are admin-created only.
- External URLs must be validated as `http` or `https`.
- Public pages should use safe external-link attributes:
  `target="_blank"` and `rel="noreferrer"`.
- No visitor data is collected by the feed itself.
- No raw external page content is fetched or stored automatically.

## Visual Direction

Keep the current restrained public UI:

- Neutral light/dark theme.
- Text-first cards or rows, not decorative marketing panels.
- No nested cards.
- No gradient/orb decorations.
- Feed items should be easy to scan repeatedly.

The implementation should reuse existing spacing, border, typography, and dark
theme patterns from `PostCard`, `ProjectCard`, blog list, and projects list.

## Testing And Verification

Minimum automated checks:

- Unit tests for curated link type validation and labels.
- Unit tests for external URL validation.
- Unit tests for revalidation paths, including `/` for posts/projects and
  curated feed paths.
- `pnpm generate:types`
- `pnpm lint`
- `pnpm build`
- `git diff --check`

Manual checks:

1. Create a curated link in `/admin` with `status=draft`.
2. Confirm the draft item does not appear on `/feed` or `/`.
3. Publish the curated link.
4. Confirm it appears on `/feed`.
5. Confirm recent curated links appear on `/`.
6. Confirm featured projects and recent posts still render on `/`.
7. Confirm `/sitemap.xml` contains `/feed`.
8. Confirm header navigation includes `Feed`.
9. Confirm dark theme remains readable on `/` and `/feed`.
10. Confirm `/admin` is not wrapped by public header or feed UI.

## Acceptance Criteria

1. `CuratedLinks` exists in Payload and generated types include it.
2. Admins can create, edit, publish, archive, and delete curated links.
3. Public users only see published curated links.
4. `/feed` lists published curated links with type, source, summary, note,
   tags, date, and external link.
5. `/feed` supports pagination and returns `404` for out-of-range pages.
6. `/` uses `SiteSettings` plus recent posts, featured projects, and recent
   curated links.
7. Header includes `Feed`.
8. Sitemap includes `/feed`.
9. Curated link, post, project, and site settings changes revalidate affected
   public pages.
10. No URL scraping, embed player, public feed write endpoint, blog RSS mixing,
    or feed detail page is added.
11. `pnpm lint`, `pnpm build`, and `git diff --check` pass.

## Follow-Up Slices

Recommended later slices:

1. Feed search and type filters.
2. Optional `/feed/[slug]` detail pages if curated notes become long-form.
3. Optional URL metadata import if manual entry becomes repetitive.
4. SEO hardening with canonical URLs and site-wide metadata defaults.
