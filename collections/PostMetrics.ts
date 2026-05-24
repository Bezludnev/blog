import type { CollectionConfig } from "payload";

import { isAdmin } from "./access.ts";

export const PostMetrics: CollectionConfig = {
  slug: "post-metrics",
  admin: {
    defaultColumns: ["post", "date", "views", "uniqueViewsApprox", "lastViewedAt"],
    group: "Analytics",
    useAsTitle: "metricKey",
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "metricKey",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "post",
      type: "relationship",
      relationTo: "posts",
      required: true,
      index: true,
    },
    {
      name: "date",
      type: "text",
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "views",
      type: "number",
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "uniqueViewsApprox",
      type: "number",
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "visitorHashes",
      type: "array",
      admin: {
        hidden: true,
        readOnly: true,
      },
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "lastViewedAt",
      type: "date",
      admin: {
        readOnly: true,
      },
    },
  ],
};
