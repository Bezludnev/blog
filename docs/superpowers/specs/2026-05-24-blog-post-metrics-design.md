# Blog Post Metrics Design

Status: approved for implementation
Date: 2026-05-24
Source PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- `docs/superpowers/specs/2026-05-24-blog-vercel-analytics-design.md`
- `docs/superpowers/specs/2026-05-24-blog-revalidation-design.md`

## Goal

Add an internal post-level metrics slice for the author.

Visitor opens a published blog post -> the browser sends one lightweight view
request -> the server increments an aggregated daily `PostMetrics` document ->
the author can inspect post views in Payload admin.

This implements the PRD's optional internal `PostMetrics` model without
replacing Vercel Web Analytics or storing every page-view event as its own
document.

## Scope

Included:

- Add a `PostMetrics` Payload collection.
- Track published post views through a public POST endpoint.
- Store one aggregate document per `post + UTC date`.
- Store `views`, `uniqueViewsApprox`, `lastViewedAt`, and a hidden set of
  daily visitor hashes used only for approximate de-duplication.
- Show metrics to admins through Payload's generated collection UI.
- Add a small client-side tracker on blog post pages only.
- Add focused tests for pure metric key, date, hash, and increment helpers.
- Document the manual verification flow in README.

Excluded:

- Replacing Vercel Web Analytics or Speed Insights.
- Product analytics events beyond post views.
- Public view counters.
- Custom charting or a separate dashboard application.
- Storing raw IP addresses, raw user agents, or individual view-event
  documents.
- Tracking non-blog routes.
- Revalidation, RSS, sitemap, comments, projects, or theme changes.
- Email, notifications, Sentry, PostHog, Redis, queues, or background jobs.

## Current Project Context

The repository already has:

- Blog post pages at `app/(site)/blog/[slug]/page.tsx`.
- Published-post lookup helpers in `lib/posts.ts`.
- Payload collection patterns in `collections/Posts.ts` and
  `collections/Comments.ts`.
- Admin-only access helpers in `collections/access.ts`.
- Vercel Analytics and Speed Insights integration for site-level analytics.
- No `PostMetrics` collection and no custom post-view write endpoint.

Payload docs checked through Context7 confirm that collection configs can add
admin components and fields, relationship fields use `type: "relationship"`
with `relationTo`, and Local API calls can use `overrideAccess` for trusted
server-side writes.

## Recommended Approach

Use a minimal aggregate collection plus a small public write endpoint.

Reasons:

- It matches the PRD field model directly.
- It does not require another analytics vendor.
- It avoids writes during static/server rendering of the post page.
- It keeps the author-facing UI inside Payload admin instead of building a new
  admin dashboard surface.
- It keeps storage bounded to daily aggregate documents, not raw events.

Alternative approaches considered:

1. Only rely on Vercel Analytics: simplest, but it does not create the internal
   `PostMetrics` model from the PRD.
2. Write metrics during server render of the post page: fewer files, but it
   conflicts with cached/ISR-style rendering and can slow page responses.
3. Store every view as an event document: easier analytics later, but it is the
   wrong tradeoff for a free-first personal blog.
4. Build a custom admin dashboard view now: more polished, but Payload's
   generated collection UI is enough for the first internal metrics slice.

## Content Model

Add collection: `PostMetrics`.

Fields:

- `metricKey`: text, unique, indexed, admin read-only or hidden. Format:
  `<postId>:<YYYY-MM-DD>`.
- `post`: required relationship to `posts`, indexed.
- `date`: required text or date key in UTC day format `YYYY-MM-DD`, indexed.
- `views`: number, default `0`.
- `uniqueViewsApprox`: number, default `0`.
- `visitorHashes`: hidden array of text values used to prevent double-counting
  approximate unique views for the same post/date.
- `lastViewedAt`: date.

Access:

- Public users cannot read or write the collection directly.
- Admins can read the collection in Payload admin.
- The server endpoint writes through the Payload Local API with
  `overrideAccess`.

Admin behavior:

- Group the collection under an analytics/admin group if the local Payload
  config supports it cleanly.
