import type { CollectionConfig } from "payload";

import {
  MAX_COMMENT_BODY_LENGTH,
  MAX_COMMENT_NAME_LENGTH,
} from "../lib/comment-validation.ts";
import { isAdmin } from "./access.ts";

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
  fields: [
    {
      name: "post",
      type: "relationship",
      relationTo: "posts",
      required: true,
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
