# Blog Foundation Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working Next.js + PayloadCMS + MongoDB blog foundation where an admin can publish a post and visitors can read it at `/blog/[slug]`.

**Architecture:** Keep one monolithic Next.js App Router application. PayloadCMS provides admin, auth, collections, and database access through MongoDB; public pages read published content server-side through Payload Local API helpers.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, PayloadCMS v3, `@payloadcms/db-mongodb`, `@payloadcms/next`, MongoDB, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Design spec: `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`

## Implementation Rules

- Use @test-driven-development for helper behavior where practical.
- Use @verification-before-completion before claiming the slice is complete.
- Do not add comments, analytics, projects pages, RSS, or Vercel Blob in this slice.
- Do not commit unrelated dirty worktree files.
- Prefer small focused files over one large CMS/config file.

## File Map

Create:

- `.env.example`: documented local/prod environment variables.
- `payload.config.ts`: Payload root config.
- `payload-types.ts`: generated Payload types.
- `collections/Users.ts`: admin users collection.
- `collections/Media.ts`: upload collection.
- `collections/Tags.ts`: tags collection.
- `collections/Posts.ts`: posts collection.
- `globals/SiteSettings.ts`: site settings global, if Payload global setup is clean.
- `lib/payload.ts`: server-side Payload Local API bootstrap helper.
- `lib/posts.ts`: public post query helpers.
- `lib/seo.ts`: site URL and metadata helpers.
- `components/site-header.tsx`: small public navigation.
- `components/post-card.tsx`: blog index list item.
- `components/rich-text.tsx`: Payload rich text renderer wrapper.
- `app/(payload)/admin/[[...segments]]/page.tsx`: Payload admin page.
- `app/(payload)/api/[...slug]/route.ts`: Payload REST route handlers.
- `app/blog/page.tsx`: blog index page.
- `app/blog/[slug]/page.tsx`: post detail page.
- `app/robots.ts`: robots metadata route.
- `app/sitemap.ts`: sitemap metadata route.

Modify:

- `package.json`: add Payload dependencies and scripts.
- `next.config.ts`: wrap config with Payload integration if required by installed Payload version.
- `tsconfig.json`: add `@payload-config` path alias if required by Payload admin/import map.
- `app/layout.tsx`: update language/site metadata shell without adding public navigation around Payload admin.
- `app/page.tsx`: replace starter page with basic personal home.
- `app/globals.css`: remove starter-specific assumptions and define the basic public layout tokens.
- `README.md`: replace starter README with local setup and verification instructions.
- `docker-compose.yaml`: keep local Mongo flow aligned with `DATABASE_URI`.

## Chunk 1: Dependencies And Project Wiring

### Task 1: Add Payload packages and scripts

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install dependencies**
  Run:
  ```bash
  pnpm add payload @payloadcms/next @payloadcms/db-mongodb @payloadcms/richtext-lexical sharp
  ```
  Expected: dependencies are added and `pnpm-lock.yaml` updates.

- [ ] **Step 2: Add scripts**
  In `package.json`, add:
  ```json
  {
    "payload": "payload",
    "generate:types": "payload generate:types",
    "generate:importmap": "payload generate:importmap"
  }
  ```
  Keep existing `dev`, `build`, `start`, and `lint`.

- [ ] **Step 3: Verify dependency graph**
  Run:
  ```bash
  pnpm install --frozen-lockfile
  ```
  Expected: install completes without lockfile changes.

### Task 2: Add environment contract

**Files:**

- Create: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Create `.env.example`**
  Add:
  ```dotenv
  DATABASE_URI=mongodb://127.0.0.1:27017/blog
  PAYLOAD_SECRET=replace-with-a-long-random-secret
  NEXT_PUBLIC_SITE_URL=http://localhost:3000
  ```

- [ ] **Step 2: Document env vars in README**
  Explain:
  - local MongoDB can come from `docker compose up mongo`;
  - production `DATABASE_URI` should point to MongoDB Atlas Free Tier;
  - `PAYLOAD_SECRET` must never be committed with a real value;
  - `NEXT_PUBLIC_SITE_URL` should be the Vercel URL before a custom domain exists.

### Task 3: Configure Next/Payload integration

**Files:**

- Modify: `next.config.ts`
- Modify: `tsconfig.json`

- [ ] **Step 1: Update Next config**
  If the installed Payload version requires `withPayload`, wrap the existing Next config:
  ```ts
  import { withPayload } from "@payloadcms/next/withPayload";
  import type { NextConfig } from "next";

  const nextConfig: NextConfig = {};

  export default withPayload(nextConfig);
  ```
  If the installed version no longer requires this wrapper, keep `next.config.ts` minimal and document that decision in the implementation notes.

