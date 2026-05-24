import type { GlobalConfig } from "payload";

import { isAdmin } from "../collections/access.ts";
import { revalidateSiteSettingsAfterChange } from "../lib/payload-revalidation.ts";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: () => true,
    update: isAdmin,
  },
  hooks: {
    afterChange: [revalidateSiteSettingsAfterChange],
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
      name: "navigation",
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
        {
          name: "newTab",
          type: "checkbox",
        },
      ],
    },
    {
      name: "profileSections",
      type: "array",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "body",
          type: "textarea",
          required: true,
        },
      ],
    },
    {
      name: "seoDefaults",
      type: "group",
      fields: [
        {
          name: "title",
          type: "text",
        },
        {
          name: "description",
          type: "textarea",
        },
        {
          name: "openGraphImage",
          type: "upload",
          relationTo: "media",
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
