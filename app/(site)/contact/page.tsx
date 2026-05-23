import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";
import { SocialLinks } from "@/components/social-links";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Contact | MConverter.eu",
  description: "Ways to contact MConverter.eu.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const contactEmail = settings.contactEmail?.trim();

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-zinc-950">Contact</h1>
        <p className="mt-4 max-w-2xl text-zinc-600">
          The simplest way to get in touch for project, writing, or engineering
          conversations.
        </p>
        <div className="mt-8 bg-white px-6 py-8">
          {contactEmail ? (
            <a
              className="text-lg font-medium text-zinc-950 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-700"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>
          ) : (
            <p className="max-w-2xl leading-8 text-zinc-600">
              No public contact email is configured yet. Use the available
              social links below if they are configured.
            </p>
          )}
          <SocialLinks links={settings.socialLinks} />
        </div>
        <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium">
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-zinc-700 hover:border-zinc-500 hover:text-zinc-950"
            href="/about"
          >
            About
          </Link>
          <Link
            className="rounded bg-zinc-950 px-4 py-2 text-white hover:bg-zinc-700"
            href="/projects"
          >
            View projects
          </Link>
        </div>
      </main>
    </div>
  );
}
