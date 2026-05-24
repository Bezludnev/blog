export type RssFeedItem = {
  title: string;
  url: string;
  guid: string;
  description: string;
  publishedAt?: null | string;
};

export type RssFeedInput = {
  title: string;
  description: string;
  siteUrl: string;
  feedUrl: string;
  items: RssFeedItem[];
};

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatRssDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toUTCString();
}

function buildItem(item: RssFeedItem) {
  const pubDate = item.publishedAt ? formatRssDate(item.publishedAt) : "";

  return [
    "    <item>",
    `      <title>${escapeXml(item.title)}</title>`,
    `      <link>${escapeXml(item.url)}</link>`,
    `      <guid>${escapeXml(item.guid)}</guid>`,
    `      <description>${escapeXml(item.description)}</description>`,
    pubDate ? `      <pubDate>${escapeXml(pubDate)}</pubDate>` : "",
    "    </item>",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildRssFeed(input: RssFeedInput) {
  const lastPublishedAt = input.items.find((item) => item.publishedAt)
    ?.publishedAt;
  const lastBuildDate = lastPublishedAt
    ? formatRssDate(lastPublishedAt)
    : new Date().toUTCString();

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(input.title)}</title>`,
    `    <link>${escapeXml(input.siteUrl)}</link>`,
    `    <description>${escapeXml(input.description)}</description>`,
    "    <language>en</language>",
    `    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(input.feedUrl)}" rel="self" type="application/rss+xml" />`,
    ...input.items.map(buildItem),
    "  </channel>",
    "</rss>",
  ].join("\n");
}
