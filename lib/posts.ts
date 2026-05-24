import { notFound } from "next/navigation";

import type { Post, Tag } from "../payload-types";
import {
  BLOG_POSTS_PER_PAGE,
  type PaginatedResult,
  paginateItems,
} from "./pagination";
import { getPayloadClient } from "./payload";
import { postMatchesSearch } from "./search";

type PublishedPostsPageInput = {
  limit?: number;
  page?: number;
  query?: string;
};

type PublishedPostsByTagPageInput = {
  limit?: number;
  page?: number;
  tagId: string;
};

export async function getPublishedPosts(query = "") {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "posts",
    depth: 2,
    pagination: false,
    sort: "-publishedAt",
    where: {
      status: {
        equals: "published",
      },
    },
  });

  const posts = result.docs as Post[];
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return posts;
  }

  return posts.filter((post) => postMatchesSearch(post, normalizedQuery));
}

export async function getPublishedPostsPage({
  limit = BLOG_POSTS_PER_PAGE,
  page = 1,
  query = "",
}: PublishedPostsPageInput = {}): Promise<PaginatedResult<Post>> {
  const payload = await getPayloadClient();
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    const result = await payload.find({
      collection: "posts",
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
      docs: result.docs as Post[],
      page: result.page ?? page,
      prevPage: result.prevPage ?? null,
      nextPage: result.nextPage ?? null,
    };
  }

  const result = await payload.find({
    collection: "posts",
    depth: 2,
    pagination: false,
    sort: "-publishedAt",
    where: {
      status: {
        equals: "published",
      },
    },
  });

  const matches = (result.docs as Post[]).filter((post) =>
    postMatchesSearch(post, normalizedQuery),
  );

  return paginateItems(matches, page, limit);
}

export async function getPublishedPostBySlug(slug: string) {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "posts",
    depth: 2,
    limit: 1,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        {
          status: {
            equals: "published",
          },
        },
      ],
    },
  });

  const post = result.docs[0] as Post | undefined;

  if (!post) {
    notFound();
  }

  return post;
}

export async function getTagBySlug(slug: string) {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "tags",
    limit: 1,
    where: {
      slug: {
        equals: slug,
      },
    },
  });

  return result.docs[0] as Tag | undefined;
}

export async function getPublicTags() {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "tags",
    depth: 0,
    pagination: false,
    sort: "name",
  });

  return result.docs as Tag[];
}

export async function getPublishedPostsByTagId(tagId: string) {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "posts",
    depth: 2,
    pagination: false,
    sort: "-publishedAt",
    where: {
      and: [
        {
          status: {
            equals: "published",
          },
        },
        {
          tags: {
            equals: tagId,
          },
        },
      ],
    },
  });

  return result.docs as Post[];
}

export async function getPublishedPostsByTagIdPage({
  limit = BLOG_POSTS_PER_PAGE,
  page = 1,
  tagId,
}: PublishedPostsByTagPageInput): Promise<PaginatedResult<Post>> {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "posts",
    depth: 2,
    limit,
    page,
    sort: "-publishedAt",
    where: {
      and: [
        {
          status: {
            equals: "published",
          },
        },
        {
          tags: {
            equals: tagId,
          },
        },
      ],
    },
  });

  return {
    ...result,
    docs: result.docs as Post[],
    page: result.page ?? page,
    prevPage: result.prevPage ?? null,
    nextPage: result.nextPage ?? null,
  };
}

export async function getRecentPublishedPostsForFeed(limit = 20) {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "posts",
    depth: 0,
    limit,
    sort: "-publishedAt",
    where: {
      status: {
        equals: "published",
      },
    },
  });

  return result.docs as Post[];
}
