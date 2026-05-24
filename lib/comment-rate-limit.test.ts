import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULT_COMMENT_RATE_LIMIT_MAX,
  DEFAULT_COMMENT_RATE_LIMIT_WINDOW_SECONDS,
  buildCommentRateLimitWhere,
  getCommentRateLimitConfig,
  getCommentRateLimitWindowStart,
  isCommentRateLimitExceeded,
} from "./comment-rate-limit.ts";

describe("getCommentRateLimitConfig", () => {
  it("uses defaults when env values are missing", () => {
    assert.deepEqual(getCommentRateLimitConfig({}), {
      max: DEFAULT_COMMENT_RATE_LIMIT_MAX,
      windowSeconds: DEFAULT_COMMENT_RATE_LIMIT_WINDOW_SECONDS,
    });
  });

  it("parses positive integer env values", () => {
    assert.deepEqual(
      getCommentRateLimitConfig({
        COMMENT_RATE_LIMIT_MAX: "2",
        COMMENT_RATE_LIMIT_WINDOW_SECONDS: "60",
      }),
      {
        max: 2,
        windowSeconds: 60,
      },
    );
  });

  it("falls back for invalid env values", () => {
    assert.deepEqual(
      getCommentRateLimitConfig({
        COMMENT_RATE_LIMIT_MAX: "0",
        COMMENT_RATE_LIMIT_WINDOW_SECONDS: "nope",
      }),
      {
        max: DEFAULT_COMMENT_RATE_LIMIT_MAX,
        windowSeconds: DEFAULT_COMMENT_RATE_LIMIT_WINDOW_SECONDS,
      },
    );
  });
});

describe("getCommentRateLimitWindowStart", () => {
  it("subtracts the configured number of seconds", () => {
    const now = new Date("2026-05-24T12:00:00.000Z");

    assert.equal(
      getCommentRateLimitWindowStart(now, 300).toISOString(),
      "2026-05-24T11:55:00.000Z",
    );
  });
});

describe("isCommentRateLimitExceeded", () => {
  it("allows counts below max", () => {
    assert.equal(isCommentRateLimitExceeded(4, 5), false);
  });

  it("blocks counts equal to max", () => {
    assert.equal(isCommentRateLimitExceeded(5, 5), true);
  });
});

describe("buildCommentRateLimitWhere", () => {
  it("builds a query with both request hashes", () => {
    assert.deepEqual(
      buildCommentRateLimitWhere({
        ipHash: "ip-hash",
        postId: "post-id",
        userAgentHash: "ua-hash",
        windowStart: new Date("2026-05-24T12:00:00.000Z"),
      }),
      {
        and: [
          { post: { equals: "post-id" } },
          {
            createdAt: {
              greater_than_equal: "2026-05-24T12:00:00.000Z",
            },
          },
          { ipHash: { equals: "ip-hash" } },
          { userAgentHash: { equals: "ua-hash" } },
        ],
      },
    );
  });

  it("builds a query with only an IP hash", () => {
    assert.deepEqual(
      buildCommentRateLimitWhere({
        ipHash: "ip-hash",
        postId: "post-id",
        userAgentHash: undefined,
        windowStart: new Date("2026-05-24T12:00:00.000Z"),
      }),
      {
        and: [
          { post: { equals: "post-id" } },
          {
            createdAt: {
              greater_than_equal: "2026-05-24T12:00:00.000Z",
            },
          },
          { ipHash: { equals: "ip-hash" } },
        ],
      },
    );
  });

  it("builds a query with only a user-agent hash", () => {
    assert.deepEqual(
      buildCommentRateLimitWhere({
        ipHash: undefined,
        postId: "post-id",
        userAgentHash: "ua-hash",
        windowStart: new Date("2026-05-24T12:00:00.000Z"),
      }),
      {
        and: [
          { post: { equals: "post-id" } },
          {
            createdAt: {
              greater_than_equal: "2026-05-24T12:00:00.000Z",
            },
          },
          { userAgentHash: { equals: "ua-hash" } },
        ],
      },
    );
  });

  it("returns null when no request identity is available", () => {
    assert.equal(
      buildCommentRateLimitWhere({
        ipHash: undefined,
        postId: "post-id",
        userAgentHash: undefined,
        windowStart: new Date("2026-05-24T12:00:00.000Z"),
      }),
      null,
    );
  });
});
