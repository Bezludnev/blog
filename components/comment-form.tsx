"use client";

import { useId, useRef, useState } from "react";

type CommentFormProps = {
  parentCommentId?: string;
  postSlug: string;
  submitLabel?: string;
  successMessage?: string;
};

type FormState =
  | {
      message: string;
      type: "error" | "success";
    }
  | undefined;

export function CommentForm({
  parentCommentId,
  postSlug,
  submitLabel = "Submit comment",
  successMessage = "Comment submitted for moderation.",
}: CommentFormProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [formState, setFormState] = useState<FormState>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormState(undefined);

    const formData = new FormData(event.currentTarget);

    const response = await fetch("/api/comments", {
      body: JSON.stringify({
        authorName: formData.get("authorName"),
        body: formData.get("body"),
        parentCommentId,
        postSlug,
        website: formData.get("website"),
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const result = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    setIsSubmitting(false);

    if (!response.ok) {
      setFormState({
        message: result?.message || "Could not submit comment.",
        type: "error",
      });
      return;
    }

    formRef.current?.reset();
    setFormState({
      message: result?.message || successMessage,
      type: "success",
    });
  }

  const authorNameId = `${formId}-comment-author-name`;
  const bodyId = `${formId}-comment-body`;
  const websiteId = `${formId}-comment-website`;

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit} ref={formRef}>
      <div>
        <label
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
          htmlFor={authorNameId}
        >
          Name
        </label>
        <input
          className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
          id={authorNameId}
          maxLength={80}
          name="authorName"
          required
          type="text"
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-zinc-800 dark:text-zinc-200"
          htmlFor={bodyId}
        >
          Comment
        </label>
        <textarea
          className="mt-2 min-h-32 w-full border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-100"
          id={bodyId}
          maxLength={2000}
          name="body"
          required
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor={websiteId}>Website</label>
        <input
          autoComplete="off"
          id={websiteId}
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>

      {formState ? (
        <p
          className={
            formState.type === "success"
              ? "text-sm text-emerald-700 dark:text-emerald-400"
              : "text-sm text-red-700 dark:text-red-400"
          }
        >
          {formState.message}
        </p>
      ) : null}

      <button
        className="border border-zinc-950 bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Submitting..." : submitLabel}
      </button>
    </form>
  );
}

type ReplyFormProps = {
  parentCommentId: string;
  postSlug: string;
};

export function ReplyForm({ parentCommentId, postSlug }: ReplyFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4">
      <button
        className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
        onClick={() => setIsOpen((value) => !value)}
        type="button"
      >
        {isOpen ? "Cancel reply" : "Reply"}
      </button>
      {isOpen ? (
        <CommentForm
          parentCommentId={parentCommentId}
          postSlug={postSlug}
          submitLabel="Submit reply"
          successMessage="Reply submitted for moderation."
        />
      ) : null}
    </div>
  );
}
