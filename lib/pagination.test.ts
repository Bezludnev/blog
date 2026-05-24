import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BLOG_POSTS_PER_PAGE,
  buildPaginationHref,
  isPageOutOfRange,
  normalizePageParam,
  paginateItems,
} from "./pagination.ts";

describe("normalizePageParam", () => {
  it("defaults missing or invalid values to page 1", () => {
    assert.equal(normalizePageParam(undefined), 1);
    assert.equal(normalizePageParam(""), 1);
    assert.equal(normalizePageParam("0"), 1);
    assert.equal(normalizePageParam("-2"), 1);
    assert.equal(normalizePageParam("abc"), 1);
    assert.equal(normalizePageParam("1.5"), 1);
  });

  it("accepts positive integer strings and uses the first array value", () => {
    assert.equal(normalizePageParam("2"), 2);
    assert.equal(normalizePageParam(["3", "4"]), 3);
  });
});

describe("paginateItems", () => {
  it("returns a Payload-like first page", () => {
    const result = paginateItems(["a", "b", "c"], 1, 2);

    assert.deepEqual(result.docs, ["a", "b"]);
    assert.equal(result.totalDocs, 3);
    assert.equal(result.limit, 2);
    assert.equal(result.totalPages, 2);
    assert.equal(result.page, 1);
    assert.equal(result.hasPrevPage, false);
    assert.equal(result.hasNextPage, true);
    assert.equal(result.prevPage, null);
    assert.equal(result.nextPage, 2);
  });

  it("returns later pages", () => {
    const result = paginateItems(["a", "b", "c"], 2, 2);

    assert.deepEqual(result.docs, ["c"]);
    assert.equal(result.hasPrevPage, true);
    assert.equal(result.hasNextPage, false);
    assert.equal(result.prevPage, 1);
    assert.equal(result.nextPage, null);
  });

  it("uses the blog page size constant", () => {
    assert.equal(BLOG_POSTS_PER_PAGE, 10);
  });
});

describe("isPageOutOfRange", () => {
  it("allows empty first pages", () => {
    assert.equal(isPageOutOfRange(1, 0, 0), false);
  });

  it("rejects empty later pages and pages beyond the total", () => {
    assert.equal(isPageOutOfRange(2, 0, 0), true);
    assert.equal(isPageOutOfRange(3, 2, 11), true);
  });
});

describe("buildPaginationHref", () => {
  it("omits page 1 and blank query values", () => {
    assert.equal(
      buildPaginationHref({ page: 1, pathname: "/blog", query: "" }),
      "/blog",
    );
  });

  it("preserves search query and page values", () => {
    assert.equal(
      buildPaginationHref({
        page: 2,
        pathname: "/blog",
        query: "payload cms",
      }),
      "/blog?q=payload+cms&page=2",
    );
  });

  it("builds tag pagination URLs", () => {
    assert.equal(
      buildPaginationHref({ page: 3, pathname: "/tags/payload" }),
      "/tags/payload?page=3",
    );
  });
});
