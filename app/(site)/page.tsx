import type { Metadata } from "next";
import Link from "next/link";

import { CuratedLinkCard } from "@/components/curated-link-card";
import { PostCard } from "@/components/post-card";
import { ProjectCard } from "@/components/project-card";
import { SiteHeader } from "@/components/site-header";
import { getRecentPublishedCuratedLinks } from "@/lib/curated-links";
import { getRecentPublishedPostsForFeed } from "@/lib/posts";
import { getFeaturedProjects } from "@/lib/projects";
import { canonicalUrl } from "@/lib/seo";
import {
  getSiteBio,
  getSiteHeadline,
  getSiteName,
  getSiteSettings,
} from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Personal Engineering Blog",
  description: "Personal engineering blog and portfolio.",
  alternates: {
    canonical: canonicalUrl("/"),
  },
  openGraph: {
    title: "Personal Engineering Blog",
    description: "Personal engineering blog and portfolio.",
    url: canonicalUrl("/"),
  },
};

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
      <h2 className="card-title">{title}</h2>
      <Link
        className="text-link text-sm font-medium text-zinc-600 dark:text-zinc-400"
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
    <div className="site-page">
      <SiteHeader />
      <main className="site-main-home">
        <p className="page-eyebrow">{siteName}</p>
        <h1 className="page-title mt-4 max-w-3xl sm:text-5xl">
          {headline}
        </h1>
        <p className="page-lede-lg mt-6 max-w-2xl">{bio}</p>
        <div className="action-row mt-10">
          <Link className="action-link action-primary" href="/blog">
            Read the blog
          </Link>
          <Link className="action-link action-secondary" href="/projects">
            View projects
          </Link>
          <Link className="action-link action-secondary" href="/feed">
            Open feed
          </Link>
          <Link className="action-link action-secondary" href="/about">
            About
          </Link>
          <Link className="action-link action-secondary" href="/contact">
            Contact
          </Link>
          <Link className="action-link action-secondary" href="/admin">
            Open admin
          </Link>
        </div>
        <section className="mt-16">
          <SectionHeader href="/blog" title="Recent posts" />
          {posts.length > 0 ? (
            <div className="list-panel mt-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <p className="empty-state mt-6">
              No published posts yet.
            </p>
          )}
        </section>
        <section className="mt-16">
          <SectionHeader href="/projects" title="Featured projects" />
          {projects.length > 0 ? (
            <div className="list-panel mt-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <p className="empty-state mt-6">
              No featured projects yet.
            </p>
          )}
        </section>
        <section className="mt-16">
          <SectionHeader href="/feed" title="From the feed" />
          {curatedLinks.length > 0 ? (
            <div className="list-panel mt-6">
              {curatedLinks.map((item) => (
                <CuratedLinkCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <p className="empty-state mt-6">
              No curated links published yet.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
