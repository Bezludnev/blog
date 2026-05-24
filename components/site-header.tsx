import Link from "next/link";

import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link className="font-semibold text-zinc-950 dark:text-zinc-100" href="/">
          Personal Engineering Blog
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Link className="text-link" href="/about">
            About
          </Link>
          <Link className="text-link" href="/projects">
            Projects
          </Link>
          <Link className="text-link" href="/feed">
            Feed
          </Link>
          <Link className="text-link" href="/blog">
            Blog
          </Link>
          <Link className="text-link" href="/contact">
            Contact
          </Link>
          <Link className="text-link" href="/admin">
            Admin
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
