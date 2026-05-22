# Blog Media Storage Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Payload media uploads production-safe on Vercel by storing images in Vercel Blob and rendering post cover images on the public blog.

**Architecture:** Use Payload's official `@payloadcms/storage-vercel-blob` adapter for the existing `media` collection. Public pages keep reading posts through Payload Local API and render resolved `coverImage` objects through a small `next/image` wrapper.

**Tech Stack:** Next.js 16, React 19, TypeScript, PayloadCMS 3.84.x, `@payloadcms/storage-vercel-blob`, Vercel Blob, MongoDB, pnpm.

---

## Source Documents

- Product PRD: `docs/_MConverter.eu_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Foundation design: `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- Media design: `docs/superpowers/specs/2026-05-23-blog-media-storage-design.md`

## Implementation Rules

- Use @test-driven-development where helper behavior can be isolated.
- Use @verification-before-completion before claiming this slice is done.
- Do not implement comments, projects, RSS, analytics, or rich text embedded media in this slice.
- Do not commit unrelated dirty worktree files.
- Do not commit real Blob tokens or admin credentials.

## File Map

Create:

- `lib/media.ts`: type guards and URL extraction helpers for Payload `Media`.
- `components/media-image.tsx`: reusable `next/image` wrapper for Payload media.

Modify:

- `package.json`: add `@payloadcms/storage-vercel-blob`.
- `pnpm-lock.yaml`: dependency lock update.
- `.env.example`: add Blob vars and remove stray credential-like line.
- `payload.config.ts`: configure Vercel Blob storage adapter with safe production behavior.
- `collections/Media.ts`: restrict uploads to image MIME types and add image size settings.
- `next.config.ts`: allow the exact Blob hostname for `next/image`.
- `components/post-card.tsx`: render cover image when present.
- `app/(site)/blog/[slug]/page.tsx`: render cover image and Open Graph image metadata.
- `README.md`: document Blob setup and verification.
- `payload-types.ts`: regenerate after collection/config updates.

## Chunk 1: Dependency And Environment Contract

### Task 1: Install Payload Vercel Blob adapter

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Add dependency**
  Run:
  ```bash
  pnpm add @payloadcms/storage-vercel-blob
  ```
  Expected: dependency is added to `package.json` and `pnpm-lock.yaml`.

- [ ] **Step 2: Confirm install remains reproducible**
  Run:
  ```bash
  pnpm install --frozen-lockfile
  ```
  Expected: install completes without lockfile changes.

### Task 2: Clean and extend env example

**Files:**

- Modify: `.env.example`

- [ ] **Step 1: Remove credential-like line**
  Delete the stray line:
  ```dotenv
  test@sdsd.ru:Admin123456!
  ```

- [ ] **Step 2: Add Blob env vars**
  Keep the existing variables and add:
  ```dotenv
  BLOB_READ_WRITE_TOKEN=
  NEXT_PUBLIC_BLOB_HOSTNAME=
  ```

- [ ] **Step 3: Verify no secret-like data remains**
  Run:
  ```bash
  rg -n "Admin123456|test@sdsd|BLOB_READ_WRITE_TOKEN=.+" .env.example
  ```
  Expected: no output.

## Chunk 2: Payload Storage Configuration

### Task 3: Configure Vercel Blob storage adapter

**Files:**

- Modify: `payload.config.ts`

- [ ] **Step 1: Import adapter**
  Add:
  ```ts
  import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
  ```

- [ ] **Step 2: Add production guard**
  Add near existing env checks:
  ```ts
  const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN;
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

  if (isVercel && !blobReadWriteToken) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required for media uploads on Vercel");
  }
  ```

- [ ] **Step 3: Add storage adapter**
  In `buildConfig`, add:
  ```ts
  storage: [
    vercelBlobStorage({
      enabled: Boolean(blobReadWriteToken),
      clientUploads: true,
      collections: {
        media: {
          prefix: "media",
        },
      },
      token: blobReadWriteToken,
    }),
  ],
  ```
  Expected behavior:
  - local dev without token can still work with local upload storage;
  - Vercel without token fails early;
  - token-present environments upload `media` files to Vercel Blob.

- [ ] **Step 4: Run TypeScript feedback loop**
  Run:
  ```bash
  pnpm generate:types
  ```
  Expected: if the installed adapter option names differ, TypeScript reports them. Adjust only to match the installed package docs/types.

### Task 4: Restrict and size Media uploads

**Files:**

- Modify: `collections/Media.ts`

- [ ] **Step 1: Replace `upload: true` with upload config**
  Use:
  ```ts
  upload: {
    adminThumbnail: "thumbnail",
    focalPoint: true,
    imageSizes: [
      {
        name: "thumbnail",
        width: 360,
        height: 240,
        position: "centre",
      },
      {
        name: "cover",
        width: 1600,
        height: 900,
        position: "centre",
      },
    ],
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
  ```

- [ ] **Step 2: Keep access unchanged**
  Confirm:
  - public read remains allowed;
  - create/update/delete remain admin-only.

