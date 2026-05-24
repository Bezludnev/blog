import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { absoluteUrl, canonicalUrl } from "./seo.ts";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    return;
  }

  process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe("seo URL helpers", () => {
  it("uses NEXT_PUBLIC_SITE_URL for absolute URLs when configured", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";

    assert.equal(absoluteUrl("/"), "https://example.com/");
  });

  it("falls back to localhost for absolute URLs", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;

    assert.equal(absoluteUrl("/"), "http://localhost:3000/");
  });

  it("returns an absolute canonical URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";

    assert.equal(canonicalUrl("/blog/example"), "https://example.com/blog/example");
  });

  it("normalizes canonical URLs without a leading slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";

    assert.equal(canonicalUrl("blog/example"), "https://example.com/blog/example");
  });
});
