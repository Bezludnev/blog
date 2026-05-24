# Blog Vercel Analytics And Speed Insights Design

Status: draft for review
Date: 2026-05-24
Source PRD: `docs/_MConverter.eu_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
Builds on:

- `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- `docs/superpowers/specs/2026-05-24-blog-discovery-rss-design.md`

## Goal

Add the MVP analytics integration required by the PRD:

Visitor opens public pages -> Vercel Web Analytics records page views -> Vercel Speed Insights records performance data -> the author can inspect traffic and web vitals in Vercel without running a custom metrics backend.

This slice closes the PRD acceptance criterion that Vercel Web Analytics records page views while keeping the app free-first and simple.

## Scope

Included:

- Add Vercel Web Analytics package and component.
- Add Vercel Speed Insights package and component.
- Mount both components in the public site layout.
- Add an `ANALYTICS_ENABLED` environment flag so local and non-Vercel environments can keep analytics disabled.
- Document local and Vercel setup in `.env.example` and README.
- Verify build and lint after dependency and layout changes.

Excluded:

- Custom post view counters.
- `PostMetrics` collection.
- Internal dashboard inside Payload admin.
- Unique visitor approximation.
- Cookie/IP-based analytics storage.
- Custom analytics API routes.
- Product analytics events beyond page views and web vitals.
- Dark theme or UI redesign.

## Current Project Context

The repository already has:

- Next.js App Router site layout in `app/(site)/layout.tsx`.
- Public pages under `app/(site)`.
- `NEXT_PUBLIC_SITE_URL` for canonical URLs, robots, sitemap, and RSS.
- `.env.example` and README environment documentation.
- No `@vercel/analytics` or `@vercel/speed-insights` dependency yet.
- No `ANALYTICS_ENABLED` environment flag yet.

The implementation should stay focused on public site instrumentation. Payload admin instrumentation is not needed for this slice.

## Integration Design

Use Vercel's official Next.js App Router components:

- `Analytics` from `@vercel/analytics/next`.
- `SpeedInsights` from `@vercel/speed-insights/next`.

Add a small wrapper component in `components/vercel-insights.tsx`:

- It reads `process.env.ANALYTICS_ENABLED`.
- It renders `null` unless the value is exactly `"true"`.
- When enabled, it renders both `<Analytics />` and `<SpeedInsights />`.

Mount this wrapper at the end of the public site `<body>` in `app/(site)/layout.tsx`.

This keeps the layout readable and avoids scattering environment checks across the app.

## Environment Contract

Add to `.env.example`:

```dotenv
ANALYTICS_ENABLED=false
```

Recommended behavior:

- Local development: `ANALYTICS_ENABLED=false`.
- Vercel preview/production: set `ANALYTICS_ENABLED=true` after enabling Web Analytics and Speed Insights in the Vercel project.

The flag is intentionally server-read and not named `NEXT_PUBLIC_*`. The public bundle will still contain Vercel's client components only when the server render includes the wrapper output.

## Data Flow

Public request:

`app/(site)/layout.tsx` -> `VercelInsights` wrapper -> Vercel client components -> Vercel Analytics and Speed Insights ingestion.

Configuration:

Vercel Project Settings -> enable Web Analytics and Speed Insights -> set `ANALYTICS_ENABLED=true` in Vercel environment variables.

## Error Handling

- If `ANALYTICS_ENABLED` is missing or any value other than `"true"`, analytics components do not render.
- Missing Vercel project-side enablement should not break local builds; it only means Vercel dashboards may not receive data.
- Analytics integration should not affect Payload admin routes.

## Security And Privacy

- No custom visitor tracking is added.
- No cookies, IP hashes, user-agent hashes, or per-view MongoDB writes are added in this slice.
- No secrets are introduced.
- The only new environment flag is non-secret.

## Testing And Verification

Minimum automated checks:

- `pnpm lint`
- `pnpm build`
- `git diff --check`

Manual checks:

1. With `ANALYTICS_ENABLED=false`, run the app and verify public pages still render.
2. Temporarily set `ANALYTICS_ENABLED=true` locally and verify the app still builds/renders.
3. On Vercel, enable Web Analytics and Speed Insights for the project.
4. Set `ANALYTICS_ENABLED=true` in Vercel environment variables.
5. Deploy and open public pages.
6. Confirm Vercel Web Analytics records page views after Vercel's normal dashboard delay.
7. Confirm Speed Insights records performance data after enough traffic or test visits.

## Acceptance Criteria

This slice is done when:

1. `@vercel/analytics` and `@vercel/speed-insights` are installed.
2. Public site layout can render Vercel Web Analytics and Speed Insights when `ANALYTICS_ENABLED=true`.
3. Analytics is disabled by default in local `.env.example`.
4. README documents Vercel setup and verification.
5. No `PostMetrics`, custom counters, cookies, or analytics API routes are added.
6. `pnpm lint` and `pnpm build` pass.

## Follow-Up Slices

Recommended later slices:

1. Internal post metrics dashboard.
2. Dark theme.
3. Improved anti-spam for comments.
4. Optional revalidation endpoint or server action after publication.
