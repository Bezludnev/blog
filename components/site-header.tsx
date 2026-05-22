import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link className="font-semibold text-zinc-950" href="/">
          MConverter.eu
        </Link>
        <div className="flex items-center gap-4 text-sm text-zinc-600">
          <Link className="hover:text-zinc-950" href="/blog">
            Blog
          </Link>
          <Link className="hover:text-zinc-950" href="/admin">
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}
