export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function absoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}

export function canonicalUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return absoluteUrl(normalizedPath);
}
