import { getApprovedCommentsForPost } from "@/lib/comments";

import { CommentForm } from "./comment-form";

type CommentsSectionProps = {
  postId: string;
  postSlug: string;
};

function formatDate(value?: null | string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export async function CommentsSection({
  postId,
  postSlug,
}: CommentsSectionProps) {
  const comments = await getApprovedCommentsForPost(postId);

  return (
    <section className="mt-10 border-t border-zinc-200 pt-10">
      <h2 className="text-2xl font-semibold text-zinc-950">Comments</h2>
      {comments.length > 0 ? (
        <div className="mt-6 space-y-6">
          {comments.map((comment) => (
            <article className="border-b border-zinc-200 pb-6" key={comment.id}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-medium text-zinc-950">
                  {comment.authorName}
                </h3>
                <p className="text-sm text-zinc-500">
                  {formatDate(comment.createdAt)}
                </p>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-zinc-700">
                {comment.body}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 border border-dashed border-zinc-300 p-4 text-zinc-600">
          No approved comments yet.
        </p>
      )}
      <CommentForm postSlug={postSlug} />
    </section>
  );
}
