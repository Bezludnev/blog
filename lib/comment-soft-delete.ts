type CommentSoftDeleteData = {
  body?: string;
  deletedAt?: null | string;
  status?: null | string;
};

export function applyCommentDeletedAt<TData extends CommentSoftDeleteData>(
  data: TData,
  originalDoc?: CommentSoftDeleteData,
  getNow = () => new Date().toISOString(),
) {
  if (data.status === "deleted" && originalDoc?.status !== "deleted") {
    return {
      ...data,
      deletedAt: getNow(),
    };
  }

  if (data.status && data.status !== "deleted" && originalDoc?.status === "deleted") {
    return {
      ...data,
      deletedAt: null,
    };
  }

  return data;
}
