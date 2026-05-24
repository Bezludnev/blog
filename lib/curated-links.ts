import type { CuratedLink } from "../payload-types";
import type { PaginatedResult } from "./pagination";
import { getPayloadClient } from "./payload";

export const CURATED_LINKS_PER_PAGE = 12;

type PublishedCuratedLinksPageInput = {
  limit?: number;
  page?: number;
};

export async function getRecentPublishedCuratedLinks(limit = 3) {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "curated-links",
    depth: 2,
    limit,
    sort: "-publishedAt",
    where: {
      status: {
        equals: "published",
      },
    },
  });

  return result.docs as CuratedLink[];
}

export async function getPublishedCuratedLinksPage({
  limit = CURATED_LINKS_PER_PAGE,
  page = 1,
}: PublishedCuratedLinksPageInput = {}): Promise<PaginatedResult<CuratedLink>> {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "curated-links",
    depth: 2,
    limit,
    page,
    sort: "-publishedAt",
    where: {
      status: {
        equals: "published",
      },
    },
  });

  return {
    ...result,
    docs: result.docs as CuratedLink[],
    nextPage: result.nextPage ?? null,
    page: result.page ?? page,
    prevPage: result.prevPage ?? null,
  };
}
