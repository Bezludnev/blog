# MConverter.eu Blog

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
- `NEXT_PUBLIC_SITE_URL`: public base URL used by metadata, robots, and
  sitemap. Use the Vercel URL until a custom domain exists.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob read/write token for media uploads.
  It must start with `vercel_blob_rw_`. Keep this token out of git.
- `NEXT_PUBLIC_BLOB_HOSTNAME`: exact public Blob hostname for `next/image`,
  for example `<store-id>.public.blob.vercel-storage.com`.

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

Manual CMS path:

1. Start MongoDB and `pnpm dev`.
2. Open `/admin` and create the first admin user.
3. Create a tag and a post with `status=published`.
4. Verify the post appears at `/blog` and renders at `/blog/<slug>`.
5. Change the post to `draft` and verify it disappears from public pages.

Project CMS path:

1. Create a project in `/admin` with `status=published`.
2. Verify it appears at `/projects`.
3. Open `/projects/<slug>`.
4. Change it to `draft` and verify the public pages hide it.

About and contact CMS path:

1. Open `/admin` and update Site Settings with headline, bio, contact email,
   and social links.
2. Open `/about` and verify the headline, bio, and social links render.
3. Open `/contact` and verify the `mailto:` link and social links render.
4. Open `/sitemap.xml` and verify `/about` and `/contact` are present.

Comment moderation path:

1. Open a published post at `/blog/<slug>`.
2. Submit a comment with name and body.
3. Confirm the comment appears in `/admin` with `status=pending`.
4. Confirm the pending comment is not visible publicly.
5. Change the comment to `approved` and verify it appears under the post.

Manual media path with Blob credentials:

1. Upload a JPEG, PNG, WebP, or GIF in Payload Media.
2. Confirm the saved Media URL points to the configured Vercel Blob hostname.
3. Select that image as a post `coverImage`.
4. Verify the image renders on `/blog` and `/blog/<slug>`.
5. Try uploading a non-image file and confirm Payload rejects it.

## Deployment

The target stack is Vercel Hobby plus MongoDB Atlas Free Tier. Configure the
same environment variables in Vercel before deploying.
