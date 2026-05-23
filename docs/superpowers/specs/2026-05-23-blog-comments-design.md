# Blog Comments Moderation Design

Status: approved for implementation
Date: 2026-05-23
Source PRD: `docs/_MConverter.eu_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- `docs/superpowers/specs/2026-05-23-blog-media-storage-design.md`
- `docs/superpowers/specs/2026-05-23-blog-projects-design.md`

## Goal

Add the first moderated comments slice for blog posts.

This slice proves the PRD path:

Visitor opens a published post -> visitor submits a comment -> comment appears in Payload admin as `pending` -> admin approves it -> approved comment appears publicly under the post.

## Scope

Included:

- Add a `Comments` Payload collection.
- Add a public comment submission endpoint at `/api/comments`.
- Add a comments list and form under published blog posts.
- Store new public comments as `pending`.
- Show only `approved` comments publicly.
- Allow admin moderation through Payload admin.
- Add basic validation, honeypot spam protection, and server-side request hashing.
- Regenerate Payload types/import map.
- Add a short README verification note.

Excluded:

- Comment email collection.
- Email notifications.
- Nested replies.
- Public editing or deleting comments.
- Markdown, rich text, or HTML in comments.
- Public comment counters.
- Dedicated moderation dashboard outside Payload admin.
- Full serverless-safe rate limiting.
- Analytics or post metrics.

## Current Project Context

The repository already has:

- Payload collections for users, posts, tags, media, and projects.
- `publishedOrAdmin` access for published-only public reads.
- Public post detail pages under `app/(site)/blog/[slug]`.
- Post query helpers in `lib/posts.ts`.
- Rich text and media rendering components.
- Payload Local API access through `lib/payload.ts`.

The comments slice should follow the same monolithic Next.js + Payload pattern and avoid adding external services.

## Content Model

### Comments Collection

Slug: `comments`

Purpose: moderated visitor comments for blog posts.

Fields:

- `post`: relationship to `posts`, required.
- `authorName`: text, required, max length 80.
- `body`: textarea, required, max length 2000.
- `status`: select `pending | approved | rejected | deleted`, default `pending`.
- `ipHash`: text, optional, admin-only display.
- `userAgentHash`: text, optional, admin-only display.

Access:

- Create: admin only through Payload collection access.
- Read/update/delete: admin only through Payload collection access.

Public creation must go through `/api/comments`, where validation and default moderation state are enforced. Public reads must go through server helpers that query only `approved` comments.

## Public Endpoint

### `POST /api/comments`

Input:

- `postSlug`: published post slug.
- `authorName`: visitor display name.
- `body`: plain text comment body.
- `website`: honeypot field; must be empty.

Behavior:

1. Reject non-object or malformed JSON.
2. Trim `authorName` and `body`.
3. Validate name length from 1 to 80.
4. Validate body length from 1 to 2000.
5. Reject if honeypot is filled.
6. Resolve `postSlug` to a published post.
7. Hash request IP and user agent when available.
8. Create a `pending` comment through Payload Local API with `overrideAccess: true`.
9. Return a generic success response.

The endpoint should not expose stack traces, moderation internals, or whether spam checks were triggered.

## Public UI

### Blog Post Page

Under the article content, add a comments section.

Acceptance:

- Approved comments render under the post.
- Pending, rejected, deleted, and unrelated comments do not render.
- Empty state is shown when there are no approved comments.
- The form collects only name and comment text.
- A hidden honeypot field is included.
- After successful submit, the UI shows that the comment is awaiting moderation.
- Validation errors are shown without navigating away.

Implementation shape:

- Keep the post page as a server component.
- Add a small client component for the form submission state.
- Fetch approved comments from a server helper in `lib/comments.ts`.

## Data Flow

Public display:

`app/(site)/blog/[slug]/page.tsx` -> `lib/comments.ts` -> Payload Local API -> MongoDB -> approved comments -> server-rendered list.

Public submit:

Browser form -> `/api/comments` -> validation and post lookup -> Payload Local API create with `status = pending` -> MongoDB -> generic success response.

Admin moderation:

`/admin` -> Payload Comments collection -> admin changes status from `pending` to `approved` -> public post page displays the comment.

## Security And Privacy

- Do not collect visitor email in this slice.
- Do not render comment HTML.
- Store only minimal request hashes for future moderation/rate-limit work.
- Only admins can read full comments in Payload admin.
- Public list helper filters by `post` and `status = approved`.
- Public endpoint validates the post is published before accepting a comment.

## Error Handling

- Missing or unpublished post returns `404`.
- Invalid JSON or invalid fields returns `400`.
- Honeypot hits return the same generic success response as a normal submission.
- Unexpected server errors return a generic `500` response.
- Public UI should show a concise failure message for non-success responses.

## Testing And Verification

Minimum automated checks:

- `pnpm generate:importmap`
- `pnpm generate:types`
- `pnpm lint`
- `pnpm build`

Manual happy path:

1. Start local MongoDB and Next.js.
2. Ensure a published post exists.
3. Open `/blog/<slug>`.
4. Submit a comment with name and body.
5. Confirm the response says it is awaiting moderation.
6. Confirm the comment is present in `/admin` with `status = pending`.
7. Confirm the pending comment is not visible publicly.
8. Approve the comment in `/admin`.
9. Reopen `/blog/<slug>` and confirm the comment is visible.

Manual negative checks:

1. Submit an empty name and confirm validation fails.
2. Submit an empty body and confirm validation fails.
3. Submit a body longer than 2000 characters and confirm validation fails.
4. Submit with the honeypot filled and confirm no public error is exposed.
5. Submit for an unknown or draft post and confirm it is rejected.

## Acceptance Criteria

This slice is done when:

1. `Comments` collection exists in Payload admin.
2. Public visitors can submit comments under published posts.
3. New public comments are created as `pending`.
4. Pending comments do not render publicly.
5. Admins can approve comments in Payload admin.
6. Approved comments render under the correct post.
7. Comment form does not collect email.
8. Basic validation and honeypot protection are in place.
9. Generated Payload types include `Comment` and `comments`.
10. `pnpm lint` and `pnpm build` pass.

## Follow-Up Slices

Recommended later slices:

1. Serverless-safe rate limiting for `/api/comments`.
2. Optional email hash if moderation workflow needs it.
3. Two-level replies.
4. RSS and tag pages.
5. Contact page and contact message collection.
