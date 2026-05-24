# Blog Comment Replies Design

Status: approved for implementation
Date: 2026-05-24
Source PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-23-blog-comments-design.md`
- `docs/superpowers/specs/2026-05-24-blog-comment-anti-spam-design.md`
- `docs/superpowers/specs/2026-05-24-blog-revalidation-design.md`

## Goal

Add two-level public replies to the existing moderated blog comments.

Reader opens a published post -> reader replies to an approved top-level
comment -> the reply is stored as `pending` with `parentComment` -> admin
approves it in Payload -> the reply renders under its parent comment.

This closes the PRD requirement that comments support `parentComment` while the
tree depth is limited to two levels.

## Scope

Included:

- Add optional `parentComment` to the `Comments` Payload collection.
- Keep existing top-level comment submission working.
- Allow public replies only to approved top-level comments on the same post.
- Store public replies as `pending`.
- Render approved replies under approved top-level comments.
- Prevent replies to replies.
- Keep comment rate limiting, honeypot handling, and post revalidation behavior.
- Add focused tests for pure reply input and thread-building behavior.
- Add README verification notes for the reply moderation flow.

Excluded:

- Infinite nested comment threads.
- Public editing or deleting comments.
- Comment voting, reactions, or notifications.
- Email collection or email notifications.
- A separate moderation dashboard outside Payload admin.
- Comment pagination or counters.
- Post metrics, analytics, theme, RSS, sitemap, or search changes.

## Current Project Context

The repository already has:

- `collections/Comments.ts` with moderated flat comments.
- `app/(site)/api/comments/route.ts` for public comment submissions.
- `lib/comment-validation.ts` for pure request validation.
- `lib/comment-rate-limit.ts` for per-post request-hash rate limiting.
- `lib/comments.ts` for public approved-comment reads.
- `components/comment-form.tsx` and `components/comments-section.tsx`.
- Comment-triggered post revalidation in `lib/payload-revalidation.ts`.

The gap is that comments are currently flat. The PRD model includes
`parentComment`, and the comments requirement explicitly limits nesting to two
levels.

## Recommended Approach

Implement replies as an optional self-relationship on `comments`, with public
API validation and simple grouped rendering.

Reasons:

- It matches the PRD data model directly.
- It keeps Payload admin as the moderation surface.
- It does not add another collection or external service.
- It keeps the public page server-rendered and low JavaScript.

Alternative approaches considered:

1. Admin-only `parentComment` field with no public reply UI: smaller, but does
   not deliver the visitor reply workflow implied by the PRD.
2. Unlimited threaded comments: more flexible, but unnecessary for a personal
   blog and harder to moderate.
3. Store replies as embedded arrays under comments: simpler reads, but worse
   moderation ergonomics in Payload and less consistent with the existing
   collection-per-comment model.

## Content Model

Add to `Comments`:

- `parentComment`: optional relationship to `comments`, indexed.

Rules:

- A top-level comment has no `parentComment`.
- A reply has `parentComment` set to a top-level comment.
- A reply must belong to the same `post` as its parent comment.
- A reply cannot itself be used as a parent for another public reply.
- Publicly submitted replies are created as `pending`, same as top-level
  comments.

Adding an optional field is backwards compatible for existing comments in
MongoDB.

## Public Endpoint

### `POST /api/comments`

Existing input remains valid:

- `postSlug`
- `authorName`
- `body`
- `website`

New optional input:

- `parentCommentId`

Behavior:

1. Parse JSON safely.
2. Validate the existing fields and optional `parentCommentId`.
3. Preserve honeypot behavior: filled `website` returns generic success without
   creating a comment.
4. Resolve `postSlug` to a published post.
5. If `parentCommentId` is missing, create a normal top-level pending comment.
6. If `parentCommentId` is present:
   - resolve the parent comment;
   - require `status = approved`;
   - require the parent comment belongs to the resolved post;
   - reject if the parent comment already has `parentComment`;
   - create a pending reply with `parentComment` set.
7. Keep the current rate-limit check. Replies count against the same per-post
   comment limit as top-level comments.

Use `400` for invalid parent relationships and `404` only for missing or
unpublished posts. Keep public error messages concise and avoid exposing
internal moderation details.

## Public UI

### Comment Tree

Render only approved comments from the post:

- top-level approved comments are shown as the main list;
- approved replies are nested below their approved parent;
- approved replies with a missing, rejected, deleted, or different-post parent
  are not rendered as orphan comments.

The visual treatment should remain restrained:

- top-level comments keep the current layout;
- replies are indented with a subtle left border;
- no UI card nesting;
- no reply form under replies.

### Reply Form

Under each top-level comment, show a compact reply affordance that opens or
renders a reply form for that parent. The form can reuse `CommentForm` with an
optional `parentCommentId` prop.

The main comment form at the bottom remains for new top-level comments.

## Data Flow

Public display:

`BlogPostPage` -> `CommentsSection` -> `getApprovedCommentsForPost(post.id)` ->
Payload Local API -> approved comments -> pure thread builder -> server-rendered
comment tree.

Public reply submit:

Browser form -> `/api/comments` with `parentCommentId` -> validation -> published
post lookup -> approved parent lookup -> rate-limit check -> Payload create with
`status = pending` and `parentComment`.

Admin moderation:

`/admin` -> Comments collection -> admin approves pending reply -> comment
revalidation updates the post page -> approved reply renders under the parent.

## Error Handling

- Invalid JSON returns `400`.
- Missing or invalid existing fields return `400`.
- Filled honeypot returns generic success.
- Unknown or unpublished post returns `404`.
- Unknown parent comment returns `400`.
- Parent from another post returns `400`.
- Parent that is not approved returns `400`.
- Parent that is already a reply returns `400`.
- Unexpected server errors return a generic `500`.

## Security And Privacy

- Do not collect visitor email in this slice.
- Do not render comment HTML.
- Continue storing only request hashes already used by the anti-spam slice.
- Public reads must keep `status = approved`.
- Public replies can only target visible approved parent comments.
- Payload admin remains the only moderation interface.

## SEO And Caching

- No new public route is added.
- Comment approval continues to revalidate the related post page through the
  existing comment revalidation hook.
- Do not change route revalidation constants or caching mode in this slice.

## Testing And Verification

Minimum automated checks:

- Unit tests for optional `parentCommentId` validation.
- Unit tests for building top-level comment threads with replies.
- Unit tests proving replies to missing parents are not rendered as top-level
  comments.
- Existing comment validation and rate-limit tests still pass.
- `pnpm generate:types`
- `pnpm lint`
- `pnpm build`
- `git diff --check`

Manual checks:

1. Start MongoDB and `pnpm dev`.
2. Ensure a published post has one approved top-level comment.
3. Submit a reply to that comment.
4. Confirm the reply appears in `/admin` as `pending` with `parentComment`.
5. Confirm the pending reply does not render publicly.
6. Approve the reply.
7. Reopen the post and confirm the reply renders under its parent.
8. Confirm there is no reply form under the reply itself.
9. Attempt to reply to a reply through the API and confirm it is rejected.
10. Confirm normal top-level comment submission still works.

## Acceptance Criteria

1. `Comments` supports optional `parentComment`.
2. Existing top-level comments remain valid and render unchanged.
3. Public users can submit replies to approved top-level comments.
4. New public replies are stored as `pending`.
5. Pending, rejected, deleted, and orphan replies do not render publicly.
6. Approved replies render under the correct approved parent comment.
7. The system prevents public replies to replies.
8. Rate limiting applies to top-level comments and replies.
9. Generated Payload types include the new comment relationship.
10. `pnpm lint`, `pnpm build`, and `git diff --check` pass.

## Follow-Up Slices

Recommended later slices:

1. Manual backup/export workflow.
2. Internal post metrics dashboard.
3. Dark theme.
4. Optional comment email hash if moderation workflow needs it.
