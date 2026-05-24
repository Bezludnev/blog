import Link from "next/link";

import { buildPaginationHref } from "@/lib/pagination";

type PaginationProps = {
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: null | number;
  page: number;
  pathname: string;
  prevPage: null | number;
  query?: string;
  totalPages: number;
};

export function Pagination({
  hasNextPage,
  hasPrevPage,
  nextPage,
  page,
  pathname,
  prevPage,
  query,
  totalPages,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-between gap-4 text-sm"
    >
      {hasPrevPage && prevPage ? (
        <Link
          className="border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
          href={buildPaginationHref({ page: prevPage, pathname, query })}
        >
          Previous
        </Link>
      ) : (
        <span aria-hidden="true" className="px-4 py-2 text-zinc-400 dark:text-zinc-600">
          Previous
        </span>
      )}
      <span className="text-zinc-600 dark:text-zinc-400">
        Page {page} of {totalPages}
      </span>
      {hasNextPage && nextPage ? (
        <Link
          className="border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
          href={buildPaginationHref({ page: nextPage, pathname, query })}
        >
          Next
        </Link>
      ) : (
        <span aria-hidden="true" className="px-4 py-2 text-zinc-400 dark:text-zinc-600">
          Next
        </span>
      )}
    </nav>
  );
}
