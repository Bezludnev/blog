import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeSearchQuery, postMatchesSearch } from "./search.ts";

describe("normalizeSearchQuery", () => {
  it("trims whitespace", () => {
    assert.equal(normalizeSearchQuery("  payload cms  "), "payload cms");
  });

  it("returns empty string for missing values", () => {
    assert.equal(normalizeSearchQuery(undefined), "");
    assert.equal(normalizeSearchQuery([]), "");
  });

  it("uses the first query value when Next passes an array", () => {
    assert.equal(normalizeSearchQuery(["first", "second"]), "first");
  });
});

describe("postMatchesSearch", () => {
  it("matches title, excerpt, and Lexical content text", () => {
    const post = {
      title: "Payload setup",
      excerpt: "CMS notes",
      content: {
        root: {
          children: [
            {
              children: [{ text: "MongoDB adapter" }],
            },
          ],
        },
      },
    };

    assert.equal(postMatchesSearch(post, "payload"), true);
    assert.equal(postMatchesSearch(post, "notes"), true);
    assert.equal(postMatchesSearch(post, "adapter"), true);
    assert.equal(postMatchesSearch(post, "missing"), false);
  });
});
