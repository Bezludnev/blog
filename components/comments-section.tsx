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
        <h3 className="comment-author">{comment.authorName}</h3>
        <p className="meta-copy">{formatDate(comment.createdAt)}</p>
      </div>
      <p className="body-copy mt-3 whitespace-pre-wrap">{comment.body}</p>
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
    <section className="comments-section">
      <h2 className="card-title">Comments</h2>
      {threads.length > 0 ? (
        <div className="mt-6 space-y-6">
          {threads.map((thread) => (
            <article
              className="comment-item"
              key={thread.comment.id}
            >
              <CommentBody comment={thread.comment} />
              <ReplyForm parentCommentId={thread.comment.id} postSlug={postSlug} />
              {thread.replies.length > 0 ? (
                <div className="comment-replies space-y-5">
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
        <p className="empty-state mt-6">
          No approved comments yet.
        </p>
      )}
      <CommentForm postSlug={postSlug} />
    </section>
  );
}
