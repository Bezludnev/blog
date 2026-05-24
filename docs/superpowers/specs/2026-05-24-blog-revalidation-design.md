# Blog Revalidation Design

Status: approved for implementation
Date: 2026-05-24
Source PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- `docs/superpowers/specs/2026-05-23-blog-comments-design.md`
- `docs/superpowers/specs/2026-05-24-blog-discovery-rss-design.md`
- `docs/superpowers/specs/2026-05-24-blog-comment-anti-spam-design.md`

## Goal

Add a predictable content revalidation path for CMS-backed public pages.

This slice proves the PRD path:

Author edits or publishes content in Payload -> relevant public pages, RSS, and sitemap are invalidated -> the next visitor sees fresh content without making every CMS-backed route fully dynamic.

## Scope

Included:

- Add `REVALIDATION_SECRET`.
- Add a protected `POST /api/revalidate` route for manual or external revalidation.
- Add pure helper logic that maps content changes to known public paths.
- Add Payload hooks for posts, projects, comments, and site settings.
- Replace `dynamic = "force-dynamic"` with ISR-style `revalidate = 3600` on CMS-backed public routes where revalidation should have an effect.
- Document the local and Vercel setup.
- Add focused unit tests for pure revalidation mapping.

Excluded:

- Webhook integration with an external CMS.
- A generic arbitrary-path revalidation API.
- Product analytics, `PostMetrics`, or view counters.
- Dark theme or UI redesign.
- Search service changes.
- Comment moderation behavior changes.
- New Payload collections or generated type changes.

## Current Project Context

The repository already has:

- Payload collections for `posts`, `projects`, and `comments`.
- A `site-settings` global.
- Public routes for `/blog`, `/blog/[slug]`, `/tags/[slug]`, `/projects`, `/projects/[slug]`, `/about`, `/contact`, `/rss.xml`, and `/sitemap.xml`.
- Most CMS-backed public routes currently export `dynamic = "force-dynamic"`.
- No `REVALIDATION_SECRET`.
- No `/api/revalidate` route.
- No Payload revalidation hooks.

The important constraint is that `revalidatePath` does not improve routes that are forced dynamic. This slice must therefore include the minimal cache-mode change needed for revalidation to matter.

## Architecture

Use path-based revalidation, not tag-based revalidation.

Reasoning:

- Current data access uses Payload Local API helpers, not `fetch` calls with cache tags.
- Public paths are few and stable.
- Path mapping is easy to test as pure functions.
- It avoids adding a parallel cache-tag convention before the app needs it.

The system has three pieces:

1. `lib/revalidation.ts`: pure path mapping and secret validation helpers.
2. `app/(site)/api/revalidate/route.ts`: protected route that parses a known target and calls `revalidatePath`.
3. `lib/payload-revalidation.ts`: Payload hook functions that call the same path mapping after CMS changes.

## Revalidation Targets

Manual route targets:

- `site`: `/`, `/about`, `/contact`, `/sitemap.xml`
- `posts`: `/blog`, `/rss.xml`, `/sitemap.xml`
- `projects`: `/projects`, `/sitemap.xml`
- `all`: all of the above
- `post`: post aggregate paths plus `/blog/<slug>`, previous slug if supplied, and tag pages if supplied
- `project`: project aggregate paths plus `/projects/<slug>` and previous slug if supplied

The route must not accept an arbitrary path. It accepts only known targets and optional slug fields that are normalized by helper code.

## Payload Hooks

Posts:

- After create/update/delete, revalidate `/blog`, `/rss.xml`, and `/sitemap.xml`.
- If the current or previous post slug is available, revalidate `/blog/<slug>`.
- If populated tag slugs are available, revalidate `/tags/<slug>`.

Projects:

- After create/update/delete, revalidate `/projects` and `/sitemap.xml`.
- If the current or previous project slug is available, revalidate `/projects/<slug>`.

Comments:

