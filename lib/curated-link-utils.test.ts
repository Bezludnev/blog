import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CURATED_LINK_TYPES,
  getCuratedLinkTypeLabel,
  isCuratedLinkType,
  isSafeExternalUrl,
} from "./curated-link-utils.ts";

describe("isCuratedLinkType", () => {
  it("accepts only supported curated link types", () => {
    assert.equal(isCuratedLinkType("article"), true);
    assert.equal(isCuratedLinkType("video"), true);
    assert.equal(isCuratedLinkType("tool"), true);
    assert.equal(isCuratedLinkType("repo"), true);
    assert.equal(isCuratedLinkType("other"), true);
    assert.equal(isCuratedLinkType("podcast"), false);
    assert.equal(isCuratedLinkType(null), false);
  });

  it("keeps the type list stable for Payload select options", () => {
    assert.deepEqual(CURATED_LINK_TYPES, [
      "article",
      "video",
      "tool",
      "repo",
      "other",
    ]);
  });
});

describe("getCuratedLinkTypeLabel", () => {
  it("returns display labels for supported types", () => {
    assert.equal(getCuratedLinkTypeLabel("article"), "Article");
    assert.equal(getCuratedLinkTypeLabel("video"), "Video");
    assert.equal(getCuratedLinkTypeLabel("tool"), "Tool");
    assert.equal(getCuratedLinkTypeLabel("repo"), "Repository");
    assert.equal(getCuratedLinkTypeLabel("other"), "Other");
  });
});

describe("isSafeExternalUrl", () => {
  it("accepts http and https URLs", () => {
    assert.equal(isSafeExternalUrl("https://example.com/article"), true);
    assert.equal(isSafeExternalUrl("http://example.com/tool"), true);
  });

  it("rejects relative, malformed, and unsafe-protocol URLs", () => {
    assert.equal(isSafeExternalUrl("/blog"), false);
    assert.equal(isSafeExternalUrl("not a url"), false);
    assert.equal(isSafeExternalUrl("javascript:alert(1)"), false);
    assert.equal(isSafeExternalUrl("mailto:test@example.com"), false);
  });
});
