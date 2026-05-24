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
    <div className="site-page">
      <SiteHeader />
      <main className="site-main">
        <h1 className="page-title">Contact</h1>
        <p className="page-lede">
          The simplest way to get in touch for project, writing, or engineering
          conversations.
        </p>
        <div className="content-panel mt-8">
          {contactEmail ? (
            <a
              className="text-lg font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-700 dark:text-zinc-100 dark:decoration-zinc-700 dark:hover:text-zinc-300"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>
          ) : (
            <p className="muted-copy max-w-2xl leading-8">
              No public contact email is configured yet. Use the available
              social links below if they are configured.
            </p>
          )}
          <SocialLinks links={settings.socialLinks} />
        </div>
        <div className="action-row mt-10">
          <Link className="action-link action-secondary" href="/about">
            About
          </Link>
          <Link className="action-link action-primary" href="/projects">
            View projects
          </Link>
        </div>
      </main>
    </div>
  );
}
