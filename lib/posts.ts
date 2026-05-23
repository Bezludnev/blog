import { notFound } from "next/navigation";

import type { Post } from "../payload-types";
import { getPayloadClient } from "./payload";

export async function getPublishedPosts() {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "posts",
    depth: 2,
    sort: "-publishedAt",
    where: {
      status: {
        equals: "published",
      },
    },
  });

  return result.docs as Post[];
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
