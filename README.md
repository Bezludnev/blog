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

For production, point `DATABASE_URI` to MongoDB Atlas Free Tier.

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

## Deployment

The target stack is Vercel Hobby plus MongoDB Atlas Free Tier. Configure the
same environment variables in Vercel before deploying.
