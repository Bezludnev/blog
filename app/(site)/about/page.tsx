import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { canonicalUrl } from "@/lib/seo";
import {
  getProfileSections,
  getSiteBio,
  getSiteHeadline,
  getSiteSettings,
} from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "About | Personal Engineering Blog",
  description: "Profile, experience, and engineering focus.",
  alternates: {
    canonical: canonicalUrl("/about"),
  },
  openGraph: {
    title: "About | Personal Engineering Blog",
    description: "Profile, experience, and engineering focus.",
    url: canonicalUrl("/about"),
  },
};

export const revalidate = 3600;

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const headline = getSiteHeadline(settings);
  const bio = getSiteBio(settings);
  const profileSections = getProfileSections(settings);

  return (
    <div className="site-page">
      <SiteHeader />
      <main className="site-main">
        <h1 className="page-title">About</h1>
        <p className="body-copy mt-4 max-w-3xl text-xl leading-8">
          {headline}
        </p>
        <div className="content-panel mt-8">
          <p className="muted-copy max-w-3xl whitespace-pre-line leading-8">
            {bio}
          </p>
          <SocialLinks links={settings.socialLinks} />
          {profileSections.length > 0 ? (
            <div className="mt-8 space-y-6">
              {profileSections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
                    {section.title}
                  </h2>
                  <p className="muted-copy mt-3 whitespace-pre-line leading-8">
                    {section.body}
                  </p>
                </section>
              ))}
            </div>
          ) : null}
        </div>
        <div className="action-row mt-10">
          <Link className="action-link action-primary" href="/projects">
            View projects
          </Link>
          <Link className="action-link action-secondary" href="/blog">
            Read the blog
          </Link>
          <Link className="action-link action-secondary" href="/contact">
            Contact
          </Link>
        </div>
      </main>
    </div>
  );
}
