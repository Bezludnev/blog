# Blog Discovery And RSS Design

Status: draft for review
Date: 2026-05-24
Source PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- `docs/superpowers/specs/2026-05-23-blog-about-contact-design.md`
- `docs/superpowers/specs/2026-05-23-blog-comments-design.md`

## Goal

Add the missing blog discovery and feed surface from the PRD:

Reader opens `/blog` -> searches published posts or follows a tag -> opens a filtered tag page -> external feed readers can subscribe through `/rss.xml`.

This slice improves navigation and SEO without introducing a search service, analytics storage, or new CMS collections.

## Scope

Included:

- Add `/tags/[slug]` public pages.
- Add search on `/blog` through the `q` query parameter.
- Add `/rss.xml` route handler.
- Add reusable post query helpers for tag filtering, search, and RSS.
- Link post tags to `/tags/[slug]` where tags are rendered.
- Add RSS discovery metadata where appropriate.
- Add manual verification notes to README.

Excluded:

- MongoDB full-text indexes.
- External search services such as Algolia or Meilisearch.
- Client-side autocomplete.
- Separate search API route.
- Search across projects or static pages.
- Analytics, post metrics dashboard, or view counters.
- Dark theme.
- New Payload collections or fields.

## Current Project Context

The repository already has:

- `Posts` with `title`, `slug`, `excerpt`, `content`, `status`, `tags`, `publishedAt`, SEO fields, and comments integration.
- `Tags` with `name`, `slug`, and `description`.
- Public blog pages under `app/(site)/blog`.
- `PostCard` for published post lists.
- SEO helpers in `lib/seo.ts`.
- `sitemap.ts` and `robots.ts`.

This slice should reuse the existing Payload data model. It should not change Payload config or regenerate types unless implementation discovers a real type mismatch.

## Public Routes

### `/blog`

Purpose: list published posts and allow simple server-side filtering.

Acceptance:

- Supports `?q=<term>`.
- Empty or whitespace-only `q` renders the normal published post list.
- Non-empty `q` filters published posts by title, excerpt, or rich-text content.
- Draft and archived posts never appear.
- The page shows the active query and a clear empty state when no posts match.
- Search form uses GET so results have shareable URLs.
- Existing `/blog` behavior remains when no query is provided.

### `/tags/[slug]`

Purpose: provide a public archive page for each tag.

Acceptance:

- Looks up the tag by slug.
- Returns `notFound()` when the tag does not exist.
- Lists only published posts attached to that tag.
- Shows tag name and description when present.
- Shows a useful empty state when the tag exists but has no published posts.
- Has metadata title and description.
- Tags rendered on post cards and post pages link to this route.

### `/rss.xml`

Purpose: expose published posts to RSS readers and external discovery tools.

Acceptance:

- Returns XML with `Content-Type` compatible with RSS.
- Includes feed title, link, description, language, and last build date.
- Includes only published posts.
- Each item includes title, absolute link, guid, description or excerpt, and pubDate when available.
- XML values are escaped.
- Uses `NEXT_PUBLIC_SITE_URL` through `absoluteUrl()`.

## Query Design

Keep query logic server-side and simple:

- `getPublishedPosts(query?: string)` returns published posts sorted by `publishedAt` descending.
- When `query` exists, fetch published posts and filter in TypeScript across `title`, `excerpt`, and text extracted from the Lexical rich-text `content`.
- This avoids depending on fragile MongoDB field paths for rich-text search and is acceptable for a free-first personal blog.
- `getTagBySlug(slug)` returns the tag or `undefined`.
- `getPublishedPostsByTagId(tagId)` queries posts whose `tags` relationship contains that tag id after the page resolves the tag by slug.
- `getRecentPublishedPostsForFeed(limit)` returns a bounded list for RSS, for example the latest 20 posts.

Do not add a public API endpoint. App Router server components and route handlers can call these helpers directly.

## Data Flow

Blog search:

Browser submits `/blog?q=payload` -> `app/(site)/blog/page.tsx` reads `searchParams` -> `lib/posts.ts` queries Payload -> page renders matching `PostCard` rows.

Tag page:

Browser opens `/tags/payload` -> `app/(site)/tags/[slug]/page.tsx` resolves tag -> `lib/posts.ts` queries posts by relationship -> page renders tag archive.

RSS:

Feed reader opens `/rss.xml` -> route handler queries recent published posts -> builds escaped RSS XML -> returns response.

## Error Handling

- Invalid or unknown tag slug should use `notFound()`.
- Empty search results should render a normal empty state, not 404.
- Missing optional tag descriptions should be omitted.
- Missing post `publishedAt` should not crash RSS; omit `pubDate` or use a safe fallback.
- XML generation must escape user-authored title, excerpt, description, and URL values.

## Security And Privacy

- No public write endpoint is added.
- Search input is only used as query text through Payload APIs and rendered as escaped React text.
- RSS XML must escape content to avoid malformed feeds.
- Draft and archived posts must remain excluded from all public discovery surfaces.

## SEO And Discovery

- `/blog` should expose RSS discovery through metadata alternates if supported cleanly by Next metadata.
- `/tags/[slug]` should have tag-specific title and description.
- `/rss.xml` should use absolute canonical post links.
- Existing sitemap automation remains for HTML pages. RSS is available as a feed endpoint rather than a sitemap HTML URL.

## Testing And Verification

Minimum automated checks:

- Unit test XML escaping and RSS item rendering if RSS builder is factored into a pure helper.
- Unit test search query normalization if implemented as a pure helper.
- `pnpm lint`
- `pnpm build`
- `git diff --check`

Manual checks:

1. Start MongoDB and Next.js.
2. Create two published posts and one draft with different titles, excerpts, content, and tags.
3. Open `/blog` and confirm only published posts render.
4. Open `/blog?q=<published term>` and confirm matching published posts render.
5. Open `/blog?q=<draft-only term>` and confirm the draft is not shown.
6. Open `/tags/<existing-slug>` and confirm only published posts for that tag render.
7. Open `/tags/<missing-slug>` and confirm 404 behavior.
8. Open `/rss.xml` and confirm valid XML with absolute post URLs.

## Acceptance Criteria

This slice is done when:

1. `/blog?q=term` filters published posts by simple server-side search.
2. `/tags/[slug]` exists and lists published posts for an existing tag.
3. Unknown tag slugs return 404.
4. Tags rendered on public post surfaces link to `/tags/[slug]`.
5. `/rss.xml` returns escaped RSS XML for published posts only.
6. Draft and archived posts do not appear in search, tag pages, or RSS.
7. No new search service, API route, collection, analytics, or dashboard is added.
8. `node --test` helper checks, `pnpm lint`, and `pnpm build` pass.

## Follow-Up Slices

Recommended later slices:

1. Vercel Web Analytics and Speed Insights.
2. Internal post metrics dashboard.
3. Dark theme.
4. Improved anti-spam for comments.
5. Optional richer search if simple Payload queries are not enough.
