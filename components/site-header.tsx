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
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link className="font-semibold text-zinc-950 dark:text-zinc-100" href="/">
          {siteName}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          {navigation.map((item) => (
            <Link
              className="text-link"
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
