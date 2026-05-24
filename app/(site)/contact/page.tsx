import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { canonicalUrl } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Contact | Personal Engineering Blog",
  description: "Ways to contact the author.",
  alternates: {
    canonical: canonicalUrl("/contact"),
  },
  openGraph: {
    title: "Contact | Personal Engineering Blog",
    description: "Ways to contact the author.",
    url: canonicalUrl("/contact"),
  },
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
              className="text-link text-lg font-medium underline"
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
