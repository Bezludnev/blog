import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  applyPostView,
  getPostMetricKey,
  getUtcDateKey,
  hashMetricVisitor,
} from "./post-metrics.ts";

describe("getUtcDateKey", () => {
  it("returns a UTC YYYY-MM-DD key", () => {
    assert.equal(
      getUtcDateKey(new Date("2026-05-24T23:59:59.000Z")),
      "2026-05-24",
    );
  });
});

describe("getPostMetricKey", () => {
  it("combines post ID and date key", () => {
    assert.equal(getPostMetricKey("post-1", "2026-05-24"), "post-1:2026-05-24");
  });
});

describe("hashMetricVisitor", () => {
  it("returns a stable hash without exposing raw input", () => {
    const first = hashMetricVisitor({
      dateKey: "2026-05-24",
      ip: "203.0.113.10",
      postId: "post-1",
      secret: "secret",
      userAgent: "test-agent",
    });
    const second = hashMetricVisitor({
      dateKey: "2026-05-24",
      ip: "203.0.113.10",
      postId: "post-1",
      secret: "secret",
      userAgent: "test-agent",
    });

    assert.equal(first, second);
    assert.notEqual(first, "203.0.113.10");
    assert.match(first || "", /^[a-f0-9]{64}$/);
  });

  it("returns undefined when no request identity is available", () => {
    assert.equal(
      hashMetricVisitor({
        dateKey: "2026-05-24",
        ip: null,
        postId: "post-1",
        secret: "secret",
        userAgent: null,
      }),
      undefined,
    );
  });
});

describe("applyPostView", () => {
  it("increments views and unique views for a new visitor hash", () => {
    assert.deepEqual(
      applyPostView(
        {
          uniqueViewsApprox: 1,
          views: 4,
          visitorHashes: [{ value: "existing" }],
        },
        "new-hash",
      ),
      {
        uniqueViewsApprox: 2,
        views: 5,
        visitorHashes: [{ value: "existing" }, { value: "new-hash" }],
      },
    );
  });

  it("does not increment unique views twice for the same visitor hash", () => {
    assert.deepEqual(
      applyPostView(
        {
          uniqueViewsApprox: 1,
          views: 4,
          visitorHashes: [{ value: "existing" }],
        },
        "existing",
      ),
      {
        uniqueViewsApprox: 1,
        views: 5,
        visitorHashes: [{ value: "existing" }],
      },
    );
  });
});
