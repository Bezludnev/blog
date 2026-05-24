import type {
  CollectionBeforeValidateHook,
  CollectionConfig,
} from "payload";

import {
  MAX_COMMENT_BODY_LENGTH,
  MAX_COMMENT_NAME_LENGTH,
} from "../lib/comment-validation.ts";
import { getRelationshipId } from "../lib/comment-replies.ts";
import {
  revalidateCommentAfterChange,
  revalidateCommentAfterDelete,
} from "../lib/payload-revalidation.ts";
import type { Comment } from "../payload-types.ts";
import { isAdmin } from "./access.ts";

const validateCommentParent: CollectionBeforeValidateHook<Comment> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const parentCommentId = getRelationshipId(
    data?.parentComment ?? originalDoc?.parentComment,
  );

  if (!parentCommentId) {
    return data;
  }

  if (operation === "update" && originalDoc?.id === parentCommentId) {
    throw new Error("A comment cannot reply to itself.");
  }

  const postId = getRelationshipId(data?.post ?? originalDoc?.post);

  if (!postId) {
    return data;
  }

  const parentComment = await req.payload.findByID({
    collection: "comments",
    depth: 0,
    id: parentCommentId,
    overrideAccess: true,
  });

  if (getRelationshipId(parentComment.post) !== postId) {
    throw new Error("Reply parent must belong to the same post.");
  }

  if (getRelationshipId(parentComment.parentComment)) {
    throw new Error("Replies cannot have replies.");
  }

  return data;
};

export const Comments: CollectionConfig = {
  slug: "comments",
  admin: {
    defaultColumns: ["authorName", "post", "status", "createdAt"],
    useAsTitle: "authorName",
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeValidate: [validateCommentParent],
    afterChange: [revalidateCommentAfterChange],
    afterDelete: [revalidateCommentAfterDelete],
  },
  fields: [
    {
      name: "post",
      type: "relationship",
      relationTo: "posts",
      required: true,
      index: true,
    },
    {
      name: "parentComment",
      type: "relationship",
      relationTo: "comments",
      index: true,
    },
    {
      name: "authorName",
      type: "text",
      required: true,
      maxLength: MAX_COMMENT_NAME_LENGTH,
    },
    {
      name: "body",
      type: "textarea",
      required: true,
      maxLength: MAX_COMMENT_BODY_LENGTH,
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
        { label: "Deleted", value: "deleted" },
      ],
    },
    {
      name: "ipHash",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "userAgentHash",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
  ],
};
