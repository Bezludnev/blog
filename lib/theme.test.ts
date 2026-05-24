import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

describe("site theme bootstrap layout", () => {
  it("uses Next Script instead of rendering a raw script tag", () => {
    const layoutSource = readFileSync(
      new URL("../app/(site)/layout.tsx", import.meta.url),
      "utf8",
    );

    assert.match(layoutSource, /from "next\/script"/);
    assert.match(layoutSource, /<Script\b/);
    assert.match(layoutSource, /id="theme-bootstrap"/);
    assert.match(layoutSource, /strategy="beforeInteractive"/);
    assert.doesNotMatch(layoutSource, /<script\b/);
  });
});

describe("theme toggle hydration", () => {
  it("uses the same initial theme state on the server and client", () => {
    const toggleSource = readFileSync(
      new URL("../components/theme-toggle.tsx", import.meta.url),
      "utf8",
    );

    assert.match(toggleSource, /useState<StoredTheme>\("light"\)/);
    assert.doesNotMatch(toggleSource, /useState<StoredTheme>\(\(\) =>/);
  });
});