- [ ] **Step 3: Regenerate types**
  Run:
  ```bash
  pnpm generate:types
  ```
  Expected: `payload-types.ts` includes image size metadata if Payload exposes it.

## Chunk 3: Next Image Configuration

### Task 5: Configure remote Blob hostname

**Files:**

- Modify: `next.config.ts`

- [ ] **Step 1: Add remote pattern helper**
  Use:
  ```ts
  import { withPayload } from "@payloadcms/next/withPayload";
  import type { NextConfig } from "next";

  const blobHostname = process.env.NEXT_PUBLIC_BLOB_HOSTNAME;

  const nextConfig: NextConfig = {
    images: {
      remotePatterns: blobHostname
        ? [
            {
              protocol: "https",
              hostname: blobHostname,
              port: "",
              pathname: "/**",
            },
          ]
        : [],
    },
  };

  export default withPayload(nextConfig);
  ```

- [ ] **Step 2: Build without Blob hostname**
  Run:
  ```bash
  pnpm build
  ```
  Expected: build does not fail only because `NEXT_PUBLIC_BLOB_HOSTNAME` is blank.

- [ ] **Step 3: Build with Blob hostname**
  If a Blob hostname is available, run:
  ```bash
  NEXT_PUBLIC_BLOB_HOSTNAME=<store-id>.public.blob.vercel-storage.com pnpm build
  ```
  Expected: build succeeds with remote pattern configured.

## Chunk 4: Media Rendering Helpers

### Task 6: Add media type helpers

**Files:**

- Create: `lib/media.ts`

- [ ] **Step 1: Add helper functions**
  ```ts
  import type { Media } from "../payload-types";

  export function isMedia(value: unknown): value is Media {
    return Boolean(value && typeof value === "object" && "url" in value);
  }

  export function getMediaUrl(value: unknown) {
    if (!isMedia(value)) {
      return null;
    }

    return value.url || null;
  }

  export function getMediaAlt(value: unknown) {
    if (!isMedia(value)) {
      return "";
    }

    return value.alt || "";
  }
  ```

- [ ] **Step 2: Run lint for helper**
  Run:
  ```bash
  pnpm lint
  ```
  Expected: no lint errors from `lib/media.ts`.

### Task 7: Add reusable MediaImage component

**Files:**

- Create: `components/media-image.tsx`

- [ ] **Step 1: Add component**
  ```tsx
  import Image from "next/image";

  import { getMediaAlt, getMediaUrl } from "@/lib/media";

  type Props = {
    className?: string;
    media: unknown;
    priority?: boolean;
    sizes: string;
  };

  export function MediaImage({ className, media, priority = false, sizes }: Props) {
    const url = getMediaUrl(media);

    if (!url) {
      return null;
    }

    return (
      <div className={className}>
        <Image
          alt={getMediaAlt(media)}
          className="object-cover"
          fill
          priority={priority}
          sizes={sizes}
          src={url}
        />
      </div>
    );
  }
  ```

- [ ] **Step 2: Keep layout stable**
  Every caller must pass a class with `relative` and an aspect ratio, for example `relative aspect-[16/9] overflow-hidden bg-zinc-100`.

## Chunk 5: Public Cover Images

### Task 8: Render covers on blog cards

**Files:**

- Modify: `components/post-card.tsx`

- [ ] **Step 1: Import MediaImage**
  Add:
  ```ts
  import { MediaImage } from "./media-image";
  ```

- [ ] **Step 2: Render optional cover**
  Near the top of the article, add:
  ```tsx
  <MediaImage
    className="relative mb-5 aspect-[16/9] overflow-hidden bg-zinc-100"
    media={post.coverImage}
    sizes="(min-width: 768px) 720px, 100vw"
  />
  ```
  Expected: posts without cover images render without an empty visual gap.

- [ ] **Step 3: Verify card still renders tags/date/excerpt**
  Run:
  ```bash
  pnpm lint
  ```
  Expected: no lint errors.

### Task 9: Render cover on post detail page

**Files:**

- Modify: `app/(site)/blog/[slug]/page.tsx`

- [ ] **Step 1: Import media helpers**
  Add:
  ```ts
  import { MediaImage } from "@/components/media-image";
  import { getMediaUrl } from "@/lib/media";
  ```

- [ ] **Step 2: Add Open Graph image metadata**
  In `generateMetadata`, derive:
  ```ts
  const coverUrl = getMediaUrl(post.coverImage);
  ```
  Then include:
  ```ts
  openGraph: {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    images: coverUrl ? [{ url: coverUrl }] : undefined,
  },
  ```

- [ ] **Step 3: Render article cover**
  Below the excerpt and before rich text content, add:
  ```tsx
  <MediaImage
    className="relative mt-8 aspect-[16/9] overflow-hidden bg-zinc-100"
    media={post.coverImage}
    priority
    sizes="(min-width: 768px) 768px, 100vw"
  />
  ```

