# Blog Comment Anti-Spam Rate Limiting Design

Status: approved for implementation
Date: 2026-05-24
Source PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-23-blog-comments-design.md`
- `docs/superpowers/specs/2026-05-24-blog-discovery-rss-design.md`
- `docs/superpowers/specs/2026-05-24-blog-vercel-analytics-design.md`

## Goal

Improve comment spam protection by adding serverless-safe rate limiting to the existing public comment submission endpoint.

This slice proves the PRD path:

Visitor submits too many comments for the same post from the same request identity within a configured time window -> the API rejects later submissions with `429` -> normal comments still enter Payload admin as `pending` for moderation.

## Scope

Included:

- Add `COMMENT_RATE_LIMIT_WINDOW_SECONDS`.
- Add `COMMENT_RATE_LIMIT_MAX`.
- Keep the existing honeypot behavior.
- Reuse existing `comments` documents, `ipHash`, `userAgentHash`, `post`, and `createdAt` for rate-limit counting.
- Add pure helper logic for rate-limit config, time window, threshold checks, and Payload `where` construction.
- Check the rate limit in `POST /api/comments` before creating a new pending comment.
- Return `429` with a public-safe message when the limit is exceeded.
- Document local and production env defaults.
- Add focused unit tests for the pure helper logic.

Excluded:

- CAPTCHA or third-party bot protection.
- Redis, KV, Upstash, or another rate-limit service.
- A new `RateLimit` or `CommentAttempts` collection.
- Storing plaintext IP addresses or user agents.
- Cookies, browser fingerprinting, or unique visitor tracking.
- Public comment counters.
- Internal metrics dashboard or `PostMetrics`.
- Changes to Payload comment moderation states.
- Changes to the public comment form UI beyond using the existing error path.

## Current Project Context

The repository already has:

- `collections/Comments.ts` with `post`, `authorName`, `body`, `status`, `ipHash`, and `userAgentHash`.
- `app/(site)/api/comments/route.ts` with JSON parsing, validation, honeypot handling, published post lookup, request hashing, and pending comment creation.
- `lib/comment-validation.ts` and `lib/comment-validation.test.ts`.
- A client comment form that already displays non-2xx API errors.
- `.env.example` and `README.md` environment variable documentation.

The current gap is that repeated valid-looking submissions are accepted until an admin manually moderates them. The route stores hashes that can support rate limiting, but it does not count recent submissions yet.

## Architecture

Use the existing Comments collection as the rate-limit ledger.

When a valid, non-honeypot request targets a published post:

1. Hash the request IP and user agent using the existing SHA-256 approach.
2. Build a window start timestamp from `COMMENT_RATE_LIMIT_WINDOW_SECONDS`.
3. Count existing comments for the same post, same available request hashes, and `createdAt >= windowStart`.
4. If the count is greater than or equal to `COMMENT_RATE_LIMIT_MAX`, return `429`.
5. Otherwise create the pending comment as today.

This is serverless-safe because it uses MongoDB through Payload Local API instead of in-memory counters. It is intentionally not a perfect anti-abuse system; it is the smallest PRD-aligned improvement before adding paid or stateful infrastructure.

## Content Model

No Payload schema change is required.

The existing automatic `createdAt` timestamp plus these fields are enough:

- `post`
- `ipHash`
- `userAgentHash`

The rate-limit query should count all comment statuses. Pending, approved, rejected, and deleted comments all represent accepted submission attempts and should contribute to the limit.

## Environment Contract

Add to `.env.example`:

```dotenv
COMMENT_RATE_LIMIT_WINDOW_SECONDS=300
COMMENT_RATE_LIMIT_MAX=5
```

Meaning:

- A visitor can submit at most five accepted, non-honeypot comments for the same post and same request identity within five minutes.
- Missing, empty, zero, negative, or non-numeric env values fall back to these defaults.
- The values are not secrets.
- The values should be configured in Vercel environment variables for preview and production.

## Request Identity

The identity is intentionally simple:

- If both IP and user agent are available, count comments matching both hashes.
- If only IP is available, count by post and IP hash.
- If only user agent is available, count by post and user agent hash.
- If neither is available, skip rate limiting and keep the moderation workflow.

Skipping the limit when no identifier exists avoids accidentally blocking all visitors for a post.

## Data Flow

Normal submission:

Browser form -> `/api/comments` -> validation -> honeypot empty -> published post lookup -> hash request metadata -> count recent matching comments -> create pending comment -> JSON success.

Rate-limited submission:

Browser form -> `/api/comments` -> validation -> honeypot empty -> published post lookup -> hash request metadata -> count recent matching comments -> return `429` with `"Too many comments. Try again later."`.

Honeypot submission:

Browser form -> `/api/comments` -> validation -> honeypot filled -> generic success response. Honeypot hits are not counted because the system does not currently persist spam attempts.

## Error Handling

- Invalid JSON remains `400`.
- Invalid comment fields remain `400`.
- Unknown or unpublished post remains `404`.
- Rate limit exceeded returns `429`.
- Unexpected Payload or server errors remain generic `500`.
- The response must not expose raw IP, user agent, hashes, stack traces, or count details.

## Security And Privacy

- Continue hashing IP and user agent before storage or comparison.
- Do not store new personal data.
- Do not add cookies.
- Do not make comments publicly readable outside the existing approved-comments helper.
- Use `overrideAccess: true` only inside the server route/helper that already owns public comment submission.

## Testing And Verification

Automated:

- Unit test default and custom rate-limit env parsing.
- Unit test invalid env fallback behavior.
- Unit test threshold behavior: count below max allows, count equal to max blocks.
- Unit test Payload `where` construction for both hashes, IP-only, user-agent-only, and no-identity cases.
- Run existing comment validation tests.
- Run lint and build.

Manual:

1. Configure a low local limit, for example `COMMENT_RATE_LIMIT_WINDOW_SECONDS=300` and `COMMENT_RATE_LIMIT_MAX=1`.
2. Submit one valid comment under a published post and confirm success.
3. Submit a second valid comment for the same post from the same browser and confirm `429`.
4. Confirm only the first comment appears in Payload admin.
5. Submit a honeypot-filled request and confirm it still returns generic success without creating a comment.

## Acceptance Criteria

This slice is done when:

1. `.env.example` documents `COMMENT_RATE_LIMIT_WINDOW_SECONDS` and `COMMENT_RATE_LIMIT_MAX`.
2. Pure rate-limit helper tests cover config parsing, window calculation, threshold checks, and `where` construction.
3. `/api/comments` checks the rate limit before creating a pending comment.
4. Exceeded limits return `429` with a generic public-safe message.
5. Existing honeypot behavior is preserved.
6. No new collection, Redis/KV service, CAPTCHA, cookies, plaintext IP storage, or analytics dashboard is added.
7. `node --test lib/comment-rate-limit.test.ts lib/comment-validation.test.ts`, `pnpm lint`, `pnpm build`, and `git diff --check` pass.

## Follow-Up Slices

Recommended later slices:

1. Revalidation after content publication.
2. Internal post metrics dashboard.
3. Dark theme.
4. More advanced anti-spam if needed, such as Turnstile or an external serverless rate-limit service.
