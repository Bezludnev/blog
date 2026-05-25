import Link from "next/link";

import { getSiteName, getSiteSettings } from "@/lib/site-settings";
import { NewsletterForm } from "./newsletter-form";

const SITEMAP_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/feed", label: "Feed" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const TOPIC_LINKS = [
  { href: "/blog", label: "Node" },
  { href: "/blog", label: "Next.js" },
  { href: "/blog", label: "Payload" },
  { href: "/blog", label: "MongoDB" },
  { href: "/blog", label: "Ops" },
  { href: "/blog", label: "Writing" },
];

const FOOTER_TAGLINE =
  "Notes from a working engineer. Long-form posts, side projects, and the things I read this week that you might want to read too.";

const NEWSLETTER_COPY =
  "One short email per month. New posts, sometimes a project update. No tracking, easy to leave.";

type SocialLink = { label: string; url: string };

function getSocialLinks(settings: {
  socialLinks?: { label?: null | string; url?: null | string }[] | null;
}): SocialLink[] {
  return (settings.socialLinks || []).flatMap((link) => {
    const label = link.label?.trim();
    const url = link.url?.trim();
    if (!label || !url) return [];
    return [{ label, url }];
  });
}

export async function SiteFooter() {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);
  const socialLinks = getSocialLinks(settings);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <Link className="footer-brand-mark" href="/">
            {siteName}
            <span className="footer-brand-dot" />
          </Link>
          <p className="footer-tagline">{FOOTER_TAGLINE}</p>
          <div className="footer-socials">
            {socialLinks.map((link) => (
              <a
                className="action-link-compact action-secondary"
                href={link.url}
                key={`${link.label}-${link.url}`}
                rel="noreferrer"
                target="_blank"
              >
                {link.label}
              </a>
            ))}
            <a
              className="action-link-compact action-secondary"
              href="/rss.xml"
            >
              RSS
            </a>
          </div>
        </div>

        <div>
          <p className="footer-col-title">Sitemap</p>
          <div className="footer-links">
            {SITEMAP_LINKS.map((link) => (
              <Link className="footer-link" href={link.href} key={link.label}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="footer-col-title">Topics</p>
          <div className="footer-links">
            {TOPIC_LINKS.map((link) => (
              <Link
                className="footer-link"
                href={link.href}
                key={link.label}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="footer-newsletter">
          <p className="footer-col-title">Newsletter</p>
          <p className="footer-newsletter-copy">{NEWSLETTER_COPY}</p>
          <NewsletterForm />
          <p className="footer-newsletter-note">
            Plain text. Unsubscribe at the bottom of every email.
          </p>
        </div>
      </div>

      <div className="site-footer-bar">
        <div className="site-footer-bar-inner">
          <span>
            © {year} {siteName}. Built with Next.js and PayloadCMS.
          </span>
          <div className="site-footer-bar-links">
            <Link href="/about">Colophon</Link>
            <Link href="/contact">Say hi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
