import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildRssFeed, escapeXml } from "./rss.ts";

describe("escapeXml", () => {
  it("escapes XML special characters", () => {
    assert.equal(
      escapeXml(`A & B < C > "D" 'E'`),
      "A &amp; B &lt; C &gt; &quot;D&quot; &apos;E&apos;",
    );
  });
});

describe("buildRssFeed", () => {
  it("renders escaped feed and item XML", () => {
    const xml = buildRssFeed({
      title: "MConverter.eu & Blog",
      description: "Published notes",
      siteUrl: "https://example.com",
      feedUrl: "https://example.com/rss.xml",
      items: [
        {
          title: "Payload & Next",
          url: "https://example.com/blog/payload",
          guid: "https://example.com/blog/payload",
          description: "CMS <notes>",
          publishedAt: "2026-05-24T10:00:00.000Z",
        },
      ],
    });

    assert.match(
      xml,
      /<rss version="2.0" xmlns:atom="http:\/\/www.w3.org\/2005\/Atom">/,
    );
    assert.match(xml, /MConverter\.eu &amp; Blog/);
    assert.match(xml, /<language>en<\/language>/);
    assert.match(xml, /Payload &amp; Next/);
    assert.match(xml, /CMS &lt;notes&gt;/);
    assert.match(xml, /Sun, 24 May 2026 10:00:00 GMT/);
  });
});
