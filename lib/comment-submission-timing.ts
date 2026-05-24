export const COMMENT_MINIMUM_FILL_TIME_MS = 3000;

type CommentSubmissionTimingInput = {
  minimumFillTimeMs?: number;
  now?: Date;
  startedAt?: string;
};

type CommentSubmissionTimingResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export function validateCommentSubmissionTiming({
  minimumFillTimeMs = COMMENT_MINIMUM_FILL_TIME_MS,
  now = new Date(),
  startedAt,
}: CommentSubmissionTimingInput): CommentSubmissionTimingResult {
  if (!startedAt) {
    return { ok: true };
  }

  const startedAtTime = Date.parse(startedAt);

  if (!Number.isFinite(startedAtTime)) {
    return { ok: true };
  }

  if (now.getTime() - startedAtTime < minimumFillTimeMs) {
    return { ok: false, message: "Comment submitted for moderation." };
  }

  return { ok: true };
}
