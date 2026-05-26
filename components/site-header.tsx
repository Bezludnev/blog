import Link from "next/link";

import {
  getSiteName,
  getSiteNavigation,
  getSiteSettings,
} from "@/lib/site-settings";
import { SlideTabsNav } from "./slide-tabs-nav";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);
  const navigation = getSiteNavigation(settings);

  return (
    <header className="site-header">
      <nav
        className="site-nav"
        style={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: "1rem",
          justifyContent: "center",
        }}
      >
        <Link
          aria-label={`${siteName} home`}
          className="site-brand"
          href="/"
          style={{ flex: "1 1 8rem" }}
        >
          {siteName}
        </Link>
        <SlideTabsNav items={navigation} />
        <div
          className="site-nav-actions"
          style={{
            display: "flex",
            flex: "0 0 auto",
            justifyContent: "flex-end",
          }}
        >
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