- [ ] **Step 2: Add Payload config alias**
  In `tsconfig.json`, extend `compilerOptions.paths`:
  ```json
  {
    "@/*": ["./*"],
    "@payload-config": ["./payload.config.ts"]
  }
  ```

## Chunk 2: Payload CMS Model

### Task 4: Create admin access helpers

**Files:**

- Create: `collections/access.ts`

- [ ] **Step 1: Add complete access helper file**
  ```ts
  import type { Access } from "payload";

  export const isAdmin: Access = ({ req: { user } }) => {
    return Boolean(user && user.role === "admin");
  };

  export const isAdminOrFirstUser: Access = async ({ req: { payload, user } }) => {
    if (user && user.role === "admin") {
      return true;
    }

    const users = await payload.count({
      collection: "users",
    });

    return users.totalDocs === 0;
  };

  export const publishedOrAdmin: Access = ({ req: { user } }) => {
    if (user && user.role === "admin") {
      return true;
    }

    return {
      status: {
        equals: "published",
      },
    };
  };
  ```

### Task 5: Create Users collection

**Files:**

- Create: `collections/Users.ts`

- [ ] **Step 1: Add collection**
  ```ts
  import type { CollectionConfig } from "payload";

  import { isAdmin, isAdminOrFirstUser } from "./access";

  export const Users: CollectionConfig = {
    slug: "users",
    auth: true,
    admin: {
      useAsTitle: "email",
    },
    access: {
      create: isAdminOrFirstUser,
      read: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
    fields: [
      {
        name: "displayName",
        type: "text",
        required: true,
      },
      {
        name: "role",
        type: "select",
        required: true,
        defaultValue: "admin",
        options: [{ label: "Admin", value: "admin" }],
      },
    ],
  };
  ```

### Task 6: Create Media collection

**Files:**

- Create: `collections/Media.ts`

- [ ] **Step 1: Add collection**
  ```ts
  import type { CollectionConfig } from "payload";

  import { isAdmin } from "./access";

  export const Media: CollectionConfig = {
    slug: "media",
    upload: true,
    access: {
      create: isAdmin,
      read: () => true,
      update: isAdmin,
      delete: isAdmin,
    },
    fields: [
      {
        name: "alt",
        type: "text",
        required: true,
      },
    ],
  };
  ```

### Task 7: Create Tags collection

**Files:**

- Create: `collections/Tags.ts`

- [ ] **Step 1: Add collection**
  ```ts
  import type { CollectionConfig } from "payload";

  import { isAdmin } from "./access";

  export const Tags: CollectionConfig = {
    slug: "tags",
    admin: {
      useAsTitle: "name",
    },
    access: {
      create: isAdmin,
      read: () => true,
      update: isAdmin,
      delete: isAdmin,
    },
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
      },
      {
        name: "slug",
        type: "text",
        required: true,
        unique: true,
      },
      {
        name: "description",
        type: "textarea",
      },
    ],
  };
  ```

### Task 8: Create Posts collection

**Files:**

- Create: `collections/Posts.ts`

- [ ] **Step 1: Add collection**
  ```ts
  import type { CollectionConfig } from "payload";

  import { isAdmin, publishedOrAdmin } from "./access";

  export const Posts: CollectionConfig = {
    slug: "posts",
    admin: {
      defaultColumns: ["title", "status", "publishedAt", "updatedAt"],
      useAsTitle: "title",
    },
    access: {
      create: isAdmin,
      read: publishedOrAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
    fields: [
      {
        name: "title",
        type: "text",
        required: true,
      },
      {
        name: "slug",
        type: "text",
        required: true,
        unique: true,
      },
      {
        name: "excerpt",
        type: "textarea",
        required: true,
      },
      {
        name: "content",
        type: "richText",
        required: true,
      },
      {
        name: "coverImage",
        type: "upload",
        relationTo: "media",
      },
      {
        name: "status",
        type: "select",
        required: true,
        defaultValue: "draft",
        options: [
          { label: "Draft", value: "draft" },
          { label: "Published", value: "published" },
          { label: "Archived", value: "archived" },
        ],
      },
      {
        name: "tags",
        type: "relationship",
        relationTo: "tags",
        hasMany: true,
      },
      {
        name: "author",
        type: "relationship",
        relationTo: "users",
        required: true,
      },
      {
        name: "publishedAt",
        type: "date",
        admin: {
          date: {
            pickerAppearance: "dayAndTime",
          },
        },
      },
      {
        name: "readingTime",
        type: "number",
        min: 1,
      },
      {
        name: "seoTitle",
        type: "text",
      },
      {
        name: "seoDescription",
        type: "textarea",
      },
    ],
  };
  ```

