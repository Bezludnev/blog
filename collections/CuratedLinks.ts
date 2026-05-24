import type { CollectionConfig } from "payload";

import {
  CURATED_LINK_TYPES,
  getCuratedLinkTypeLabel,
  isSafeExternalUrl,
} from "../lib/curated-link-utils.ts";
import {
  revalidateCuratedLinkAfterChange,
  revalidateCuratedLinkAfterDelete,
} from "../lib/payload-revalidation.ts";
import { isAdmin, publishedOrAdmin } from "./access.ts";

export const CuratedLinks: CollectionConfig = {
  slug: "curated-links",
  admin: {
    defaultColumns: [
      "title",
      "type",
      "source",
      "status",
      "featured",
      "publishedAt",
      "updatedAt",
    ],
    listSearchableFields: ["title", "url", "source", "summary"],
    useAsTitle: "title",
  },
  access: {
    create: isAdmin,
    read: publishedOrAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidateCuratedLinkAfterChange],
    afterDelete: [revalidateCuratedLinkAfterDelete],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "url",
      type: "text",
      required: true,
      validate: (value: unknown) =>
        isSafeExternalUrl(value) || "Enter an http or https URL.",
    },
    {
      name: "source",
      type: "text",
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: "article",
      options: CURATED_LINK_TYPES.map((value) => ({
        label: getCuratedLinkTypeLabel(value),
        value,
      })),
    },
    {
      name: "summary",
      type: "textarea",
      required: true,
    },
    {
      name: "note",
      type: "textarea",
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
        { label: "Archived", value: "archived" },
      ],
    },
    {
      name: "publishedAt",
      type: "date",
      admin: {
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
    },
    {
      name: "featured",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 100,
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
