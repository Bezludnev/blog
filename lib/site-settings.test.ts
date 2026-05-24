import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getSiteBio,
  getSiteHeadline,
  getSiteName,
} from "./site-settings.ts";

describe("site settings fallbacks", () => {
  it("uses configured site settings when present", () => {
    const settings = {
      bio: "I build reliable product systems.",
      headline: "Senior product engineer",
      name: "Example.dev",
    };

    assert.equal(getSiteName(settings), "Example.dev");
    assert.equal(getSiteHeadline(settings), "Senior product engineer");
    assert.equal(getSiteBio(settings), "I build reliable product systems.");
  });

  it("uses static fallbacks for missing or blank settings", () => {
    const settings = {
      bio: " ",
      headline: "",
      name: "",
    };

    assert.equal(getSiteName(settings), "Personal Engineering Blog");
    assert.equal(getSiteHeadline(settings), "Personal engineering blog");
    assert.match(getSiteBio(settings), /software delivery/i);
  });
});
