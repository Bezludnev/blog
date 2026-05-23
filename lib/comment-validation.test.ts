import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_COMMENT_BODY_LENGTH,
  validateCommentInput,
} from "./comment-validation.ts";

describe("validateCommentInput", () => {
  it("accepts valid comment input and trims fields", () => {
    const result = validateCommentInput({
      authorName: "  Ada  ",
      body: "  Useful post.  ",
      postSlug: "hello-world",
      website: "",
    });

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.deepEqual(result.value, {
        authorName: "Ada",
        body: "Useful post.",
        postSlug: "hello-world",
        website: "",
      });
    }
  });

  it("rejects empty required fields", () => {
    const result = validateCommentInput({
      authorName: " ",
      body: " ",
      postSlug: " ",
      website: "",
    });

    assert.equal(result.ok, false);
  });

  it("rejects comments over the body length limit", () => {
    const result = validateCommentInput({
      authorName: "Ada",
      body: "x".repeat(MAX_COMMENT_BODY_LENGTH + 1),
      postSlug: "hello-world",
      website: "",
    });

    assert.equal(result.ok, false);
  });
});
