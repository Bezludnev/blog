import type { CollectionConfig } from "payload";

import { isAdmin, isAdminOrFirstUser } from "./access.ts";

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  access: {
    create: isAdminOrFirstUser,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "displayName",
      type: "text",
      required: true,
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "admin",
      options: [{ label: "Admin", value: "admin" }],
    },
  ],
};
