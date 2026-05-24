import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getAllRevalidationPaths,
  getCommentRevalidationPaths,
  getCuratedLinkRevalidationPaths,
  getPostRevalidationPaths,
  getProjectRevalidationPaths,
  getRevalidationPathsForTarget,
  getSiteRevalidationPaths,
  isRevalidationSecretValid,
  normalizeSlug,
} from "./revalidation.ts";

describe("isRevalidationSecretValid", () => {
  it("requires a configured expected secret", () => {
    assert.equal(isRevalidationSecretValid("secret", undefined), false);
  });

  it("accepts an exact secret match", () => {
    assert.equal(isRevalidationSecretValid("secret", "secret"), true);
  });

  it("rejects missing or different input", () => {
    assert.equal(isRevalidationSecretValid(undefined, "secret"), false);
    assert.equal(isRevalidationSecretValid("other", "secret"), false);
  });
});

describe("normalizeSlug", () => {
  it("trims slashes and whitespace", () => {
    assert.equal(normalizeSlug(" /hello-world/ "), "hello-world");
  });

  it("rejects empty slugs", () => {
    assert.equal(normalizeSlug(" / "), undefined);
  });
});

describe("known path mapping", () => {
  it("returns site paths", () => {
    assert.deepEqual(getSiteRevalidationPaths(), [
      "/",
      "/about",
      "/contact",
      "/sitemap.xml",
    ]);
  });

  it("returns aggregate and detail post paths", () => {
    assert.deepEqual(
      getPostRevalidationPaths({
        previousSlug: "old-post",
        previousTagSlugs: ["payload"],
        slug: "new-post",
        tagSlugs: ["nextjs", "payload"],
      }),
      [
        "/blog",
        "/",
        "/rss.xml",
        "/sitemap.xml",
        "/blog/new-post",
        "/blog/old-post",
        "/tags/nextjs",
        "/tags/payload",
      ],
    );
  });

  it("returns aggregate and detail project paths", () => {
    assert.deepEqual(
      getProjectRevalidationPaths({
        previousSlug: "old-project",
        slug: "new-project",
      }),
      [
        "/projects",
        "/",
        "/sitemap.xml",
        "/projects/new-project",
        "/projects/old-project",
      ],
    );
  });

  it("returns a post path for comment changes", () => {
    assert.deepEqual(getCommentRevalidationPaths("hello-world"), [
      "/blog/hello-world",
    ]);
  });

  it("returns curated feed paths", () => {
    assert.deepEqual(getCuratedLinkRevalidationPaths(), [
      "/feed",
      "/",
      "/sitemap.xml",
    ]);
  });

  it("deduplicates all-content paths", () => {
    assert.deepEqual(getAllRevalidationPaths(), [
      "/",
      "/about",
      "/contact",
      "/sitemap.xml",
      "/blog",
      "/rss.xml",
      "/projects",
      "/feed",
    ]);
  });
});

describe("getRevalidationPathsForTarget", () => {
  it("maps known route targets", () => {
    assert.deepEqual(getRevalidationPathsForTarget({ target: "posts" }), [
      "/blog",
      "/",
      "/rss.xml",
      "/sitemap.xml",
    ]);

    assert.deepEqual(getRevalidationPathsForTarget({ target: "curated-links" }), [
      "/feed",
      "/",
      "/sitemap.xml",
    ]);

    assert.deepEqual(getRevalidationPathsForTarget({ target: "curated-link" }), [
      "/feed",
      "/",
      "/sitemap.xml",
    ]);
  });

  it("maps a post target with optional slugs", () => {
    assert.deepEqual(
      getRevalidationPathsForTarget({
        previousSlug: "old-post",
        slug: "new-post",
        tagSlugs: ["payload"],
        target: "post",
      }),
      [
        "/blog",
        "/",
        "/rss.xml",
        "/sitemap.xml",
        "/blog/new-post",
        "/blog/old-post",
        "/tags/payload",
      ],
    );
  });

  it("returns null for unknown targets", () => {
    assert.equal(getRevalidationPathsForTarget({ target: "unknown" }), null);
  });
});