- After create/update/delete, revalidate the related published post page.
- This is required because approved comments render inside `/blog/<slug>`. Once the post page is ISR-backed, comment approvals must invalidate that path.

Site settings:

- After update, revalidate `/`, `/about`, `/contact`, and `/sitemap.xml`.

## Route Contract

Endpoint: `POST /api/revalidate`

JSON body examples:

```json
{ "secret": "value", "target": "posts" }
```

```json
{
  "secret": "value",
  "target": "post",
  "slug": "hello-world",
  "previousSlug": "old-hello-world",
  "tagSlugs": ["payload", "nextjs"]
}
```

Responses:

- `200`: `{ "revalidated": true, "paths": [...] }`
- `400`: invalid JSON or unknown target
- `401`: missing or invalid secret
- `500`: unexpected server error

The route should not expose stack traces.

## Cache Mode

Replace `dynamic = "force-dynamic"` with:

```ts
export const revalidate = 3600;
```

Apply this to CMS-backed public routes:

- `app/(site)/about/page.tsx`
- `app/(site)/contact/page.tsx`
- `app/(site)/blog/page.tsx`
- `app/(site)/blog/[slug]/page.tsx`
- `app/(site)/tags/[slug]/page.tsx`
- `app/(site)/projects/page.tsx`
- `app/(site)/projects/[slug]/page.tsx`
- `app/(site)/rss.xml/route.ts`
- `app/(site)/sitemap.ts`

Do not change `/api/comments`, `/api/revalidate`, or Payload admin routes.

## Environment Contract

Add to `.env.example`:

```dotenv
REVALIDATION_SECRET=replace-with-a-long-random-secret
```

Rules:

- The secret is required for manual `POST /api/revalidate`.
- The secret should be configured in Vercel preview and production.
- Payload hooks that run in-process do not need to call the HTTP route or send the secret.

## Error Handling

- If `REVALIDATION_SECRET` is missing, the manual route returns `500` with a generic setup message.
- Invalid JSON returns `400`.
- Unknown targets return `400`.
- Invalid secret returns `401`.
- Hook failures should not block saving CMS content; log the error and return the document.

## Security

- Do not accept arbitrary path input.
- Do not accept revalidation through `GET`.
- Do not put the secret in a query string.
- Do not log the secret.
- Do not expose stack traces or internal hook errors to public users.

## Testing And Verification

Automated:

- Unit test secret validation.
- Unit test path deduplication and slug normalization.
- Unit test post, project, comment, site, and route-target path mapping.
- Run lint and build.

Manual:

1. Set `REVALIDATION_SECRET` locally.
2. Start MongoDB and `pnpm dev`.
3. Publish or edit a post in `/admin`.
4. Confirm `/blog`, `/blog/<slug>`, `/rss.xml`, and `/sitemap.xml` update after the next request.
5. Approve a comment and confirm `/blog/<slug>` updates.
6. Call `POST /api/revalidate` with a bad secret and confirm `401`.
7. Call `POST /api/revalidate` with target `posts` and confirm `200` plus known paths.

## Acceptance Criteria

This slice is done when:

1. `REVALIDATION_SECRET` is documented in `.env.example` and README.
2. `POST /api/revalidate` accepts only known targets and requires the secret.
3. Posts, projects, comments, and site settings trigger path revalidation through Payload hooks.
4. CMS-backed public routes use ISR-style `revalidate = 3600` instead of `force-dynamic`.
5. No arbitrary path revalidation, GET secret route, new collection, dashboard, analytics, or UI redesign is added.
6. `node --test lib/revalidation.test.ts`, existing unit tests, `pnpm lint`, `pnpm build`, and `git diff --check` pass.

## Follow-Up Slices

Recommended later slices:

1. Internal post metrics dashboard.
2. Dark theme.
3. Manual backup/export workflow.
4. More granular cache tags if the app outgrows path-based revalidation.
