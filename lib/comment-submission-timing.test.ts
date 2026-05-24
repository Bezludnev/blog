import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMMENT_MINIMUM_FILL_TIME_MS,
  validateCommentSubmissionTiming,
} from "./comment-submission-timing.ts";

describe("validateCommentSubmissionTiming", () => {
  const now = new Date("2026-05-24T12:00:00.000Z");

  it("allows missing start timestamps", () => {
    assert.deepEqual(validateCommentSubmissionTiming({ now }), { ok: true });
  });

  it("rejects submissions faster than the minimum fill time", () => {
    const startedAt = new Date(
      now.getTime() - COMMENT_MINIMUM_FILL_TIME_MS + 1,
    ).toISOString();

    assert.deepEqual(validateCommentSubmissionTiming({ now, startedAt }), {
      ok: false,
      message: "Comment submitted for moderation.",
    });
  });

  it("allows submissions at or above the minimum fill time", () => {
    const startedAt = new Date(
      now.getTime() - COMMENT_MINIMUM_FILL_TIME_MS,
    ).toISOString();

    assert.deepEqual(validateCommentSubmissionTiming({ now, startedAt }), {
      ok: true,
    });
  });

  it("allows invalid start timestamps as absent values", () => {
    assert.deepEqual(
      validateCommentSubmissionTiming({
        now,
        startedAt: "not a date",
      }),
      { ok: true },
    );
  });
});
