import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { applyCommentDeletedAt } from "./comment-soft-delete.ts";

describe("applyCommentDeletedAt", () => {
  it("sets deletedAt when status changes to deleted", () => {
    assert.deepEqual(
      applyCommentDeletedAt(
        { status: "deleted" },
        { status: "approved" },
        () => "2026-05-24T12:00:00.000Z",
      ),
      {
        deletedAt: "2026-05-24T12:00:00.000Z",
        status: "deleted",
      },
    );
  });

  it("clears deletedAt when a deleted comment is restored", () => {
    assert.deepEqual(
      applyCommentDeletedAt(
        { status: "approved" },
        { deletedAt: "2026-05-24T12:00:00.000Z", status: "deleted" },
        () => "2026-05-24T13:00:00.000Z",
      ),
      {
        deletedAt: null,
        status: "approved",
      },
    );
  });

  it("leaves updates without status transitions unchanged", () => {
    const data = { body: "Updated body" };

    assert.strictEqual(
      applyCommentDeletedAt(data, { status: "approved" }),
      data,
    );
  });
});
