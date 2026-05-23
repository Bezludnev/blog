import type { Comment } from "../payload-types";
import { getPayloadClient } from "./payload";

export async function getApprovedCommentsForPost(postId: string) {
  const payload = await getPayloadClient();

  const result = await payload.find({
    collection: "comments",
    depth: 0,
    limit: 100,
    sort: "createdAt",
    where: {
      and: [
        {
          post: {
            equals: postId,
          },
        },
        {
          status: {
            equals: "approved",
          },
        },
      ],
    },
    overrideAccess: true,
  });

  return result.docs as Comment[];
}
