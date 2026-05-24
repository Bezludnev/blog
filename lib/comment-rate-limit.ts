import type { Where } from "payload";

export const DEFAULT_COMMENT_RATE_LIMIT_WINDOW_SECONDS = 300;
export const DEFAULT_COMMENT_RATE_LIMIT_MAX = 5;

type CommentRateLimitEnv = {
  COMMENT_RATE_LIMIT_MAX?: string;
  COMMENT_RATE_LIMIT_WINDOW_SECONDS?: string;
};

type CommentRateLimitWhereInput = {
  ipHash?: string;
  postId: string;
  userAgentHash?: string;
  windowStart: Date;
};

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getCommentRateLimitConfig(
  env: CommentRateLimitEnv = {
    COMMENT_RATE_LIMIT_MAX: process.env.COMMENT_RATE_LIMIT_MAX,
    COMMENT_RATE_LIMIT_WINDOW_SECONDS:
      process.env.COMMENT_RATE_LIMIT_WINDOW_SECONDS,
  },
) {
  return {
    max: parsePositiveInteger(
      env.COMMENT_RATE_LIMIT_MAX,
      DEFAULT_COMMENT_RATE_LIMIT_MAX,
    ),
    windowSeconds: parsePositiveInteger(
      env.COMMENT_RATE_LIMIT_WINDOW_SECONDS,
      DEFAULT_COMMENT_RATE_LIMIT_WINDOW_SECONDS,
    ),
  };
}

export function getCommentRateLimitWindowStart(
  now: Date,
  windowSeconds: number,
) {
  return new Date(now.getTime() - windowSeconds * 1000);
}

export function isCommentRateLimitExceeded(count: number, max: number) {
  return count >= max;
}

export function buildCommentRateLimitWhere({
  ipHash,
  postId,
  userAgentHash,
  windowStart,
}: CommentRateLimitWhereInput): Where | null {
  const identityFilters: Where[] = [];

  if (ipHash) {
    identityFilters.push({ ipHash: { equals: ipHash } });
  }

  if (userAgentHash) {
    identityFilters.push({ userAgentHash: { equals: userAgentHash } });
  }

  if (identityFilters.length === 0) {
    return null;
  }

  return {
    and: [
      { post: { equals: postId } },
      { createdAt: { greater_than_equal: windowStart.toISOString() } },
      ...identityFilters,
    ],
  };
}