- [ ] **Step 4: Verify missing cover is safe**
  Run:
  ```bash
  pnpm lint
  ```
  Expected: no lint errors; code path does not assume `coverImage` is populated.

## Chunk 6: Documentation

### Task 10: Update README media setup

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add Blob env docs**
  Document:
  ```dotenv
  BLOB_READ_WRITE_TOKEN=...
  NEXT_PUBLIC_BLOB_HOSTNAME=<store-id>.public.blob.vercel-storage.com
  ```

- [ ] **Step 2: Add Vercel setup notes**
  Explain:
  - add Vercel Blob storage to the Vercel project;
  - set `BLOB_READ_WRITE_TOKEN` in Vercel env vars;
  - set `NEXT_PUBLIC_BLOB_HOSTNAME` to the public Blob host;
  - keep the token out of git.

- [ ] **Step 3: Add local behavior note**
  Explain that local development can run without Blob token, but the media verification path requires a real token.

## Chunk 7: Verification

### Task 11: Regenerate Payload artifacts

**Files:**

- Modify: `payload-types.ts`
- Potentially modify: `app/(payload)/admin/importMap.js`

- [ ] **Step 1: Generate import map**
  Run:
  ```bash
  pnpm generate:importmap
  ```
  Expected: command succeeds.

- [ ] **Step 2: Generate types**
  Run:
  ```bash
  pnpm generate:types
  ```
  Expected: command succeeds and `payload-types.ts` reflects media upload config.

### Task 12: Static checks

**Files:**

- All changed implementation files.

- [ ] **Step 1: Lint**
  Run:
  ```bash
  pnpm lint
  ```
  Expected: no ESLint errors.

- [ ] **Step 2: Build without Blob env**
  Run:
  ```bash
  pnpm build
  ```
  Expected: build succeeds locally without Blob env vars.

- [ ] **Step 3: Build with Blob hostname when available**
  Run:
  ```bash
  NEXT_PUBLIC_BLOB_HOSTNAME=<store-id>.public.blob.vercel-storage.com pnpm build
  ```
  Expected: build succeeds with remote image allowlist.

### Task 13: Manual media happy path

**Files:**

- No file edits unless verification exposes a defect.

- [ ] **Step 1: Configure local Blob env**
  In local `.env`, set:
  ```dotenv
  BLOB_READ_WRITE_TOKEN=<real-token>
  NEXT_PUBLIC_BLOB_HOSTNAME=<store-id>.public.blob.vercel-storage.com
  ```

- [ ] **Step 2: Start services**
  Run:
  ```bash
  docker compose up -d mongo
  pnpm dev
  ```
  Expected: app serves on `http://localhost:3000`.

- [ ] **Step 3: Upload image**
  Open `/admin`, upload a JPEG/PNG/WebP in `Media`.
  Expected: media saves and its URL points to `https://<store-id>.public.blob.vercel-storage.com/...`.

- [ ] **Step 4: Attach cover image**
  Edit or create a published post and select the uploaded image as `coverImage`.
  Expected: post saves.

- [ ] **Step 5: Verify public rendering**
  Open:
  ```text
  http://localhost:3000/blog
  http://localhost:3000/blog/<slug>
  ```
  Expected: cover image appears on the blog card and post detail page.

- [ ] **Step 6: Verify non-image rejection**
  Try uploading a `.txt` or `.pdf` file into `Media`.
  Expected: upload is rejected by MIME type restrictions.

- [ ] **Step 7: Verify production guard**
  Run:
  ```bash
  VERCEL=1 BLOB_READ_WRITE_TOKEN= pnpm build
  ```
  Expected: build or config initialization fails with `BLOB_READ_WRITE_TOKEN is required for media uploads on Vercel`.

### Task 14: Final diff review

**Files:**

- Stage only files from this media slice.

- [ ] **Step 1: Check status**
  Run:
  ```bash
  git status --short
  git diff --check
  ```
  Expected: no whitespace errors; unrelated existing files are identified.

- [ ] **Step 2: Commit if requested**
  If the user wants a commit, stage only this slice:
  ```bash
  git add package.json pnpm-lock.yaml .env.example payload.config.ts collections/Media.ts next.config.ts lib/media.ts components/media-image.ts components/post-card.ts 'app/(site)/blog/[slug]/page.tsx' README.md payload-types.ts 'app/(payload)/admin/importMap.js'
  git commit -m "feat: store blog media in Vercel Blob"
  ```

## Done Definition

- `.env.example` has no credential-like stray line.
- `@payloadcms/storage-vercel-blob` is installed.
- Payload uses Vercel Blob for `media` when `BLOB_READ_WRITE_TOKEN` is set.
- Vercel production fails early if Blob token is missing.
- `Media` accepts expected image MIME types only.
- `next/image` is allowlisted for the exact Blob hostname.
- Blog index renders cover images when present.
- Post detail renders cover images when present.
- Post metadata includes cover Open Graph image when present.
- README documents Blob setup.
- `pnpm generate:importmap`, `pnpm generate:types`, `pnpm lint`, and `pnpm build` pass.

