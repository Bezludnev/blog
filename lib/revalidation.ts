export const CMS_REVALIDATE_SECONDS = 3600;

type RevalidationTargetInput = {
  previousSlug?: unknown;
  previousTagSlugs?: unknown;
  slug?: unknown;
  tagSlugs?: unknown;
  target?: unknown;
};

type PostPathInput = {
  previousSlug?: string;
  previousTagSlugs?: string[];
  slug?: string;
  tagSlugs?: string[];
};

type ProjectPathInput = {
  previousSlug?: string;
  slug?: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function normalizeSlug(value: unknown) {
  const slug = asString(value)?.trim().replace(/^\/+|\/+$/g, "");

  return slug || undefined;
}

function uniquePaths(paths: Array<string | undefined>) {
  return Array.from(
    new Set(paths.filter((path): path is string => Boolean(path))),
  );
}

function tagPaths(slugs: string[]) {
  return slugs
    .map((slug) => normalizeSlug(slug))
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => `/tags/${slug}`);
}

export function isRevalidationSecretValid(
  value: string | undefined,
  expected: string | undefined,
) {
  return Boolean(expected) && value === expected;
}

export function getSiteRevalidationPaths() {
  return ["/", "/about", "/contact", "/sitemap.xml"];
}

export function getPostRevalidationPaths(input: PostPathInput = {}) {
  const slug = normalizeSlug(input.slug);
  const previousSlug = normalizeSlug(input.previousSlug);
  const tags = [...(input.tagSlugs || []), ...(input.previousTagSlugs || [])];

  return uniquePaths([
    "/blog",
    "/rss.xml",
    "/sitemap.xml",
    slug ? `/blog/${slug}` : undefined,
    previousSlug ? `/blog/${previousSlug}` : undefined,
    ...tagPaths(tags),
  ]);
}

export function getProjectRevalidationPaths(input: ProjectPathInput = {}) {
  const slug = normalizeSlug(input.slug);
  const previousSlug = normalizeSlug(input.previousSlug);

  return uniquePaths([
    "/projects",
    "/sitemap.xml",
    slug ? `/projects/${slug}` : undefined,
    previousSlug ? `/projects/${previousSlug}` : undefined,
  ]);
}

export function getCommentRevalidationPaths(postSlug: unknown) {
  const slug = normalizeSlug(postSlug);

  return uniquePaths([slug ? `/blog/${slug}` : undefined]);
}

export function getAllRevalidationPaths() {
  return uniquePaths([
    ...getSiteRevalidationPaths(),
    ...getPostRevalidationPaths(),
    ...getProjectRevalidationPaths(),
  ]);
}

export function getRevalidationPathsForTarget(input: RevalidationTargetInput) {
  switch (input.target) {
    case "all":
      return getAllRevalidationPaths();
    case "site":
      return getSiteRevalidationPaths();
    case "posts":
      return getPostRevalidationPaths();
    case "projects":
      return getProjectRevalidationPaths();
    case "post":
      return getPostRevalidationPaths({
        previousSlug: normalizeSlug(input.previousSlug),
        previousTagSlugs: asStringArray(input.previousTagSlugs),
        slug: normalizeSlug(input.slug),
        tagSlugs: asStringArray(input.tagSlugs),
      });
    case "project":
      return getProjectRevalidationPaths({
        previousSlug: normalizeSlug(input.previousSlug),
        slug: normalizeSlug(input.slug),
      });
    default:
      return null;
  }
}
