import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isAnalyticsEnabled } from "./analytics.ts";

describe("isAnalyticsEnabled", () => {
  it("enables analytics only for the exact true string", () => {
    assert.equal(isAnalyticsEnabled("true"), true);
    assert.equal(isAnalyticsEnabled("false"), false);
    assert.equal(isAnalyticsEnabled("TRUE"), false);
    assert.equal(isAnalyticsEnabled(undefined), false);
    assert.equal(isAnalyticsEnabled(""), false);
  });
});
