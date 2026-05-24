import Link from "next/link";

import { CuratedLinkCard } from "@/components/curated-link-card";
import { PostCard } from "@/components/post-card";
import { ProjectCard } from "@/components/project-card";
import { SiteHeader } from "@/components/site-header";
import { getRecentPublishedCuratedLinks } from "@/lib/curated-links";
import { getRecentPublishedPostsForFeed } from "@/lib/posts";
import { getFeaturedProjects } from "@/lib/projects";
import {
  getSiteBio,
  getSiteHeadline,
  getSiteName,
  getSiteSettings,
} from "@/lib/site-settings";

export const revalidate = 3600;

function SectionHeader({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-100">
        {title}
      </h2>
      <Link
        className="text-sm font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
        href={href}
      >
        View all
      </Link>
    </div>
  );
}

export default async function Home() {
  const [settings, posts, projects, curatedLinks] = await Promise.all([
    getSiteSettings(),
    getRecentPublishedPostsForFeed(3),
    getFeaturedProjects(3),
    getRecentPublishedCuratedLinks(3),
  ]);
  const siteName = getSiteName(settings);
  const headline = getSiteHeadline(settings);
  const bio = getSiteBio(settings);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {siteName}
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-zinc-950 sm:text-5xl dark:text-zinc-100">
          {headline}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          {bio}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            className="rounded bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            href="/blog"
          >
            Read the blog
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/projects"
          >
            View projects
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/feed"
          >
            Open feed
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/about"
          >
            About
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/contact"
          >
            Contact
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/admin"
          >
            Open admin
          </Link>
        </div>
        <section className="mt-16">
          <SectionHeader href="/blog" title="Recent posts" />
          {posts.length > 0 ? (
            <div className="mt-6 bg-white px-6 dark:bg-zinc-900">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="mt-6 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              No published posts yet.
            </p>
          )}
        </section>
        <section className="mt-16">
          <SectionHeader href="/projects" title="Featured projects" />
          {projects.length > 0 ? (
            <div className="mt-6 bg-white px-6 dark:bg-zinc-900">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <p className="mt-6 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              No featured projects yet.
            </p>
          )}
        </section>
        <section className="mt-16">
          <SectionHeader href="/feed" title="From the feed" />
          {curatedLinks.length > 0 ? (
            <div className="mt-6 bg-white px-6 dark:bg-zinc-900">
              {curatedLinks.map((item) => (
                <CuratedLinkCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <p className="mt-6 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              No curated links published yet.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