- Default columns should include `post`, `date`, `views`,
  `uniqueViewsApprox`, and `lastViewedAt`.
- Manual edits are not part of the normal workflow.

## Public Endpoint

Add `POST /api/post-views`.

Input:

- `postSlug`: string.

Behavior:

1. Parse JSON safely.
2. Validate `postSlug` as a non-empty string.
3. Resolve `postSlug` to a published post.
4. Build a UTC date key.
5. Build `metricKey = post.id + ":" + dateKey`.
6. Build a daily visitor hash from `PAYLOAD_SECRET`, post ID, UTC date key,
   client IP, and user agent.
7. Find the aggregate metric document by `metricKey`.
8. Increment `views`.
9. Increment `uniqueViewsApprox` only if the visitor hash is present and has
   not already been recorded in the metric document.
10. Set `lastViewedAt`.
11. Create the metric document if it does not exist.

Status handling:

- Invalid JSON or invalid input returns `400`.
- Unknown or unpublished post returns `404`.
- Successful writes return a small JSON response.
- Unexpected errors return a generic `500`.

The endpoint should not disclose whether a draft post exists.

## Public UI

Add a small client component to the published blog post page:

`BlogPostPage` -> `PostViewTracker` -> `POST /api/post-views`.

The tracker renders nothing. It runs after hydration, so the post page can keep
its existing server-rendered content and caching behavior.

The tracker should fire once per page mount. It does not need to retry
aggressively; losing a few view increments is acceptable for approximate
internal metrics.

## Data Flow

Public view:

`/blog/[slug]` renders published post -> `PostViewTracker` mounts ->
`POST /api/post-views` -> published post lookup -> `PostMetrics` aggregate
create/update.

Admin review:

`/admin` -> `PostMetrics` collection -> author reviews daily views and
approximate unique views per post.

## Privacy And Security

- Do not store raw IP addresses.
- Do not store raw user agents.
- Do not expose metrics publicly.
- Do not track users across arbitrary routes.
- Use `PAYLOAD_SECRET` or another server secret as part of the hash input.
- Keep the hash scoped to post and day so it is useful only for daily
  de-duplication.
- Public endpoint must only record views for published posts.

## Caching And Performance

- Do not write metrics during `generateMetadata` or server component rendering.
- Do not call revalidation from view tracking.
- The metrics request should be best-effort and should not block reading the
  article.
- The aggregate document keeps storage smaller than event-per-view tracking.

## Testing And Verification

Minimum automated checks:

- Unit tests for UTC date key generation.
- Unit tests for metric key generation.
- Unit tests for visitor hash generation.
- Unit tests for view increment logic, including repeat visitor hash handling.
- `pnpm generate:types`
- `pnpm lint`
- `pnpm build`
- `git diff --check`

Manual checks:

1. Start MongoDB and `pnpm dev`.
2. Open a published post at `/blog/<slug>`.
3. Confirm a `PostMetrics` document is created for that post and UTC date.
4. Refresh the post and confirm `views` increments.
5. Confirm `uniqueViewsApprox` does not increment repeatedly for the same
   browser/IP/user-agent/day.
6. Open an unpublished or unknown slug through the API and confirm no metric is
   created.
7. Open `/admin` and confirm metrics are visible only to an authenticated admin.

## Acceptance Criteria

1. `PostMetrics` exists in Payload and generated types include it.
2. Public post pages send a best-effort view tracking request.
3. Only published posts can be tracked.
4. Metrics are aggregated by post and UTC date.
5. `views` increments on each accepted view request.
6. `uniqueViewsApprox` increments only once per visitor hash per post/date.
7. Raw IP and raw user-agent values are not stored.
8. Metrics are not rendered publicly.
9. Vercel Analytics remains unchanged.
10. `pnpm lint`, `pnpm build`, and `git diff --check` pass.

## Follow-Up Slices

Recommended later slices:

1. Custom chart view for metrics if Payload's generated collection UI is not
   enough.
2. Dark theme for the public site.
3. Manual backup/export workflow.
