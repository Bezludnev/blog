export const MAX_COMMENT_NAME_LENGTH = 80;
export const MAX_COMMENT_BODY_LENGTH = 2000;

type CommentInput = {
  authorName?: unknown;
  body?: unknown;
  parentCommentId?: unknown;
  postSlug?: unknown;
  startedAt?: unknown;
  website?: unknown;
};

type ValidCommentInput = {
  authorName: string;
  body: string;
  parentCommentId?: string;
  postSlug: string;
  startedAt?: string;
  website: string;
};

type CommentValidationResult =
  | {
      ok: true;
      value: ValidCommentInput;
    }
  | {
      ok: false;
      message: string;
    };

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function containsHtmlLikeInput(value: string) {
  return /<[^>]+>/.test(value);
}

export function validateCommentInput(
  input: CommentInput,
): CommentValidationResult {
  const authorName = asString(input.authorName);
  const body = asString(input.body);
  const parentCommentId = asString(input.parentCommentId);
  const postSlug = asString(input.postSlug);
  const startedAt = asString(input.startedAt);
  const website = asString(input.website);

  if (!postSlug) {
    return { ok: false, message: "Post is required." };
  }

  if (!authorName) {
    return { ok: false, message: "Name is required." };
  }

  if (authorName.length > MAX_COMMENT_NAME_LENGTH) {
    return { ok: false, message: "Name is too long." };
  }

  if (containsHtmlLikeInput(authorName)) {
    return { ok: false, message: "HTML is not allowed." };
  }

  if (!body) {
    return { ok: false, message: "Comment is required." };
  }

  if (body.length > MAX_COMMENT_BODY_LENGTH) {
    return { ok: false, message: "Comment is too long." };
  }

  if (containsHtmlLikeInput(body)) {
    return { ok: false, message: "HTML is not allowed." };
  }

  return {
    ok: true,
    value: {
      authorName,
      body,
      ...(parentCommentId ? { parentCommentId } : {}),
      postSlug,
      ...(startedAt ? { startedAt } : {}),
      website,
    },
  };
}
