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
          className="pagination-link"
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
          className="pagination-link"
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
