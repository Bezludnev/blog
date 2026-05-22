import type { Access } from "payload";

type AdminUser = {
  role?: string;
};

function hasAdminRole(user: unknown) {
  return Boolean(user && (user as AdminUser).role === "admin");
}

export const isAdmin: Access = ({ req: { user } }) => {
  return hasAdminRole(user);
};

export const isAdminOrFirstUser: Access = async ({ req: { payload, user } }) => {
  if (hasAdminRole(user)) {
    return true;
  }

  const users = await payload.count({
    collection: "users",
  });

  return users.totalDocs === 0;
};

export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (hasAdminRole(user)) {
    return true;
  }

  return {
    status: {
      equals: "published",
    },
  };
};