### Task 9: Create SiteSettings global

**Files:**

- Create: `globals/SiteSettings.ts`

- [ ] **Step 1: Add global**
  ```ts
  import type { GlobalConfig } from "payload";

  import { isAdmin } from "../collections/access";

  export const SiteSettings: GlobalConfig = {
    slug: "site-settings",
    access: {
      read: () => true,
      update: isAdmin,
    },
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        defaultValue: "Personal Engineering Blog",
      },
      {
        name: "headline",
        type: "text",
        required: true,
        defaultValue: "Personal engineering blog",
      },
      {
        name: "bio",
        type: "textarea",
      },
      {
        name: "contactEmail",
        type: "email",
      },
      {
        name: "socialLinks",
        type: "array",
        fields: [
          {
            name: "label",
            type: "text",
            required: true,
          },
          {
            name: "url",
            type: "text",
            required: true,
          },
        ],
      },
      {
        name: "seoTitle",
        type: "text",
      },
      {
        name: "seoDescription",
        type: "textarea",
      },
    ],
  };
  ```

### Task 10: Create Payload config

**Files:**

- Create: `payload.config.ts`

- [ ] **Step 1: Add config**
  ```ts
  import { mongooseAdapter } from "@payloadcms/db-mongodb";
  import { lexicalEditor } from "@payloadcms/richtext-lexical";
  import path from "path";
  import { buildConfig } from "payload";
  import { fileURLToPath } from "url";

  import { Media } from "./collections/Media";
  import { Posts } from "./collections/Posts";
  import { Tags } from "./collections/Tags";
  import { Users } from "./collections/Users";
  import { SiteSettings } from "./globals/SiteSettings";

  const filename = fileURLToPath(import.meta.url);
  const dirname = path.dirname(filename);

  const databaseUri = process.env.DATABASE_URI;
  const payloadSecret = process.env.PAYLOAD_SECRET;

  if (!databaseUri) {
    throw new Error("DATABASE_URI is required");
  }

  if (!payloadSecret) {
    throw new Error("PAYLOAD_SECRET is required");
  }

  export default buildConfig({
    admin: {
      user: "users",
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Users, Media, Tags, Posts],
    globals: [SiteSettings],
    editor: lexicalEditor(),
    secret: payloadSecret,
    typescript: {
      outputFile: path.resolve(dirname, "payload-types.ts"),
    },
    db: mongooseAdapter({
      url: databaseUri,
    }),
  });
  ```

### Task 11: Add Payload Next routes

**Files:**

- Create: `app/(payload)/admin/[[...segments]]/page.tsx`
- Create: `app/(payload)/api/[...slug]/route.ts`

- [ ] **Step 1: Add admin route**
  Use the installed `@payloadcms/next/views` exports for `RootPage` and metadata generation. Expected shape:
  ```tsx
  import configPromise from "@payload-config";
  import { RootPage, generatePageMetadata } from "@payloadcms/next/views";

  type Args = {
    params: Promise<{ segments: string[] }>;
    searchParams: Promise<Record<string, string | string[]>>;
  };

  export const generateMetadata = ({ params, searchParams }: Args) => {
    return generatePageMetadata({ config: configPromise, params, searchParams });
  };

  export default function Page({ params, searchParams }: Args) {
    return RootPage({ config: configPromise, params, searchParams });
  }
  ```
  Adjust only if TypeScript reports the installed Payload signature differs.

- [ ] **Step 2: Add API route**
  Use the installed `@payloadcms/next/routes` exports. Expected shape:
  ```ts
  import configPromise from "@payload-config";
  import {
    REST_DELETE,
    REST_GET,
    REST_OPTIONS,
    REST_PATCH,
    REST_POST,
  } from "@payloadcms/next/routes";

  export const GET = REST_GET(configPromise);
  export const POST = REST_POST(configPromise);
  export const DELETE = REST_DELETE(configPromise);
  export const PATCH = REST_PATCH(configPromise);
  export const OPTIONS = REST_OPTIONS(configPromise);
  ```
  Adjust only if TypeScript reports the installed Payload signature differs.

- [ ] **Step 3: Generate Payload artifacts**
  Run:
  ```bash
  pnpm generate:importmap
  pnpm generate:types
  ```
  Expected: import map and `payload-types.ts` are generated or updated.

