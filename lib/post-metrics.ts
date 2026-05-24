import { createHash } from "node:crypto";

export type VisitorHashRow = {
  value?: null | string;
};

export type PostMetricSnapshot = {
  uniqueViewsApprox?: null | number;
  views?: null | number;
  visitorHashes?: null | VisitorHashRow[];
};

type StoredVisitorHashRow = {
  value: string;
};

export function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getPostMetricKey(postId: string, dateKey: string) {
  return `${postId}:${dateKey}`;
}

export function hashMetricVisitor({
  dateKey,
  ip,
  postId,
  secret,
  userAgent,
}: {
  dateKey: string;
  ip: null | string;
  postId: string;
  secret: string;
  userAgent: null | string;
}) {
  if (!ip && !userAgent) return undefined;

  return createHash("sha256")
    .update([secret, postId, dateKey, ip || "", userAgent || ""].join("|"))
    .digest("hex");
}

export function applyPostView(
  metric: PostMetricSnapshot,
  visitorHash?: string,
) {
  const visitorHashes = (metric.visitorHashes || []).filter(
    (entry): entry is StoredVisitorHashRow => {
      return typeof entry.value === "string" && entry.value.length > 0;
    },
  );
  const hasVisitorHash = Boolean(
    visitorHash && visitorHashes.some((entry) => entry.value === visitorHash),
  );
  const nextVisitorHashes =
    visitorHash && !hasVisitorHash
      ? [...visitorHashes, { value: visitorHash }]
      : visitorHashes;

  return {
    uniqueViewsApprox:
      (metric.uniqueViewsApprox || 0) + (visitorHash && !hasVisitorHash ? 1 : 0),
    views: (metric.views || 0) + 1,
    visitorHashes: nextVisitorHashes,
  };
}
