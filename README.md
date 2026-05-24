# Personal Engineering Blog

Personal blog foundation built with Next.js App Router, PayloadCMS, and MongoDB.

## Local Setup

Create a local environment file:

```bash
cp .env.example .env
```

For local development from the host machine, keep:

```dotenv
DATABASE_URI=mongodb://127.0.0.1:27017/blog
```

Start MongoDB and the app:

```bash
docker compose up -d mongo
pnpm install
pnpm dev
```

Open:

- Public site: http://localhost:3000
- Blog index: http://localhost:3000/blog
- Payload admin: http://localhost:3000/admin

The first admin user is created through Payload's initial auth flow at
`/admin`.

## Environment Variables

- `DATABASE_URI`: MongoDB connection string. Use
  `mongodb://127.0.0.1:27017/blog` when running Next.js on the host, or
  `mongodb://mongo:27017/blog` when running Next.js inside Docker Compose.
- `PAYLOAD_SECRET`: long random Payload secret. Never commit a real value.
- `REVALIDATION_SECRET`: long random secret for protected manual
  revalidation. Configure it in Vercel preview/production if using
  `/api/revalidate`.
- `NEXT_PUBLIC_SITE_URL`: public base URL used by metadata, robots, and
  sitemap. Use the Vercel URL until a custom domain exists.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob read/write token for media uploads.
  It must start with `vercel_blob_rw_`. Keep this token out of git.
- `NEXT_PUBLIC_BLOB_HOSTNAME`: exact public Blob hostname for `next/image`,
  for example `<store-id>.public.blob.vercel-storage.com`.
- `ANALYTICS_ENABLED`: non-secret flag for Vercel Web Analytics and Speed
  Insights. Keep `false` locally. Set to `true` in Vercel preview/production
  after enabling Web Analytics and Speed Insights for the project.
- `COMMENT_RATE_LIMIT_WINDOW_SECONDS`: non-secret comment rate-limit window
  in seconds. Defaults to `300` when missing or invalid.
- `COMMENT_RATE_LIMIT_MAX`: non-secret maximum accepted comments per post and
  request identity within the rate-limit window. Defaults to `5` when missing
  or invalid.

For production, point `DATABASE_URI` to MongoDB Atlas Free Tier.

## Media Storage

Local development can run without Vercel Blob credentials. In that mode,
Payload keeps using local upload storage, which is useful for CMS and blog
development.

To verify the production media path locally, add a Vercel Blob store and set:

```dotenv
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_<store-id>_<random-string>
NEXT_PUBLIC_BLOB_HOSTNAME=<store-id>.public.blob.vercel-storage.com
```

On Vercel, add Blob storage to the project, set both variables in the project
environment, and keep `BLOB_READ_WRITE_TOKEN` secret. Vercel deployments fail
early when Blob storage is missing, so production does not silently write media
uploads to ephemeral local storage.

## Verification

Run:

```bash
pnpm generate:importmap
pnpm generate:types
pnpm lint
pnpm build
```

Automated browser smoke path:

```bash
docker compose up -d mongo
pnpm test:e2e
```

Manual CMS path:

1. Start MongoDB and `pnpm dev`.
2. Open `/admin` and create the first admin user.
3. Create a tag and a post with `status=published`.
4. Verify the post appears at `/blog` and renders at `/blog/<slug>`.
5. Change the post to `draft` and verify it disappears from public pages.

Blog discovery path:

1. Create two published posts and one draft post with distinct titles,
   excerpts, content text, and tags.
2. Open `/blog?q=<published-term>` and verify the matching published post
   appears.
3. Open `/blog?q=<draft-only-term>` and verify the draft post is absent.
4. Open `/tags/<slug>` for an existing tag and verify only published posts with
   that tag appear.
5. Open `/rss.xml` and verify the feed includes published posts with absolute
   `/blog/<slug>` links.
6. Create more than 10 published posts and verify `/blog?page=2` shows the next
   page.
7. Verify `/blog?q=<term>&page=2` keeps the search term in pagination links
   when the search has more than 10 matches.
8. Verify `/tags/<slug>?page=2` works for a tag with more than 10 published
   posts.
9. Open `/blog?page=999` and `/tags/<slug>?page=999` and verify they return
   404.

