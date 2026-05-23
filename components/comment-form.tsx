"use client";

import { useRef, useState } from "react";

type CommentFormProps = {
  postSlug: string;
};

type FormState =
  | {
      message: string;
      type: "error" | "success";
    }
  | undefined;

export function CommentForm({ postSlug }: CommentFormProps) {
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
      message: result?.message || "Comment submitted for moderation.",
      type: "success",
    });
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit} ref={formRef}>
      <div>
        <label
          className="block text-sm font-medium text-zinc-800"
          htmlFor="comment-author-name"
        >
          Name
        </label>
        <input
          className="mt-2 w-full border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-950"
          id="comment-author-name"
          maxLength={80}
          name="authorName"
          required
          type="text"
        />
      </div>

      <div>
        <label
          className="block text-sm font-medium text-zinc-800"
          htmlFor="comment-body"
        >
          Comment
        </label>
        <textarea
          className="mt-2 min-h-32 w-full border border-zinc-300 bg-white px-3 py-2 text-zinc-950 outline-none focus:border-zinc-950"
          id="comment-body"
          maxLength={2000}
          name="body"
          required
        />
      </div>

      <div className="hidden" aria-hidden="true">
        <label htmlFor="comment-website">Website</label>
        <input
          autoComplete="off"
          id="comment-website"
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>

      {formState ? (
        <p
          className={
            formState.type === "success" ? "text-sm text-emerald-700" : "text-sm text-red-700"
          }
        >
          {formState.message}
        </p>
      ) : null}

      <button
        className="border border-zinc-950 bg-zinc-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Submitting..." : "Submit comment"}
      </button>
    </form>
  );
}
