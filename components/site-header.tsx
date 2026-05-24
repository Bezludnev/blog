import Link from "next/link";

import {
  getSiteName,
  getSiteNavigation,
  getSiteSettings,
} from "@/lib/site-settings";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);
  const navigation = getSiteNavigation(settings);

  return (
    <header className="site-header">
      <nav className="site-nav">
        <Link
          aria-label={`${siteName} home`}
          className="site-brand"
          href="/"
        >
          {siteName}
        </Link>
        <div className="site-nav-links">
          {navigation.map((item) => (
            <Link
              className="site-nav-link"
              href={item.url}
              key={`${item.label}-${item.url}`}
              rel={item.newTab ? "noreferrer" : undefined}
              target={item.newTab ? "_blank" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
