import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Personal engineering blog
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-zinc-950 sm:text-5xl dark:text-zinc-100">
          Notes on software delivery, systems, and product engineering.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          This site is backed by PayloadCMS. Published posts appear on the blog
          after they are created and released through the admin panel.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            className="rounded bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
            href="/blog"
          >
            Read the blog
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/projects"
          >
            View projects
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/about"
          >
            About
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/contact"
          >
            Contact
          </Link>
          <Link
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
            href="/admin"
          >
            Open admin
          </Link>
        </div>
      </main>
    </div>
  );
}
