export const BLOG_POSTS_PER_PAGE = 10;

export type PaginatedResult<T> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: null | number;
  nextPage: null | number;
};

type PaginationHrefInput = {
  page: number;
  pathname: string;
  query?: string;
};

export function normalizePageParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw || !/^[1-9]\d*$/.test(raw)) {
    return 1;
  }

  return Number(raw);
}

export function paginateItems<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalDocs = items.length;
  const totalPages = Math.ceil(totalDocs / limit);
  const start = (page - 1) * limit;
  const docs = items.slice(start, start + limit);

  return {
    docs,
    totalDocs,
    limit,
    totalPages,
    page,
    pagingCounter: totalDocs === 0 ? 0 : start + 1,
    hasPrevPage: page > 1 && totalDocs > 0,
    hasNextPage: page < totalPages,
    prevPage: page > 1 && totalDocs > 0 ? page - 1 : null,
    nextPage: page < totalPages ? page + 1 : null,
  };
}

export function isPageOutOfRange(
  page: number,
  totalPages: number,
  totalDocs: number,
) {
  if (page <= 1) {
    return false;
  }

  if (totalDocs === 0) {
    return true;
  }

  return page > totalPages;
}

export function buildPaginationHref({
  page,
  pathname,
  query,
}: PaginationHrefInput) {
  const params = new URLSearchParams();

  if (query?.trim()) {
    params.set("q", query.trim());
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
}
