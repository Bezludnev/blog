# Blog Pagination Design

Status: approved for implementation
Date: 2026-05-24
Source PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-24-blog-discovery-rss-design.md`
- `docs/superpowers/specs/2026-05-24-blog-revalidation-design.md`

## Goal

Add simple URL-based pagination to the public blog discovery pages.

Reader opens `/blog?page=2` or `/tags/<slug>?page=2` -> the server renders the
requested published-post page -> pagination links preserve the current search
query where applicable.

This closes the PRD requirement that the blog list supports pagination without
adding infinite scroll, client-side state, or a new search backend.

## Scope

Included:

- Add pagination to `/blog` with the `page` query parameter.
- Preserve the existing `/blog?q=<term>` search behavior across pagination
  links.
- Add pagination to `/tags/[slug]`.
- Add pure helpers for page normalization, small in-memory result slicing, page
  range checks, and pagination URL construction.
- Add a small shared pagination component for Previous/Next navigation.
- Keep published-post filtering on all public list queries.
- Add focused unit tests and README verification notes.

Excluded:

- Infinite scroll or "load more" client behavior.
- Numbered pagination windows beyond Previous/Next plus current page text.
- Changing the Payload schema or generated types.
- MongoDB full-text indexes or a search service.
- Project pagination.
- RSS pagination.
- Comment, analytics, revalidation, theme, or admin dashboard changes.

## Current Project Context

The repository already has:

- `/blog` with `q` search through `searchParams`.
- `/tags/[slug]` archive pages.
- `lib/posts.ts` helpers for published posts, tag lookup, tag archives, and RSS.
- `lib/search.ts` pure helpers for query normalization and in-memory post
  matching.
- `PostCard` for list rows.
- ISR-style `revalidate = 3600` on CMS-backed public routes.

The gap is that `/blog` and `/tags/[slug]` currently render all matching
published posts. `getPublishedPosts()` also has another caller in
`app/(site)/sitemap.ts`, so the existing all-posts helper should remain
available for sitemap generation.

## Recommended Approach

Use URL pagination with `?page=<number>`.

Reasons:

- It is shareable and works with server-rendered App Router pages.
- It keeps SEO and browser navigation straightforward.
- It avoids extra client JavaScript.
- It maps directly to Payload Local API pagination for normal list queries.

Alternative approaches considered:

1. Cursor or "load more" pagination: better for feeds with frequent writes, but
   unnecessary for a small personal blog and adds client-side behavior.
2. Only limit the list without navigation: simpler, but does not satisfy the PRD
   pagination requirement.

## Route Behavior

### `/blog`

Accepted query params:

- `q`: existing search query.
- `page`: optional positive integer; invalid values normalize to `1`.

Behavior:

- `/blog` and `/blog?page=1` show the first page.
- `/blog?page=2` shows the second page.
- `/blog?q=payload&page=2` searches first, then paginates the matching results.
- Invalid page values such as `0`, `-1`, `abc`, empty string, and decimals
  normalize to `1`.
- If there are no matching posts, page `1` renders the existing empty state.
- If the requested page is greater than the available page count, render
  `notFound()`. This keeps stale or nonsensical deep page URLs out of normal
  list UI.

### `/tags/[slug]`

Accepted query params:

- `page`: optional positive integer; invalid values normalize to `1`.

Behavior:

- Unknown tag slugs continue to render `notFound()`.
- Existing tags with no published posts render an empty state on page `1`.
- Existing tags with no published posts render `notFound()` for page `2+`.
- Existing tags with published posts render `notFound()` when `page` exceeds
  the available page count.

## Query Design

Use two query paths:

1. Normal `/blog` without `q` and tag archives use Payload Local API pagination:
   `limit`, `page`, `totalDocs`, `totalPages`, `hasPrevPage`, and
   `hasNextPage`.
2. `/blog?q=...` keeps the existing TypeScript search over title, excerpt, and
   Lexical rich-text content. To keep counts correct, fetch the published set,
   filter in memory, then slice the filtered result for the requested page.

The in-memory search path is an intentional MVP tradeoff. Applying Payload
pagination before the TypeScript search would search only one database page and
produce incorrect totals and missing matches. Adding MongoDB full-text search is
larger than this slice and can remain a follow-up if the blog grows.

Default page size: `10` posts per page. Keep it as a code constant, not an
environment variable.

## Components

### `lib/pagination.ts`

Pure helpers:

- Normalize `page` from `string | string[] | undefined`.
- Slice an already-filtered array into a Payload-like pagination result.
- Detect out-of-range pages.
- Build pagination hrefs while preserving `q` and omitting `page=1`.

### `components/pagination.tsx`

Server component that renders:

- Previous link when `hasPrevPage` is true.
- Current page text, for example `Page 2 of 4`.
- Next link when `hasNextPage` is true.

It should return `null` for one-page or empty result sets. It should use the
existing restrained visual style and avoid adding icon or UI dependencies.

## Data Flow

Blog list:

Browser opens `/blog?q=payload&page=2` -> page awaits `searchParams` -> normalize
`q` and `page` -> `lib/posts.ts` returns a paginated published-post result ->
page checks out-of-range state -> render `PostCard` rows and pagination links.

Tag archive:

Browser opens `/tags/payload?page=2` -> page resolves tag by slug -> normalize
`page` -> `lib/posts.ts` returns paginated published posts for the tag -> page
checks out-of-range state -> render rows and pagination links.

## Error Handling

- Invalid page input normalizes to page `1`.
- Unknown tag slugs use `notFound()`.
- Out-of-range positive pages use `notFound()`.
- Empty first pages render normal empty states.
- Pagination hrefs must not produce duplicate or empty query params.

## Security And Privacy

- No new public write endpoint is added.
- Query params are normalized as numbers or escaped React text.
- Public list queries must keep `status = published`.
- Draft and archived posts must remain excluded from `/blog`, search results,
  and tag archives.

## SEO And Caching

- Pagination URLs are normal URLs and can be shared.
- The page should omit `page=1` from generated pagination hrefs to avoid
  duplicate first-page links.
- Existing metadata can remain simple. Do not add canonical or robots behavior
  in this slice unless implementation discovers a direct Next.js requirement.
- Keep the existing route cache mode; this slice should not alter revalidation
  hooks or route revalidation constants.

## Testing And Verification

Minimum automated checks:

- Unit tests for page normalization.
- Unit tests for in-memory array pagination.
- Unit tests for out-of-range page detection.
- Unit tests for pagination href construction, including `q` preservation.
- Existing search tests still pass.
- `pnpm lint`
- `pnpm build`
- `git diff --check`

Manual checks:

1. Start MongoDB and `pnpm dev`.
2. Create more than 10 published posts.
3. Open `/blog` and verify the first page renders no more than 10 posts.
4. Open `/blog?page=2` and verify the next set renders.
5. Open `/blog?q=<term>&page=2` where the search has more than 10 matches and
   verify the search query is preserved in pagination links.
6. Open `/blog?page=999` and verify 404 behavior.
7. Open `/tags/<slug>?page=2` for a tag with more than 10 published posts and
   verify pagination.
8. Open `/tags/<slug>?page=999` and verify 404 behavior.

## Acceptance Criteria

This slice is done when:

1. `/blog` supports URL pagination through `?page=`.
2. `/blog?q=<term>` keeps search results correct and paginates after filtering.
3. `/tags/[slug]` supports URL pagination through `?page=`.
4. Invalid page values normalize to page `1`.
5. Out-of-range positive pages render `notFound()`.
6. Pagination links preserve `q` on `/blog` and omit `page=1`.
7. Draft and archived posts do not appear on any paginated public list.
8. No new collection, schema field, generated type change, search service,
   dashboard, theme change, or comment behavior change is added.
9. `node --test lib/pagination.test.ts lib/search.test.ts`, `pnpm lint`,
   `pnpm build`, and `git diff --check` pass.

## Follow-Up Slices

Recommended later slices:

1. Comment replies with `parentComment` and two-level rendering.
2. Internal post metrics dashboard.
3. Dark theme.
4. Manual backup/export workflow.
