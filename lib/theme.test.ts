import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  THEME_STORAGE_KEY,
  getNextStoredTheme,
  getThemeBootstrapScript,
  isStoredTheme,
} from "./theme.ts";

describe("isStoredTheme", () => {
  it("accepts only stored light and dark values", () => {
    assert.equal(isStoredTheme("light"), true);
    assert.equal(isStoredTheme("dark"), true);
    assert.equal(isStoredTheme("system"), false);
    assert.equal(isStoredTheme(""), false);
    assert.equal(isStoredTheme(undefined), false);
  });
});

describe("getNextStoredTheme", () => {
  it("switches between light and dark values", () => {
    assert.equal(getNextStoredTheme("light"), "dark");
    assert.equal(getNextStoredTheme("dark"), "light");
  });
});

describe("getThemeBootstrapScript", () => {
  it("references the storage key and dark class", () => {
    const script = getThemeBootstrapScript();

    assert.match(script, new RegExp(THEME_STORAGE_KEY));
    assert.match(script, /classList/);
    assert.match(script, /dark/);
    assert.match(script, /prefers-color-scheme/);
  });
});
