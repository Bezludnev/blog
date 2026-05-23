import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";

import { Media } from "./collections/Media.ts";
import { Posts } from "./collections/Posts.ts";
import { Projects } from "./collections/Projects.ts";
import { Comments } from "./collections/Comments.ts";
import { Tags } from "./collections/Tags.ts";
import { Users } from "./collections/Users.ts";
import { SiteSettings } from "./globals/SiteSettings.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const databaseUri = process.env.DATABASE_URI;
const payloadSecret = process.env.PAYLOAD_SECRET;
const blobReadWriteToken = process.env.BLOB_READ_WRITE_TOKEN;
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

if (!databaseUri) {
  throw new Error("DATABASE_URI is required");
}

if (!payloadSecret) {
  throw new Error("PAYLOAD_SECRET is required");
}

if (isVercel && !blobReadWriteToken) {
  throw new Error("BLOB_READ_WRITE_TOKEN is required for media uploads on Vercel");
}

export default buildConfig({
  admin: {
    user: "users",
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: path.resolve(dirname, "app/(payload)/admin/importMap.js"),
    },
  },
  collections: [Users, Media, Tags, Posts, Projects, Comments],
  db: mongooseAdapter({
    url: databaseUri,
  }),
  editor: lexicalEditor(),
  globals: [SiteSettings],
  plugins: [
    vercelBlobStorage({
      enabled: Boolean(blobReadWriteToken),
      clientUploads: true,
      collections: {
        media: {
          prefix: "media",
        },
      },
      token: blobReadWriteToken,
    }),
  ],
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
