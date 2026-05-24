export const CURATED_LINK_TYPES = [
  "article",
  "video",
  "tool",
  "repo",
  "other",
] as const;

export type CuratedLinkType = (typeof CURATED_LINK_TYPES)[number];

const TYPE_LABELS: Record<CuratedLinkType, string> = {
  article: "Article",
  other: "Other",
  repo: "Repository",
  tool: "Tool",
  video: "Video",
};

export function isCuratedLinkType(value: unknown): value is CuratedLinkType {
  return (
    typeof value === "string" &&
    CURATED_LINK_TYPES.includes(value as CuratedLinkType)
  );
}

export function getCuratedLinkTypeLabel(type: CuratedLinkType) {
  return TYPE_LABELS[type];
}

export function isSafeExternalUrl(value: unknown) {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
