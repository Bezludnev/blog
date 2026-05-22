import type { CollectionConfig } from "payload";

import { isAdmin } from "./access.ts";

export const Media: CollectionConfig = {
  slug: "media",
  upload: true,
  access: {
    create: isAdmin,
    read: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
};
