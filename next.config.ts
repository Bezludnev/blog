import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const blobHostname = process.env.NEXT_PUBLIC_BLOB_HOSTNAME;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: blobHostname
      ? [
          {
            protocol: "https",
            hostname: blobHostname,
            port: "",
            pathname: "/**",
          },
        ]
      : [],
  },
};

export default withPayload(nextConfig);
