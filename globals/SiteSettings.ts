import type { GlobalConfig } from "payload";

import { isAdmin } from "../collections/access.ts";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      defaultValue: "Personal Engineering Blog",
    },
    {
      name: "headline",
      type: "text",
      required: true,
      defaultValue: "Personal engineering blog",
    },
    {
      name: "bio",
      type: "textarea",
    },
    {
      name: "contactEmail",
      type: "email",
    },
    {
      name: "socialLinks",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "url",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "seoTitle",
      type: "text",
    },
    {
      name: "seoDescription",
      type: "textarea",
    },
  ],
};
