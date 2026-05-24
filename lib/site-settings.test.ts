import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  getProfileSections,
  getSiteBio,
  getSiteHeadline,
  getSiteNavigation,
  getSiteName,
  getSiteSeoDefaults,
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

  it("uses configured navigation rows when valid", () => {
    const settings = {
      navigation: [
        { label: " Writing ", url: " /blog " },
        { label: "Admin", url: "/admin" },
        { label: "Elsewhere", newTab: true, url: "https://example.com" },
        { label: " ", url: "/empty-label" },
        { label: "Missing URL", url: " " },
      ],
    };

    assert.deepEqual(getSiteNavigation(settings), [
      { label: "Writing", newTab: false, url: "/blog" },
      { label: "Elsewhere", newTab: true, url: "https://example.com" },
    ]);
  });

  it("falls back to the current static navigation when empty", () => {
    assert.deepEqual(getSiteNavigation({ navigation: [] }), [
      { label: "About", newTab: false, url: "/about" },
      { label: "Projects", newTab: false, url: "/projects" },
      { label: "Feed", newTab: false, url: "/feed" },
      { label: "Blog", newTab: false, url: "/blog" },
      { label: "Contact", newTab: false, url: "/contact" },
    ]);
  });

  it("does not render public links to the admin route", () => {
    const homeSource = readFileSync(
      new URL("../app/(site)/page.tsx", import.meta.url),
      "utf8",
    );

    assert.doesNotMatch(homeSource, /href="\/admin"/);
    assert.doesNotMatch(homeSource, /Open admin/);
  });

  it("prefers SEO defaults and falls back to current site values", () => {
    assert.deepEqual(
      getSiteSeoDefaults({
        bio: "Fallback description",
        name: "Fallback title",
        seoDefaults: {
          description: "Configured description",
          title: "Configured title",
        },
      }),
      {
        description: "Configured description",
        openGraphImage: undefined,
        title: "Configured title",
      },
    );

    assert.deepEqual(
      getSiteSeoDefaults({
        bio: "Fallback description",
        name: "Fallback title",
        seoDefaults: {
          description: " ",
          title: "",
        },
      }),
      {
        description: "Fallback description",
        openGraphImage: undefined,
        title: "Fallback title",
      },
    );
  });

  it("filters blank profile sections", () => {
    const settings = {
      profileSections: [
        { body: "Built operational systems.", title: "Experience" },
        { body: " ", title: "Stack" },
        { body: "Certifications", title: " " },
      ],
    };

    assert.deepEqual(getProfileSections(settings), [
      { body: "Built operational systems.", title: "Experience" },
    ]);
  });
});
