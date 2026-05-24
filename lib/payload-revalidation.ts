import { revalidatePath } from "next/cache";
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from "payload";

import type { Comment, Post, Project, Tag } from "@/payload-types";

import {
  getCommentRevalidationPaths,
  getCuratedLinkRevalidationPaths,
  getPostRevalidationPaths,
  getProjectRevalidationPaths,
  getSiteRevalidationPaths,
} from "./revalidation";

function runRevalidation(paths: string[]) {
  try {
    for (const path of paths) {
      revalidatePath(path);
    }
  } catch (error) {
    console.error("Could not revalidate paths", error);
  }
}

function getPublishedSlug(doc?: Pick<Post | Project, "slug" | "status"> | null) {
  return doc?.status === "published" ? doc.slug : undefined;
}

function getTagSlugs(tags: Post["tags"] | undefined) {
  return (tags || []).flatMap((tag) => {
    if (typeof tag === "object" && tag !== null) {
      return [(tag as Tag).slug];
    }

    return [];
  });
}

function getRelationshipId(value: unknown) {
  if (typeof value === "string") return value;

  if (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
  ) {
    return value.id;
  }

  return undefined;
}

async function getPublishedPostSlugForComment(
  doc: Comment,
  req: PayloadRequest,
) {
  const postId = getRelationshipId(doc.post);

  if (!postId) return undefined;

  try {
    const post = await req.payload.findByID({
      collection: "posts",
      depth: 0,
      id: postId,
      overrideAccess: true,
    });

    return post.status === "published" ? post.slug : undefined;
  } catch (error) {
    console.error("Could not resolve comment post for revalidation", error);
    return undefined;
  }
}

export const revalidatePostAfterChange: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
}) => {
  runRevalidation(
    getPostRevalidationPaths({
      previousSlug: getPublishedSlug(previousDoc),
      previousTagSlugs: getTagSlugs(previousDoc?.tags),
      slug: getPublishedSlug(doc),
      tagSlugs: getTagSlugs(doc.tags),
    }),
  );

  return doc;
};

export const revalidatePostAfterDelete: CollectionAfterDeleteHook<Post> = ({
  doc,
}) => {
  runRevalidation(
    getPostRevalidationPaths({
      previousSlug: getPublishedSlug(doc),
      previousTagSlugs: getTagSlugs(doc.tags),
    }),
  );
};

export const revalidateProjectAfterChange: CollectionAfterChangeHook<Project> =
  ({ doc, previousDoc }) => {
    runRevalidation(
      getProjectRevalidationPaths({
        previousSlug: getPublishedSlug(previousDoc),
        slug: getPublishedSlug(doc),
      }),
    );

    return doc;
  };

export const revalidateProjectAfterDelete: CollectionAfterDeleteHook<Project> =
  ({ doc }) => {
    runRevalidation(
      getProjectRevalidationPaths({
        previousSlug: getPublishedSlug(doc),
      }),
    );
  };

export const revalidateCuratedLinkAfterChange: CollectionAfterChangeHook = ({
  doc,
}) => {
  runRevalidation(getCuratedLinkRevalidationPaths());

  return doc;
};

export const revalidateCuratedLinkAfterDelete: CollectionAfterDeleteHook =
  () => {
    runRevalidation(getCuratedLinkRevalidationPaths());
  };

export const revalidateCommentAfterChange: CollectionAfterChangeHook<Comment> =
  async ({ doc, req }) => {
    runRevalidation(
      getCommentRevalidationPaths(await getPublishedPostSlugForComment(doc, req)),
    );

    return doc;
  };

export const revalidateCommentAfterDelete: CollectionAfterDeleteHook<Comment> =
  async ({ doc, req }) => {
    runRevalidation(
      getCommentRevalidationPaths(await getPublishedPostSlugForComment(doc, req)),
    );
  };

export const revalidateSiteSettingsAfterChange: GlobalAfterChangeHook = ({
  doc,
}) => {
  runRevalidation(getSiteRevalidationPaths());

  return doc;
};
