import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildCommentThreads,
  getRelationshipId,
} from "./comment-replies.ts";

type TestComment = {
  id: string;
  authorName: string;
  parentComment?: null | string | { id?: string };
};

describe("getRelationshipId", () => {
  it("extracts string and object relationship IDs", () => {
    assert.equal(getRelationshipId("comment-1"), "comment-1");
    assert.equal(getRelationshipId({ id: "comment-2" }), "comment-2");
    assert.equal(getRelationshipId(null), undefined);
    assert.equal(getRelationshipId({}), undefined);
  });
});

describe("buildCommentThreads", () => {
  it("groups replies under top-level comments", () => {
    const result = buildCommentThreads<TestComment>([
      { authorName: "Ada", id: "parent-1" },
      {
        authorName: "Grace",
        id: "reply-1",
        parentComment: "parent-1",
      },
      { authorName: "Linus", id: "parent-2" },
    ]);

    assert.deepEqual(
      result.map((thread) => ({
        id: thread.comment.id,
        replies: thread.replies.map((reply) => reply.id),
      })),
      [
        { id: "parent-1", replies: ["reply-1"] },
        { id: "parent-2", replies: [] },
      ],
    );
  });

  it("does not render orphan replies as top-level comments", () => {
    const result = buildCommentThreads<TestComment>([
      {
        authorName: "Grace",
        id: "reply-1",
        parentComment: "missing-parent",
      },
    ]);

    assert.deepEqual(result, []);
  });

  it("does not render replies to replies as another nested level", () => {
    const result = buildCommentThreads<TestComment>([
      { authorName: "Ada", id: "parent-1" },
      {
        authorName: "Grace",
        id: "reply-1",
        parentComment: "parent-1",
      },
      {
        authorName: "Katherine",
        id: "reply-2",
        parentComment: "reply-1",
      },
    ]);

    assert.deepEqual(result[0]?.replies.map((reply) => reply.id), ["reply-1"]);
  });
});
