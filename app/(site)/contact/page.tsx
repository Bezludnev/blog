import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Contact | Personal Engineering Blog",
  description: "Ways to contact the author.",
};

export const revalidate = 3600;

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const contactEmail = settings.contactEmail?.trim();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-zinc-950 dark:text-zinc-100">Contact</h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          The simplest way to get in touch for project, writing, or engineering
          conversations.
        </p>
        <div className="mt-8 bg-white px-6 py-8 dark:bg-zinc-900">
          {contactEmail ? (
            <a
              className="text-lg font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:decoration-zinc-700 dark:hover:text-zinc-300"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>
          ) : (
            <p className="max-w-2xl leading-8 text-zinc-600 dark:text-zinc-400">
              No public contact email is configured yet. Use the available
              social links below if they are configured.
            </p>
          )}
          <SocialLinks links={settings.socialLinks} />
        </div>
        <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium">
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/about"
          >
            About
          </Link>
          <Link
            className="rounded bg-zinc-950 px-4 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            href="/projects"
          >
            View projects
          </Link>
        </div>
      </main>
    </div>
  );
}
