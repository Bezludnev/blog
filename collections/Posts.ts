import type { CollectionConfig } from "payload";
import {
  BlocksFeature,
  CodeBlock,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

import {
  revalidatePostAfterChange,
  revalidatePostAfterDelete,
} from "../lib/payload-revalidation.ts";
import { CODE_BLOCK_LANGUAGES } from "../lib/rich-text-code-block.ts";
import { isAdmin, publishedOrAdmin } from "./access.ts";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    defaultColumns: ["title", "status", "publishedAt", "updatedAt"],
    useAsTitle: "title",
  },
  access: {
    create: isAdmin,
    read: publishedOrAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidatePostAfterChange],
    afterDelete: [revalidatePostAfterDelete],
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
    },
    {
      name: "content",
      type: "richText",
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              CodeBlock({
                defaultLanguage: "plaintext",
                languages: CODE_BLOCK_LANGUAGES,
              }),
            ],
          }),
        ],
      }),
      required: true,
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
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
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      required: true,
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
      name: "readingTime",
      type: "number",
      min: 1,
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
