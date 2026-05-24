import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import {
  getSiteBio,
  getSiteHeadline,
  getSiteSettings,
} from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "About | Personal Engineering Blog",
  description: "Profile, experience, and engineering focus.",
};

export const revalidate = 3600;

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const headline = getSiteHeadline(settings);
  const bio = getSiteBio(settings);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-zinc-950 dark:text-zinc-100">About</h1>
        <p className="mt-4 max-w-3xl text-xl leading-8 text-zinc-700 dark:text-zinc-300">
          {headline}
        </p>
        <div className="mt-8 bg-white px-6 py-8 dark:bg-zinc-900">
          <p className="max-w-3xl whitespace-pre-line leading-8 text-zinc-600 dark:text-zinc-400">
            {bio}
          </p>
          <SocialLinks links={settings.socialLinks} />
        </div>
        <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium">
          <Link
            className="rounded bg-zinc-950 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            href="/projects"
          >
            View projects
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/blog"
          >
            Read the blog
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/contact"
          >
            Contact
          </Link>
        </div>
      </main>
    </div>
  );
}
