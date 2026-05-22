import type { CollectionConfig } from "payload";

import { isAdmin } from "./access.ts";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    adminThumbnail: "thumbnail",
    focalPoint: true,
    imageSizes: [
      {
        name: "thumbnail",
        width: 360,
        height: 240,
        position: "centre",
      },
      {
        name: "cover",
        width: 1600,
        height: 900,
        position: "centre",
      },
    ],
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
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
