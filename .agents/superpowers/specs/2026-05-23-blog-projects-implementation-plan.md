# Blog Projects / Portfolio Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Payload-managed portfolio section with published project list and detail pages.

**Architecture:** Reuse the existing monolithic Next.js + PayloadCMS setup. Add a `Projects` collection with the same admin-only write and published-only public read pattern as posts; public pages read through Payload Local API helpers and reuse existing `MediaImage` / `RichText` components.

**Tech Stack:** Next.js 16, React 19, TypeScript, PayloadCMS 3.84.x, MongoDB, Vercel Blob-backed `Media`, Tailwind CSS 4, pnpm.

---

## Source Documents

- Product PRD: `docs/_MConverter.eu_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Foundation design: `docs/superpowers/specs/2026-05-22-blog-foundation-design.md`
- Media design: `docs/superpowers/specs/2026-05-23-blog-media-storage-design.md`
- Projects design: `docs/superpowers/specs/2026-05-23-blog-projects-design.md`

## Implementation Rules

- Use @test-driven-development where helper behavior can be isolated.
- Use @verification-before-completion before claiming this slice is done.
- Do not implement comments, analytics, RSS, tag pages, or contact forms in this slice.
- Do not modify the Payload admin layout except through collection registration.
- Do not commit unrelated dirty worktree files.

## File Map

Create:

- `collections/Projects.ts`: Payload projects collection.
- `lib/projects.ts`: public project query helpers.
- `components/project-card.tsx`: public project list card.
- `components/project-links.tsx`: reusable demo/repository link row.
- `app/(site)/projects/page.tsx`: projects index page.
- `app/(site)/projects/[slug]/page.tsx`: project detail page.

Modify:

- `payload.config.ts`: import/register `Projects`.
- `components/site-header.tsx`: add Projects nav link.
- `app/(site)/page.tsx`: add Projects CTA/link.
- `app/(site)/sitemap.ts`: include project URLs.
- `payload-types.ts`: regenerate after collection registration.
- `app/(payload)/admin/importMap.js`: regenerate if Payload updates it.
- `README.md`: optionally add a short manual verification line for projects.

## Chunk 1: Payload Projects Collection

### Task 1: Create Projects collection

**Files:**

- Create: `collections/Projects.ts`

- [ ] **Step 1: Add collection config**
  ```ts
  import type { CollectionConfig } from "payload";

  import { isAdmin, publishedOrAdmin } from "./access.ts";

  export const Projects: CollectionConfig = {
    slug: "projects",
    admin: {
      defaultColumns: ["title", "status", "featured", "sortOrder", "updatedAt"],
      listSearchableFields: ["title", "slug", "summary"],
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
        index: true,
      },
      {
        name: "slug",
        type: "text",
        required: true,
        unique: true,
        index: true,
      },
      {
        name: "summary",
        type: "textarea",
        required: true,
      },
      {
        name: "description",
        type: "richText",
        required: true,
      },
      {
        name: "stack",
        type: "array",
        fields: [
          {
            name: "name",
            type: "text",
            required: true,
          },
        ],
      },
      {
        name: "repositoryUrl",
        type: "text",
      },
      {
        name: "demoUrl",
        type: "text",
      },
      {
        name: "coverImage",
        type: "upload",
        relationTo: "media",
        filterOptions: {
          mimeType: { contains: "image" },
        },
      },
      {
        name: "featured",
        type: "checkbox",
        defaultValue: false,
      },
      {
        name: "sortOrder",
        type: "number",
        defaultValue: 100,
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
        name: "publishedAt",
        type: "date",
        admin: {
          date: {
            pickerAppearance: "dayAndTime",
          },
        },
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

- [ ] **Step 2: Check access reuse**
  Confirm `publishedOrAdmin` in `collections/access.ts` filters by `status = published`, which matches the new collection.

### Task 2: Register Projects in Payload config

**Files:**

- Modify: `payload.config.ts`

- [ ] **Step 1: Import Projects**
  Add:
  ```ts
  import { Projects } from "./collections/Projects.ts";
  ```

- [ ] **Step 2: Register collection**
  Update:
  ```ts
  collections: [Users, Media, Tags, Posts, Projects],
  ```

- [ ] **Step 3: Generate types**
  Run:
  ```bash
  pnpm generate:types
  ```
  Expected: `payload-types.ts` includes `Project` and `projects` in the generated config.

## Chunk 2: Public Project Data Helpers

### Task 3: Add project query helpers

**Files:**

- Create: `lib/projects.ts`

- [ ] **Step 1: Add helper file**
  ```ts
  import { notFound } from "next/navigation";

  import type { Project } from "../payload-types";
  import { getPayloadClient } from "./payload";

  function sortProjects(projects: Project[]) {
    return [...projects].sort((left, right) => {
      const leftSort = left.sortOrder ?? 100;
      const rightSort = right.sortOrder ?? 100;

      if (leftSort !== rightSort) {
        return leftSort - rightSort;
      }

      const leftDate = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
      const rightDate = right.publishedAt ? new Date(right.publishedAt).getTime() : 0;

      return rightDate - leftDate;
    });
  }

  export async function getPublishedProjects() {
    const payload = await getPayloadClient();

    const result = await payload.find({
      collection: "projects",
      depth: 2,
      sort: "sortOrder",
      where: {
        status: {
          equals: "published",
        },
      },
    });

    return sortProjects(result.docs as Project[]);
  }

  export async function getPublishedProjectBySlug(slug: string) {
    const payload = await getPayloadClient();

    const result = await payload.find({
      collection: "projects",
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

    const project = result.docs[0] as Project | undefined;

    if (!project) {
      notFound();
    }

    return project;
  }
  ```

- [ ] **Step 2: Run lint**
  Run:
  ```bash
  pnpm lint
  ```
  Expected: no lint errors from `lib/projects.ts`.

## Chunk 3: Shared Project Components

### Task 4: Add project external links component

**Files:**

- Create: `components/project-links.tsx`

- [ ] **Step 1: Add component**
  ```tsx
  type Props = {
    demoUrl?: null | string;
    repositoryUrl?: null | string;
  };

  export function ProjectLinks({ demoUrl, repositoryUrl }: Props) {
    if (!demoUrl && !repositoryUrl) {
      return null;
    }

    return (
      <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium">
        {demoUrl ? (
          <a
            className="rounded bg-zinc-950 px-3 py-2 text-white hover:bg-zinc-700"
            href={demoUrl}
            rel="noreferrer"
            target="_blank"
          >
            Live demo
          </a>
        ) : null}
        {repositoryUrl ? (
          <a
            className="rounded border border-zinc-300 px-3 py-2 text-zinc-700 hover:border-zinc-500 hover:text-zinc-950"
            href={repositoryUrl}
            rel="noreferrer"
            target="_blank"
          >
            Repository
          </a>
        ) : null}
      </div>
    );
  }
  ```

### Task 5: Add project card component

**Files:**

- Create: `components/project-card.tsx`

- [ ] **Step 1: Add component**
  ```tsx
  import Link from "next/link";

  import type { Project } from "../payload-types";
  import { MediaImage } from "./media-image";
  import { ProjectLinks } from "./project-links";

  function getStack(project: Project) {
    return (project.stack || [])
      .map((item) => item.name)
      .filter((name): name is string => Boolean(name));
  }

  export function ProjectCard({ project }: { project: Project }) {
    const stack = getStack(project);

    return (
      <article className="border-b border-zinc-200 py-8">
        <MediaImage
          className="relative mb-5 aspect-[16/9] overflow-hidden bg-zinc-100"
          media={project.coverImage}
          sizes="(min-width: 768px) 720px, 100vw"
        />
        <h2 className="text-2xl font-semibold text-zinc-950">
          <Link className="hover:text-zinc-700" href={`/projects/${project.slug}`}>
            {project.title}
          </Link>
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600">{project.summary}</p>
        {stack.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {stack.map((item) => (
              <span
                className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        ) : null}
        <ProjectLinks demoUrl={project.demoUrl} repositoryUrl={project.repositoryUrl} />
      </article>
    );
  }
  ```

- [ ] **Step 2: Run lint**
  Run:
  ```bash
  pnpm lint
  ```
  Expected: no lint errors from new components.

## Chunk 4: Public Projects Routes

### Task 6: Add projects index page

**Files:**

- Create: `app/(site)/projects/page.tsx`

- [ ] **Step 1: Add page**
  ```tsx
  import type { Metadata } from "next";

  import { ProjectCard } from "@/components/project-card";
  import { SiteHeader } from "@/components/site-header";
  import { getPublishedProjects } from "@/lib/projects";

  export const metadata: Metadata = {
    title: "Projects | MConverter.eu",
    description: "Selected engineering projects from MConverter.eu.",
  };

  export const dynamic = "force-dynamic";

  export default async function ProjectsPage() {
    const projects = await getPublishedProjects();

    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-6 py-16">
          <h1 className="text-4xl font-semibold text-zinc-950">Projects</h1>
          <p className="mt-4 max-w-2xl text-zinc-600">
            Selected work, experiments, and engineering case studies.
          </p>
          {projects.length > 0 ? (
            <div className="mt-8 bg-white px-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <p className="mt-10 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600">
              No published projects yet.
            </p>
          )}
        </main>
      </div>
    );
  }
  ```

### Task 7: Add project detail page

**Files:**

- Create: `app/(site)/projects/[slug]/page.tsx`

- [ ] **Step 1: Add page**
  ```tsx
  import type { Metadata } from "next";

  import { MediaImage } from "@/components/media-image";
  import { ProjectLinks } from "@/components/project-links";
  import { RichText } from "@/components/rich-text";
  import { SiteHeader } from "@/components/site-header";
  import { getMediaUrl } from "@/lib/media";
  import { getPublishedProjectBySlug } from "@/lib/projects";

  type Args = {
    params: Promise<{
      slug: string;
    }>;
  };

  export const dynamic = "force-dynamic";

  function getStack(project: Awaited<ReturnType<typeof getPublishedProjectBySlug>>) {
    return (project.stack || [])
      .map((item) => item.name)
      .filter((name): name is string => Boolean(name));
  }

  export async function generateMetadata({ params }: Args): Promise<Metadata> {
    const { slug } = await params;
    const project = await getPublishedProjectBySlug(slug);
    const coverUrl = getMediaUrl(project.coverImage);

    return {
      title: project.seoTitle || project.title,
      description: project.seoDescription || project.summary,
      openGraph: {
        title: project.seoTitle || project.title,
        description: project.seoDescription || project.summary,
        images: coverUrl ? [{ url: coverUrl }] : undefined,
      },
    };
  }

  export default async function ProjectPage({ params }: Args) {
    const { slug } = await params;
    const project = await getPublishedProjectBySlug(slug);
    const stack = getStack(project);

    return (
      <div className="min-h-screen bg-zinc-50">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-6 py-16">
          <article className="bg-white px-6 py-10">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Project
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-zinc-950">
              {project.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-zinc-600">
              {project.summary}
            </p>
            <MediaImage
              className="relative mt-8 aspect-[16/9] overflow-hidden bg-zinc-100"
              media={project.coverImage}
              priority
              sizes="(min-width: 768px) 768px, 100vw"
            />
            {stack.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {stack.map((item) => (
                  <span
                    className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600"
                    key={item}
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
            <ProjectLinks
              demoUrl={project.demoUrl}
              repositoryUrl={project.repositoryUrl}
            />
            <RichText content={project.description} />
          </article>
        </main>
      </div>
    );
  }
  ```

- [ ] **Step 2: Run lint**
  Run:
  ```bash
  pnpm lint
  ```
  Expected: no lint errors from project route files.

## Chunk 5: Navigation, Home, And Sitemap

### Task 8: Add Projects to header

**Files:**

- Modify: `components/site-header.tsx`

- [ ] **Step 1: Add Projects link before Blog**
  Inside the nav link group, add:
  ```tsx
  <Link className="hover:text-zinc-950" href="/projects">
    Projects
  </Link>
  ```

### Task 9: Add Projects CTA to home page

**Files:**

- Modify: `app/(site)/page.tsx`

- [ ] **Step 1: Add Projects button**
  Keep the blog CTA and add a `/projects` CTA:
  ```tsx
  <Link
    className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950"
    href="/projects"
  >
    View projects
  </Link>
  ```

- [ ] **Step 2: Keep admin link secondary**
  If there are now three buttons, keep the visual priority:
  - Blog primary.
  - Projects secondary.
  - Admin secondary.

### Task 10: Add projects to sitemap

**Files:**

- Modify: `app/(site)/sitemap.ts`

- [ ] **Step 1: Import project helper**
  Add:
  ```ts
  import { getPublishedProjects } from "@/lib/projects";
  ```

- [ ] **Step 2: Fetch projects**
  Add:
  ```ts
  const projects = await getPublishedProjects();
  ```

- [ ] **Step 3: Add list and detail URLs**
  Add `/projects` and mapped project URLs:
  ```ts
  {
    url: absoluteUrl("/projects"),
    lastModified: now,
  },
  ...projects.map((project) => ({
    url: absoluteUrl(`/projects/${project.slug}`),
    lastModified: project.updatedAt ? new Date(project.updatedAt) : now,
  })),
  ```

## Chunk 6: Documentation And Generated Artifacts

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
  Expected: `payload-types.ts` includes `Project`, `projects`, and related select types.

### Task 12: Update README verification notes

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add project manual path**
  Add a short verification note:
  ```md
  Project CMS path:

  1. Create a project in `/admin` with `status=published`.
  2. Verify it appears at `/projects`.
  3. Open `/projects/<slug>`.
  4. Change it to `draft` and verify the public pages hide it.
  ```

## Chunk 7: Verification

### Task 13: Static checks

**Files:**

- All changed implementation files.

- [ ] **Step 1: Lint**
  Run:
  ```bash
  pnpm lint
  ```
  Expected: no ESLint errors.

- [ ] **Step 2: Build**
  Run:
  ```bash
  pnpm build
  ```
  Expected: production build completes.

### Task 14: Manual Projects happy path

**Files:**

- No file edits unless verification exposes a defect.

- [ ] **Step 1: Start services**
  Run:
  ```bash
  docker compose up -d mongo
  pnpm dev
  ```
  Expected: app serves on `http://localhost:3000`.

- [ ] **Step 2: Create published project**
  In `/admin`, create a project with:
  - `title`
  - `slug`
  - `summary`
  - `description`
  - at least one `stack` item
  - optional `coverImage`
  - `status=published`
  Expected: project saves.

- [ ] **Step 3: Create draft project**
  Create another project with `status=draft`.
  Expected: project saves.

- [ ] **Step 4: Verify list**
  Open:
  ```text
  http://localhost:3000/projects
  ```
  Expected: published project appears; draft project does not.

- [ ] **Step 5: Verify detail**
  Open:
  ```text
  http://localhost:3000/projects/<published-slug>
  ```
  Expected: project detail renders with summary, stack, links, cover image when present, and rich text description.

- [ ] **Step 6: Verify draft protection**
  Open:
  ```text
  http://localhost:3000/projects/<draft-slug>
  ```
  Expected: 404.

- [ ] **Step 7: Verify sitemap**
  Open:
  ```text
  http://localhost:3000/sitemap.xml
  ```
  Expected: `/projects` and published project URL appear; draft project URL is absent.

### Task 15: Final diff review

**Files:**

- Stage only files from this Projects slice.

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
  git add collections/Projects.ts payload.config.ts lib/projects.ts components/project-card.ts components/project-links.ts 'app/(site)/projects' components/site-header.ts 'app/(site)/page.tsx' 'app/(site)/sitemap.ts' README.md payload-types.ts 'app/(payload)/admin/importMap.js'
  git commit -m "feat: add portfolio projects"
  ```

## Done Definition

- `Projects` collection appears in Payload admin.
- Admin can create a project with stack, cover image, links, and status.
- `/projects` lists published projects only.
- `/projects/[slug]` renders published projects only.
- Draft/archived projects are hidden publicly.
- Header and home page link to `/projects`.
- Sitemap includes published project URLs.
- `pnpm generate:importmap` passes.
- `pnpm generate:types` passes.
- `pnpm lint` passes.
- `pnpm build` passes.

