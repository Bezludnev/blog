type RelationshipValue =
  | null
  | string
  | undefined
  | {
      id?: unknown;
    };

type CommentWithParent = {
  id: string;
  parentComment?: RelationshipValue;
};

export type CommentThread<T extends CommentWithParent> = {
  comment: T;
  replies: T[];
};

export function getRelationshipId(value: RelationshipValue) {
  if (typeof value === "string") return value;

  if (
    typeof value === "object" &&
    value !== null &&
    typeof value.id === "string"
  ) {
    return value.id;
  }

  return undefined;
}

export function buildCommentThreads<T extends CommentWithParent>(
  comments: T[],
): CommentThread<T>[] {
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const topLevel = comments.filter(
    (comment) => !getRelationshipId(comment.parentComment),
  );
  const repliesByParent = new Map<string, T[]>();

  for (const comment of comments) {
    const parentId = getRelationshipId(comment.parentComment);

    if (!parentId) continue;

    const parent = byId.get(parentId);

    if (!parent || getRelationshipId(parent.parentComment)) continue;

    const replies = repliesByParent.get(parentId) || [];
    replies.push(comment);
    repliesByParent.set(parentId, replies);
  }

  return topLevel.map((comment) => ({
    comment,
    replies: repliesByParent.get(comment.id) || [],
  }));
}
