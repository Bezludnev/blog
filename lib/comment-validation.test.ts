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

  it("accepts optional parent comment IDs for replies", () => {
    const result = validateCommentInput({
      authorName: "Ada",
      body: "Reply body",
      parentCommentId: " parent-comment-id ",
      postSlug: "hello-world",
      website: "",
    });

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.value.parentCommentId, "parent-comment-id");
    }
  });

  it("omits blank parent comment IDs for top-level comments", () => {
    const result = validateCommentInput({
      authorName: "Ada",
      body: "Top-level body",
      parentCommentId: " ",
      postSlug: "hello-world",
      website: "",
    });

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.value.parentCommentId, undefined);
    }
  });

  it("accepts optional submission start timestamps", () => {
    const result = validateCommentInput({
      authorName: "Ada",
      body: "Top-level body",
      postSlug: "hello-world",
      startedAt: "  2026-05-24T12:00:00.000Z  ",
      website: "",
    });

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.value.startedAt, "2026-05-24T12:00:00.000Z");
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

  it("rejects script tags in comment bodies", () => {
    const result = validateCommentInput({
      authorName: "Ada",
      body: "<script>alert(1)</script>",
      postSlug: "hello-world",
      website: "",
    });

    assert.deepEqual(result, {
      ok: false,
      message: "HTML is not allowed.",
    });
  });

  it("rejects HTML tags in comment bodies", () => {
    const result = validateCommentInput({
      authorName: "Ada",
      body: "<b>bold</b>",
      postSlug: "hello-world",
      website: "",
    });

    assert.deepEqual(result, {
      ok: false,
      message: "HTML is not allowed.",
    });
  });

  it("rejects HTML-like content in names and bodies", () => {
    assert.deepEqual(
      validateCommentInput({
        authorName: "Ada <admin>",
        body: "Useful post.",
        postSlug: "hello-world",
        website: "",
      }),
      {
        ok: false,
        message: "HTML is not allowed.",
      },
    );

    assert.deepEqual(
      validateCommentInput({
        authorName: "Ada",
        body: "I prefer <this> approach.",
        postSlug: "hello-world",
        website: "",
      }),
      {
        ok: false,
        message: "HTML is not allowed.",
      },
    );
  });
});
