# Blog Foundation Vertical Slice Design

Status: draft for review
Date: 2026-05-22
Source PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`

## Goal

Build the first working foundation slice for the personal blog/portfolio: one Next.js application with PayloadCMS admin, MongoDB-backed content, and public blog pages that can render a published post created from the CMS.

This slice proves the core product path before comments, analytics, projects, and polishing are added:

Admin signs in -> creates and publishes a post -> public visitor opens `/blog` -> visitor opens `/blog/[slug]`.

## Scope

Included:

- Integrate PayloadCMS into the existing Next.js App Router project.
- Use MongoDB through the Payload MongoDB adapter.
- Add Payload admin at `/admin`.
- Add Payload REST/API route handling required by the admin.
- Add minimal CMS collections:
  - `Users`
  - `Media`
  - `Tags`
  - `Posts`
  - `SiteSettings`
- Add public pages:
  - `/`
  - `/blog`
  - `/blog/[slug]`
- Add basic SEO metadata for home, blog index, and post pages.
- Add `robots.ts` and `sitemap.ts` using `NEXT_PUBLIC_SITE_URL`.
- Document required environment variables for local development and Vercel.
- Keep the app deployable on the PRD target stack: Vercel Hobby + MongoDB Atlas Free Tier.

Excluded from this slice:

- Comments and moderation.
- Anti-spam and rate limiting.
- Projects pages and project collection UI beyond future-proof relationships.
- Contact form.
- RSS.
- Vercel Web Analytics and Speed Insights.
- Internal post metrics.
- Vercel Blob media adapter.
- Custom domain.
- Dark theme.
- Full visual design pass.

## Current Project Context

The repository is currently a small `create-next-app` style project:

- App Router lives directly under `app/`.
- Tailwind CSS 4 is already configured.
- `package.json` has only Next.js, React, TypeScript, ESLint, and Tailwind packages.
- `docker-compose.yaml` already contains a local MongoDB service and a Next/Payload-oriented `payload` service.
- The current public UI is still the default starter page.

The foundation slice should keep this simple structure and avoid introducing a separate backend service.

## Architecture

The application remains a single full-stack Next.js app.

- Next.js serves public pages and metadata routes.
- PayloadCMS runs inside the same Next.js app.
- Payload Local API is used from server-side code for public reads.
- MongoDB stores CMS data through `@payloadcms/db-mongodb`.
- Media is modeled through Payload `Media`, but this slice does not yet wire Vercel Blob. Local development may use Payload's default upload behavior; Vercel-safe Blob storage is a separate follow-up slice before production media uploads are considered complete.
- The root app layout stays neutral so Payload admin is not wrapped in the public site header. Public pages render the site shell/header explicitly or through a public-only route group.

The preferred public data path is:

`app/blog/page.tsx` or `app/blog/[slug]/page.tsx` -> server-side content helper -> Payload Local API -> MongoDB.

The admin data path is:

`/admin` -> Payload admin UI -> Payload route handlers -> MongoDB.

## Content Model

### Users

Purpose: admin authentication and author relationship for posts.

Fields:

- `email`: handled by Payload auth.
- `displayName`: text, required.
- `role`: select, required, default `admin`, initially only `admin`.

Access:

- The first user can be created only while the users collection is empty, so local/bootstrap setup works.
- After bootstrap, only authenticated admins can read, create, update, and delete users.
- Payload auth controls admin login.

### Media

Purpose: shared upload collection for post covers and future rich text images.

Fields:

- Upload fields from Payload.
- `alt`: text, required.

Access:

- Public read.
- Admin-only create/update/delete.

### Tags

Purpose: classify posts and support future `/tags/[slug]`.

Fields:

- `name`: text, required.
- `slug`: text, required, unique.
- `description`: textarea, optional.

Access:

- Public read.
- Admin-only create/update/delete.

### Posts

Purpose: blog article content.

Fields:

- `title`: text, required.
- `slug`: text, required, unique.
- `excerpt`: textarea, required.
- `content`: rich text, required.
- `coverImage`: relationship/upload to `Media`, optional in this slice.
- `status`: select `draft | published | archived`, required, default `draft`.
- `tags`: relationship to `Tags`, many.
- `author`: relationship to `Users`, required.
- `publishedAt`: date, required only for published posts.
- `readingTime`: number, optional/computed later; can be manually editable in this slice.
- `seoTitle`: text, optional.
- `seoDescription`: textarea, optional.

Access:

- Public read returns only `status = published`.
- Authenticated admin read returns all statuses.
- Create/update/delete are admin-only.

### SiteSettings

Purpose: global text for home metadata and future navigation.

Fields:

- `name`: text, required.
- `headline`: text, required.
- `bio`: textarea, optional.
- `contactEmail`: email, optional.
- `socialLinks`: array of label/url pairs, optional.
- `seoTitle`: text, optional.
- `seoDescription`: textarea, optional.

Access:

- Public read.
- Admin-only update.

Implementation note: model this as a Payload global if it fits the installed Payload version cleanly; otherwise model it as a singleton collection with one document. The implementation plan should choose the cleaner current Payload pattern after package installation.

## Public Routes

### `/`

Home page with a concise personal positioning block and links to `/blog` and `/admin`. It may read `SiteSettings` if present, with a static fallback so the page still builds before content exists.

Acceptance:

- Does not show the default Next.js starter screen.
- Has page metadata title and description.
- Links to `/blog`.

### `/blog`

Blog index showing published posts, newest first.

Acceptance:

- Empty state is clear when no posts are published.
- Draft and archived posts do not appear.
- Each listed post links to `/blog/[slug]`.
- Title, excerpt, publication date, and tags are displayed when available.

### `/blog/[slug]`

Post detail page.

Acceptance:

- Published post renders by slug.
- Draft and archived posts return `notFound()`.
- Metadata uses `seoTitle`/`seoDescription` when present, otherwise falls back to title/excerpt.
- Content renders from Payload rich text.

### `robots.ts`

Acceptance:

- Allows public routes.
- Disallows `/admin`.
- Uses `NEXT_PUBLIC_SITE_URL` when available.

### `sitemap.ts`

Acceptance:

- Includes `/`, `/blog`, and published post URLs.
- Uses `NEXT_PUBLIC_SITE_URL`, with a local fallback for development.

## Environment Variables

Required for local and production:

- `DATABASE_URI`: MongoDB connection string. For local Docker, use a Mongo host reachable from the running process.
- `PAYLOAD_SECRET`: long random secret for Payload.
- `NEXT_PUBLIC_SITE_URL`: public base URL used by metadata, sitemap, and robots.

Reserved for later slices:

- `BLOB_READ_WRITE_TOKEN`
- `REVALIDATION_SECRET`
- `ANALYTICS_ENABLED`
- `COMMENT_RATE_LIMIT_WINDOW_SECONDS`
- `COMMENT_RATE_LIMIT_MAX`

The first implementation should add `.env.example` and keep real secrets out of git.

## Error Handling

- Missing optional CMS content should render a controlled empty state, not crash public pages.
- Missing required env vars should fail early in server-side Payload setup with a clear message.
- Public post page should use `notFound()` for missing, draft, or archived posts.
- Admin-only operations rely on Payload access control and must not expose write permissions publicly.

## Testing And Verification

Minimum verification for the first implementation:

- `pnpm lint`
- `pnpm build`
- Payload type generation, if configured as a script.
- Manual local happy path:
  - Start local MongoDB and Next.js.
  - Open `/admin`.
  - Create the first admin user if Payload prompts for it.
  - Create and publish one post.
  - Open `/blog` and verify the post appears.
  - Open `/blog/[slug]` and verify the post renders.
  - Change post to `draft` and verify it disappears publicly.

## Acceptance Criteria

The foundation slice is done when:

1. The app installs with the declared dependencies.
2. The app starts locally with MongoDB.
3. `/admin` loads PayloadCMS admin.
4. An admin can create a published post.
5. `/blog` lists published posts only.
6. `/blog/[slug]` renders published posts only.
7. Draft and archived posts are not publicly visible.
8. Basic metadata, robots, and sitemap are present.
9. Required env vars are documented in `.env.example` and README.
10. `pnpm lint` and `pnpm build` pass.

## Follow-Up Slices

Recommended order after this foundation:

1. Vercel Blob media storage, image constraints, and production-safe uploads.
2. Projects collection and `/projects` pages.
3. Comments collection, public comment endpoint, moderation flow, and anti-spam.
4. RSS and tag pages.
5. Vercel Web Analytics, Speed Insights, and optional post metrics.
6. Visual design polish and dark theme.
