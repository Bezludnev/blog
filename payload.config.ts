import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";

import { Media } from "./collections/Media.ts";
import { Posts } from "./collections/Posts.ts";
import { Tags } from "./collections/Tags.ts";
import { Users } from "./collections/Users.ts";
import { SiteSettings } from "./globals/SiteSettings.ts";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const databaseUri = process.env.DATABASE_URI;
const payloadSecret = process.env.PAYLOAD_SECRET;

if (!databaseUri) {
  throw new Error("DATABASE_URI is required");
}

if (!payloadSecret) {
  throw new Error("PAYLOAD_SECRET is required");
}

export default buildConfig({
  admin: {
    user: "users",
    importMap: {
      baseDir: path.resolve(dirname),
      importMapFile: path.resolve(dirname, "app/(payload)/admin/importMap.js"),
    },
  },
  collections: [Users, Media, Tags, Posts],
  db: mongooseAdapter({
    url: databaseUri,
  }),
  editor: lexicalEditor(),
  globals: [SiteSettings],
  secret: payloadSecret,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