Analytics path:

1. Keep `ANALYTICS_ENABLED=false` locally and verify `pnpm build` passes.
2. Temporarily set `ANALYTICS_ENABLED=true` and verify public pages still
   render.
3. In Vercel, enable Web Analytics and Speed Insights for the project.
4. Set `ANALYTICS_ENABLED=true` in Vercel preview/production environment
   variables.
5. Deploy and confirm page views and Speed Insights appear in Vercel after the
   normal dashboard delay.

Post metrics path:

1. Start MongoDB and `pnpm dev`.
2. Open a published post at `/blog/<slug>`.
3. Open `/admin` and verify a `PostMetrics` row exists for the post and UTC
   date.
4. Refresh the post and verify `views` increments.
5. Confirm raw IP and raw user-agent values are not stored.

Dark theme path:

1. Start `pnpm dev`.
2. Open `/`, `/blog`, `/blog/<slug>`, `/projects`, `/about`, and `/contact`.
3. Toggle dark mode from the public header.
4. Refresh and verify the selected theme persists.
5. Clear local storage and verify the system preference is used.
6. Open `/admin` and verify Payload admin is not wrapped by the public header
   or toggle.

Project CMS path:

1. Create a project in `/admin` with `status=published`.
2. Verify it appears at `/projects`.
3. Open `/projects/<slug>`.
4. Change it to `draft` and verify the public pages hide it.

Curated feed and home path:

1. Start MongoDB and `pnpm dev`.
2. Open `/admin` and create a curated link with `status=draft`.
3. Verify it does not appear on `/feed` or `/`.
4. Publish the curated link.
5. Verify it appears on `/feed`.
6. Verify recent curated links appear on `/`.
7. Mark a project as `featured` and verify it appears on `/`.
8. Open `/sitemap.xml` and verify `/feed` is present.
9. Toggle dark theme and verify `/` and `/feed` remain readable.

About and contact CMS path:

1. Open `/admin` and update Site Settings with headline, bio, contact email,
   and social links.
2. Open `/about` and verify the headline, bio, and social links render.
3. Open `/contact` and verify the `mailto:` link and social links render.
4. Open `/sitemap.xml` and verify `/about` and `/contact` are present.

Revalidation path:

1. Set `REVALIDATION_SECRET` locally and start MongoDB plus `pnpm dev`.
2. Edit or publish a post in `/admin`.
3. Verify `/`, `/blog`, `/blog/<slug>`, `/rss.xml`, and `/sitemap.xml` update
   after the next request.
4. Approve a pending comment and verify `/blog/<slug>` updates.
5. POST to `/api/revalidate` with an invalid secret and confirm `401`.
6. POST to `/api/revalidate` with `{ "secret": "...", "target": "posts" }`
   and confirm the response contains known paths.

Comment moderation path:

1. Open a published post at `/blog/<slug>`.
2. Submit a comment with name and body.
3. Confirm the comment appears in `/admin` with `status=pending`.
4. Confirm the pending comment is not visible publicly.
5. Change the comment to `approved` and verify it appears under the post.
6. Submit a reply to the approved top-level comment.
7. Confirm the reply appears in `/admin` with `status=pending` and a
   `parentComment`.
8. Confirm the pending reply is not visible publicly.
9. Change the reply to `approved` and verify it renders under the parent
   comment.
10. Confirm replies do not show their own reply form.
11. POST to `/api/comments` with a reply ID as `parentCommentId` and confirm
   the API returns `400`.
12. Temporarily set `COMMENT_RATE_LIMIT_MAX=1`.
13. Submit a second comment for the same post from the same browser and verify
   the API returns `429`.
14. Confirm only the first accepted comment appears in `/admin`.

Manual media path with Blob credentials:

1. Upload a JPEG, PNG, WebP, or GIF in Payload Media.
2. Confirm the saved Media URL points to the configured Vercel Blob hostname.
3. Select that image as a post `coverImage`.
4. Verify the image renders on `/blog` and `/blog/<slug>`.
5. Try uploading a non-image file and confirm Payload rejects it.

## Deployment

The target stack is Vercel Hobby plus MongoDB Atlas Free Tier. Configure the
same environment variables in Vercel before deploying.