## Chunk 3: Public Data Helpers

### Task 12: Add Payload Local API helper

**Files:**

- Create: `lib/payload.ts`

- [ ] **Step 1: Add helper**
  ```ts
  import configPromise from "@payload-config";
  import { getPayload } from "payload";

  export async function getPayloadClient() {
    return getPayload({ config: configPromise });
  }
  ```

### Task 13: Add SEO helper

**Files:**

- Create: `lib/seo.ts`

- [ ] **Step 1: Add site URL helper**
  ```ts
  export function getSiteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  }
  ```

- [ ] **Step 2: Add absolute URL helper**
  ```ts
  export function absoluteUrl(path: string) {
    return new URL(path, getSiteUrl()).toString();
  }
  ```

### Task 14: Add post query helpers

**Files:**

- Create: `lib/posts.ts`

- [ ] **Step 1: Write helper tests if a test runner is already introduced**
  If no test runner exists yet, skip automated tests for this helper in this slice and rely on build plus manual CMS verification.

- [ ] **Step 2: Add helpers**
  ```ts
  import { notFound } from "next/navigation";

  import type { Post } from "../payload-types";
  import { getPayloadClient } from "./payload";

  export async function getPublishedPosts() {
    const payload = await getPayloadClient();

    const result = await payload.find({
      collection: "posts",
      depth: 2,
      sort: "-publishedAt",
      where: {
        status: {
          equals: "published",
        },
      },
    });

    return result.docs as Post[];
  }

  export async function getPublishedPostBySlug(slug: string) {
    const payload = await getPayloadClient();

    const result = await payload.find({
      collection: "posts",
      depth: 2,
      limit: 1,
      where: {
        and: [
          {
            slug: {
              equals: slug,
            },
          },
          {
            status: {
              equals: "published",
            },
          },
        ],
      },
    });

    const post = result.docs[0] as Post | undefined;

    if (!post) {
      notFound();
    }

    return post;
  }
  ```

## Chunk 4: Public UI

### Task 15: Add shared public components

**Files:**

- Create: `components/site-header.tsx`
- Create: `components/post-card.tsx`
- Create: `components/rich-text.tsx`

- [ ] **Step 1: Add site header**
  ```tsx
  import Link from "next/link";

  export function SiteHeader() {
    return (
      <header className="border-b border-zinc-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link className="font-semibold text-zinc-950" href="/">
            Personal Engineering Blog
          </Link>
          <div className="flex items-center gap-4 text-sm text-zinc-600">
            <Link className="hover:text-zinc-950" href="/blog">
              Blog
            </Link>
            <Link className="hover:text-zinc-950" href="/admin">
              Admin
            </Link>
          </div>
        </nav>
      </header>
    );
  }
  ```

- [ ] **Step 2: Add post card**
  ```tsx
  import Link from "next/link";

  import type { Post } from "../payload-types";

  function formatDate(value?: null | string) {
    if (!value) return "Unpublished";
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
    }).format(new Date(value));
  }

  export function PostCard({ post }: { post: Post }) {
    return (
      <article className="border-b border-zinc-200 py-8">
        <p className="text-sm text-zinc-500">{formatDate(post.publishedAt)}</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-950">
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600">{post.excerpt}</p>
      </article>
    );
  }
  ```

- [ ] **Step 3: Add minimal rich text renderer**
  Prefer a Payload-supported rich text renderer package if already installed by the selected Payload setup. If not available, add a narrow fallback component that renders the plain JSON structure conservatively and open a follow-up to improve rich text rendering.

### Task 16: Update app shell and home page

**Files:**

- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Update metadata in layout**
  Set default title/description to the site/blog identity, and set `lang="en"` unless the public content will be Russian-first.

- [ ] **Step 2: Keep Payload admin out of the public shell**
  Do not render `SiteHeader` from `app/layout.tsx`, because that layout also wraps `/admin`. Render `SiteHeader` inside public pages (`/`, `/blog`, `/blog/[slug]`) or introduce a public-only route group if you choose to move routes.

- [ ] **Step 3: Replace starter home page**
  Use a simple first screen with `SiteHeader`, author positioning, link to `/blog`, and a short note that content is CMS-managed.

- [ ] **Step 4: Simplify global CSS**
  Keep Tailwind import, light background, readable foreground, and remove starter-specific dark-mode assumptions unless intentionally retained.

### Task 17: Add blog index

**Files:**

- Create: `app/blog/page.tsx`

- [ ] **Step 1: Add metadata**
  Export `metadata` with blog title and description.

