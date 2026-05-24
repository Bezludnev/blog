import type { Comment } from "@/payload-types";
import { getApprovedCommentsForPost } from "@/lib/comments";
import { buildCommentThreads } from "@/lib/comment-replies";

import { CommentForm, ReplyForm } from "./comment-form";

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

function CommentBody({ comment }: { comment: Comment }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-medium text-zinc-950 dark:text-zinc-100">{comment.authorName}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{formatDate(comment.createdAt)}</p>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{comment.body}</p>
    </>
  );
}

export async function CommentsSection({
  postId,
  postSlug,
}: CommentsSectionProps) {
  const comments = await getApprovedCommentsForPost(postId);
  const threads = buildCommentThreads(comments);

  return (
    <section className="mt-10 border-t border-zinc-200 pt-10 dark:border-zinc-800">
      <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-100">Comments</h2>
      {threads.length > 0 ? (
        <div className="mt-6 space-y-6">
          {threads.map((thread) => (
            <article
              className="border-b border-zinc-200 pb-6 dark:border-zinc-800"
              key={thread.comment.id}
            >
              <CommentBody comment={thread.comment} />
              <ReplyForm parentCommentId={thread.comment.id} postSlug={postSlug} />
              {thread.replies.length > 0 ? (
                <div className="mt-6 space-y-5 border-l border-zinc-200 pl-5 dark:border-zinc-800">
                  {thread.replies.map((reply) => (
                    <article key={reply.id}>
                      <CommentBody comment={reply} />
                    </article>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-6 border border-dashed border-zinc-300 p-4 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          No approved comments yet.
        </p>
      )}
      <CommentForm postSlug={postSlug} />
    </section>
  );
}
