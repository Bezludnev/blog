import { notFound } from "next/navigation";

import type { Project } from "../payload-types";
import { getPayloadClient } from "./payload";

function sortProjects(projects: Project[]) {
  return [...projects].sort((left, right) => {
    const leftSort = left.sortOrder ?? 100;
    const rightSort = right.sortOrder ?? 100;

    if (leftSort !== rightSort) {
      return leftSort - rightSort;
    }

    const leftDate = left.publishedAt ? new Date(left.publishedAt).getTime() : 0;
    const rightDate = right.publishedAt
      ? new Date(right.publishedAt).getTime()
      : 0;

    return rightDate - leftDate;
  });
}

export async function getPublishedProjects() {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "projects",
    depth: 2,
    sort: "sortOrder",
    where: {
      status: {
        equals: "published",
      },
    },
  });

  return sortProjects(result.docs as Project[]);
}

export async function getFeaturedProjects(limit = 3) {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "projects",
    depth: 2,
    limit,
    sort: "sortOrder",
    where: {
      and: [
        {
          status: {
            equals: "published",
          },
        },
        {
          featured: {
            equals: true,
          },
        },
      ],
    },
  });

  return sortProjects(result.docs as Project[]).slice(0, limit);
}

export async function getPublishedProjectBySlug(slug: string) {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "projects",
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

  const project = result.docs[0] as Project | undefined;

  if (!project) {
    notFound();
  }

  return project;
}