- [ ] **Step 2: Render posts**
  Fetch `getPublishedPosts()`, render empty state when length is zero, otherwise render `PostCard` list.

- [ ] **Step 3: Verify draft filtering manually**
  After admin is working, create one draft and one published post. Expected: only published post appears.

### Task 18: Add post detail page

**Files:**

- Create: `app/blog/[slug]/page.tsx`

- [ ] **Step 1: Add `generateMetadata`**
  Fetch published post by slug and return title/description fallback rules:
  - `seoTitle || title`
  - `seoDescription || excerpt`

- [ ] **Step 2: Render post**
  Render title, date, excerpt, and rich text content.

- [ ] **Step 3: Confirm inaccessible states**
  Expected:
  - unknown slug -> 404
  - draft slug -> 404
  - archived slug -> 404

### Task 19: Add robots and sitemap

**Files:**

- Create: `app/robots.ts`
- Create: `app/sitemap.ts`

- [ ] **Step 1: Add robots**
  Use `MetadataRoute.Robots`, allow public paths, disallow `/admin`, and include sitemap URL.

- [ ] **Step 2: Add sitemap**
  Use `MetadataRoute.Sitemap`, include `/`, `/blog`, and all published post URLs from `getPublishedPosts()`.

## Chunk 5: Local Development Documentation

### Task 20: Align Docker and README

**Files:**

- Modify: `docker-compose.yaml`
- Modify: `README.md`

- [ ] **Step 1: Check local Mongo hostname contract**
  Keep both local process and Docker process understandable:
  - host process: `mongodb://127.0.0.1:27017/blog`
  - compose service process: `mongodb://mongo:27017/blog`

- [ ] **Step 2: Update README commands**
  Document:
  ```bash
  cp .env.example .env
  docker compose up -d mongo
  pnpm install
  pnpm dev
  ```

- [ ] **Step 3: Document admin bootstrap**
  Explain that first admin user is created through Payload's initial auth flow at `/admin`.

## Chunk 6: Verification

### Task 21: Static checks

**Files:**

- All changed implementation files.

- [ ] **Step 1: Generate Payload artifacts**
  Run:
  ```bash
  pnpm generate:importmap
  pnpm generate:types
  ```
  Expected: commands complete successfully.

- [ ] **Step 2: Lint**
  Run:
  ```bash
  pnpm lint
  ```
  Expected: no ESLint errors.

- [ ] **Step 3: Build**
  Run:
  ```bash
  pnpm build
  ```
  Expected: production build completes.

### Task 22: Manual CMS happy path

**Files:**

- No file edits unless verification exposes a defect.

- [ ] **Step 1: Start local services**
  Run:
  ```bash
  docker compose up -d mongo
  pnpm dev
  ```
  Expected: app serves on `http://localhost:3000`.

- [ ] **Step 2: Bootstrap admin**
  Open `http://localhost:3000/admin`.
  Expected: Payload admin loads and allows initial user creation/login.

- [ ] **Step 3: Create published post**
  Create a tag, create a post with `status=published`, slug, excerpt, author, and content.
  Expected: post saves.

- [ ] **Step 4: Verify public pages**
  Open:
  ```text
  http://localhost:3000/blog
  http://localhost:3000/blog/<slug>
  ```
  Expected: blog index and post detail render the published post.

- [ ] **Step 5: Verify draft protection**
  Change the post to `draft`.
  Expected: post disappears from `/blog` and `/blog/<slug>` returns 404.

### Task 23: Commit only foundation implementation

**Files:**

- Stage only files touched by this foundation slice.

- [ ] **Step 1: Review changed files**
  Run:
  ```bash
  git status --short
  git diff --check
  ```
  Expected: no whitespace errors; unrelated pre-existing changes are identified and left untouched.

- [ ] **Step 2: Commit implementation**
  If the user wants commits, commit only this slice's files:
  ```bash
  git add .env.example payload.config.ts collections globals lib components app package.json pnpm-lock.yaml next.config.ts tsconfig.json README.md docker-compose.yaml payload-types.ts
  git commit -m "feat: add blog CMS foundation"
  ```

## Done Definition

- `/admin` works locally.
- A published Payload post appears on `/blog`.
- The same post renders at `/blog/[slug]`.
- Draft and archived posts are hidden publicly.
- `robots.ts` disallows `/admin`.
- `sitemap.ts` includes published posts.
- `.env.example` and README describe local and Vercel/MongoDB Atlas env contracts.
- `pnpm lint` passes.
- `pnpm build` passes.
