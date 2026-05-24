# Blog Comment Replies Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add moderated two-level replies to existing blog comments.

**Architecture:** Add `parentComment` as an optional self-relationship on the existing `comments` collection. Keep validation split between pure input/thread helpers, public route checks for visitor submissions, and a collection hook that prevents deeper nesting or cross-post parent links. Render approved comments as a two-level tree while keeping the existing bottom form for top-level comments.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, PayloadCMS 3.84.x Local API, MongoDB, Tailwind CSS 4, Node test runner, pnpm.

---

## Source Documents

- Product PRD: `docs/_personal_blog_PRD_lichnyj_sajt_blog_free_first_NextJS_PayloadCMS_MongoDB.md`
- Comment replies design: `docs/superpowers/specs/2026-05-24-blog-comment-replies-design.md`
- Comments moderation design: `docs/superpowers/specs/2026-05-23-blog-comments-design.md`
- Comment anti-spam design: `docs/superpowers/specs/2026-05-24-blog-comment-anti-spam-design.md`
- Revalidation design: `docs/superpowers/specs/2026-05-24-blog-revalidation-design.md`
- Payload docs checked through Context7: relationship fields use `type: "relationship"` with `relationTo`, collection access can remain admin-only, Local API operations can use `overrideAccess`, and `beforeValidate`/`beforeChange` hooks can enforce server-side rules.
- Next.js docs checked through Context7: App Router route handlers can implement `POST(request: Request)`, parse JSON with `request.json()`, and return JSON responses.

## Implementation Rules

- Use @test-driven-development for pure helpers before production changes.
- Use @verification-before-completion before claiming completion.
- Keep comments moderated: public submissions and replies must create `status = pending`.
- Keep public reads scoped to `status = approved`.
- Keep rate limiting shared across top-level comments and replies.
- Do not collect email.
- Do not add notifications, metrics, comment pagination, voting, or unlimited nesting.
- Do not change RSS, sitemap, analytics, revalidation constants, projects, tags, site settings, or theme styling.
- Do not commit unless the user explicitly asks.

## File Map

Create:

- `lib/comment-replies.ts`: pure helpers for extracting relationship IDs and grouping approved comments into two-level threads.
- `lib/comment-replies.test.ts`: Node tests for thread-building behavior.

Modify:

- `lib/comment-validation.ts`: accept optional `parentCommentId`.
- `lib/comment-validation.test.ts`: cover optional reply target validation and existing top-level behavior.
- `collections/Comments.ts`: add `parentComment` field and server-side parent validation hook.
- `app/(site)/api/comments/route.ts`: validate `parentCommentId` and create pending replies.
- `lib/comments.ts`: return approved comments with enough relationship depth for thread grouping.
- `components/comment-form.tsx`: support optional `parentCommentId` and reusable submit labels/messages.
- `components/comments-section.tsx`: build/render a two-level comment tree and reply form for top-level comments only.
- `payload-types.ts`: regenerate after the schema change.
- `app/(payload)/admin/importMap.js`: regenerate only if Payload updates it.
- `README.md`: add manual verification steps for replies.

Do not modify:

- `payload.config.ts`
- `app/(site)/blog/[slug]/page.tsx`
- `app/(site)/api/revalidate/route.ts`
- `lib/revalidation.ts`
- `lib/payload-revalidation.ts`
- `lib/comment-rate-limit.ts`
- `app/(site)/rss.xml/route.ts`
- `app/(site)/sitemap.ts`
- `collections/Posts.ts`
- `collections/Projects.ts`
- `globals/SiteSettings.ts`

## Chunk 1: Pure Reply Helpers

### Task 1: Add failing thread-builder tests

**Files:**

- Create: `lib/comment-replies.test.ts`

- [ ] **Step 1: Write tests**

  ```ts
  import assert from "node:assert/strict";
  import { describe, it } from "node:test";

  import {
    buildCommentThreads,
    getRelationshipId,
  } from "./comment-replies.ts";

  type TestComment = {
    id: string;
    authorName: string;
    parentComment?: null | string | { id?: string };
  };

  describe("getRelationshipId", () => {
    it("extracts string and object relationship IDs", () => {
      assert.equal(getRelationshipId("comment-1"), "comment-1");
      assert.equal(getRelationshipId({ id: "comment-2" }), "comment-2");
      assert.equal(getRelationshipId(null), undefined);
      assert.equal(getRelationshipId({}), undefined);
    });
  });

  describe("buildCommentThreads", () => {
    it("groups replies under top-level comments", () => {
      const result = buildCommentThreads<TestComment>([
        { authorName: "Ada", id: "parent-1" },
        {
          authorName: "Grace",
          id: "reply-1",
          parentComment: "parent-1",
        },
        { authorName: "Linus", id: "parent-2" },
      ]);

      assert.deepEqual(
        result.map((thread) => ({
          id: thread.comment.id,
          replies: thread.replies.map((reply) => reply.id),
        })),
        [
          { id: "parent-1", replies: ["reply-1"] },
          { id: "parent-2", replies: [] },
        ],
      );
    });

    it("does not render orphan replies as top-level comments", () => {
      const result = buildCommentThreads<TestComment>([
        {
          authorName: "Grace",
          id: "reply-1",
          parentComment: "missing-parent",
        },
      ]);

      assert.deepEqual(result, []);
    });

    it("does not render replies to replies as another nested level", () => {
      const result = buildCommentThreads<TestComment>([
        { authorName: "Ada", id: "parent-1" },
        {
          authorName: "Grace",
          id: "reply-1",
          parentComment: "parent-1",
        },
        {
          authorName: "Katherine",
          id: "reply-2",
          parentComment: "reply-1",
        },
      ]);

      assert.deepEqual(result[0]?.replies.map((reply) => reply.id), ["reply-1"]);
    });
  });
  ```

- [ ] **Step 2: Run the focused test**

  Run: `node --test lib/comment-replies.test.ts`

  Expected: FAIL because `lib/comment-replies.ts` does not exist.

### Task 2: Implement thread-builder helpers

**Files:**

- Create: `lib/comment-replies.ts`

- [ ] **Step 1: Add minimal pure helpers**

  ```ts
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
  ```

- [ ] **Step 2: Verify focused helper tests pass**

  Run: `node --test lib/comment-replies.test.ts`

  Expected: PASS.

## Chunk 2: Request Validation

### Task 3: Add failing validation tests for optional parent IDs

**Files:**

- Modify: `lib/comment-validation.test.ts`

- [ ] **Step 1: Add tests**

  Add cases next to the existing valid-input test:

  ```ts
  it("accepts optional parent comment IDs for replies", () => {
    const result = validateCommentInput({
      authorName: "Ada",
      body: "Reply body",
      parentCommentId: " parent-comment-id ",
      postSlug: "hello-world",
      website: "",
    });

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.value.parentCommentId, "parent-comment-id");
    }
  });

  it("omits blank parent comment IDs for top-level comments", () => {
    const result = validateCommentInput({
      authorName: "Ada",
      body: "Top-level body",
      parentCommentId: " ",
      postSlug: "hello-world",
      website: "",
    });

    assert.equal(result.ok, true);

    if (result.ok) {
      assert.equal(result.value.parentCommentId, undefined);
    }
  });
  ```

- [ ] **Step 2: Run the focused test**

  Run: `node --test lib/comment-validation.test.ts`

  Expected: FAIL because `parentCommentId` is not returned yet.

### Task 4: Extend comment input validation

**Files:**

- Modify: `lib/comment-validation.ts`

- [ ] **Step 1: Add optional `parentCommentId`**

  Update the input and valid value types:

  ```ts
  type CommentInput = {
    authorName?: unknown;
    body?: unknown;
    parentCommentId?: unknown;
    postSlug?: unknown;
    website?: unknown;
  };

  type ValidCommentInput = {
    authorName: string;
    body: string;
    parentCommentId?: string;
    postSlug: string;
    website: string;
  };
  ```

  In `validateCommentInput`, parse and return it:

  ```ts
  const parentCommentId = asString(input.parentCommentId);
  ```

  ```ts
  value: {
    authorName,
    body,
    parentCommentId: parentCommentId || undefined,
    postSlug,
    website,
  },
  ```

- [ ] **Step 2: Verify validation tests pass**

  Run: `node --test lib/comment-validation.test.ts`

  Expected: PASS.

## Chunk 3: Payload Schema And Parent Guard

### Task 5: Add parent relationship and collection-level depth guard

**Files:**

- Modify: `collections/Comments.ts`

- [ ] **Step 1: Import hook type and relationship helper**

  Add:

  ```ts
  import type {
    CollectionBeforeValidateHook,
    CollectionConfig,
  } from "payload";

  import type { Comment } from "../payload-types.ts";
  import { getRelationshipId } from "../lib/comment-replies.ts";
  ```

  Replace the existing `CollectionConfig` import instead of adding a duplicate.

- [ ] **Step 2: Add parent validation hook**

  Add above `export const Comments`:

  ```ts
  const validateCommentParent: CollectionBeforeValidateHook<Comment> = async ({
    data,
    operation,
    originalDoc,
    req,
  }) => {
    const parentCommentId = getRelationshipId(
      data?.parentComment ?? originalDoc?.parentComment,
    );

    if (!parentCommentId) {
      return data;
    }

    if (operation === "update" && originalDoc?.id === parentCommentId) {
      throw new Error("A comment cannot reply to itself.");
    }

    const postId = getRelationshipId(data?.post ?? originalDoc?.post);

    if (!postId) {
      return data;
    }

    const parentComment = await req.payload.findByID({
      collection: "comments",
      depth: 0,
      id: parentCommentId,
      overrideAccess: true,
    });

    if (getRelationshipId(parentComment.post) !== postId) {
      throw new Error("Reply parent must belong to the same post.");
    }

    if (getRelationshipId(parentComment.parentComment)) {
      throw new Error("Replies cannot have replies.");
    }

    return data;
  };
  ```

  If TypeScript reports that `parentComment` is missing before type generation,
  temporarily type the hook as `CollectionBeforeValidateHook` and restore the
  generated `Comment` generic after `pnpm generate:types`.

- [ ] **Step 3: Register the hook**

  Extend the existing hooks block:

  ```ts
  hooks: {
    beforeValidate: [validateCommentParent],
    afterChange: [revalidateCommentAfterChange],
    afterDelete: [revalidateCommentAfterDelete],
  },
  ```

- [ ] **Step 4: Add the `parentComment` field**

  Add after `post`:

  ```ts
  {
    name: "parentComment",
    type: "relationship",
    relationTo: "comments",
    index: true,
  },
  ```

### Task 6: Regenerate Payload generated files

**Files:**

- Modify: `payload-types.ts`
- Maybe modify: `app/(payload)/admin/importMap.js`

- [ ] **Step 1: Regenerate import map**

  Run: `pnpm generate:importmap`

  Expected: command exits 0. It may or may not change
  `app/(payload)/admin/importMap.js`.

- [ ] **Step 2: Regenerate types**

  Run: `pnpm generate:types`

  Expected: command exits 0 and `payload-types.ts` includes
  `parentComment?: (string | null) | Comment`.

- [ ] **Step 3: Verify generated relationship**

  Run: `rg -n "parentComment" payload-types.ts collections/Comments.ts`

  Expected: matches in `collections/Comments.ts` and `payload-types.ts`.

## Chunk 4: Public Submit Path

### Task 7: Validate reply targets in the comments endpoint

**Files:**

- Modify: `app/(site)/api/comments/route.ts`

- [ ] **Step 1: Import relationship helper**

  Add:

  ```ts
  import { getRelationshipId } from "@/lib/comment-replies";
  ```

- [ ] **Step 2: Add a local parent resolver**

  Add near the other local helpers:

  ```ts
  async function resolveReplyParent({
    parentCommentId,
    payload,
    postId,
  }: {
    parentCommentId: string;
    payload: Awaited<ReturnType<typeof getPayloadClient>>;
    postId: string;
  }) {
    const parentComment = await payload
      .findByID({
        collection: "comments",
        depth: 0,
        id: parentCommentId,
        overrideAccess: true,
      })
      .catch(() => null);

    if (!parentComment) {
      return { message: "Parent comment is invalid.", ok: false as const };
    }

    if (parentComment.status !== "approved") {
      return { message: "Parent comment is invalid.", ok: false as const };
    }

    if (getRelationshipId(parentComment.post) !== postId) {
      return { message: "Parent comment is invalid.", ok: false as const };
    }

    if (getRelationshipId(parentComment.parentComment)) {
      return { message: "Cannot reply to a reply.", ok: false as const };
    }

    return { ok: true as const, parentCommentId: parentComment.id };
  }
  ```

- [ ] **Step 3: Resolve optional parent after post lookup**

  After `post` is found and before the rate-limit check:

  ```ts
  let parentComment: string | undefined;

  if (input.value.parentCommentId) {
    const parentResult = await resolveReplyParent({
      parentCommentId: input.value.parentCommentId,
      payload,
      postId: post.id,
    });

    if (!parentResult.ok) {
      return NextResponse.json(
        { message: parentResult.message },
        { status: 400 },
      );
    }

    parentComment = parentResult.parentCommentId;
  }
  ```

- [ ] **Step 4: Include `parentComment` in create data only when present**

  Replace the create `data` object with a value assembled before the call:

  ```ts
  const commentData = {
    authorName: input.value.authorName,
    body: input.value.body,
    ipHash,
    ...(parentComment ? { parentComment } : {}),
    post: post.id,
    status: "pending" as const,
    userAgentHash,
  };
  ```

  Then pass `data: commentData`.

- [ ] **Step 5: Verify route compiles through tests later**

  Do not add route-level mocks unless the implementation discovers a clean
  existing pattern. This endpoint depends on Payload and is covered by build plus
  manual smoke checks in this repo.

## Chunk 5: Public Read And UI

### Task 8: Ensure approved comment reads include parent IDs

**Files:**

- Modify: `lib/comments.ts`

- [ ] **Step 1: Keep approved-only query**

  Keep the existing `post equals postId` and `status equals approved` filters.

- [ ] **Step 2: Confirm relationship shape**

  Keep `depth: 0` unless implementation needs populated parent data. The thread
  builder only needs the parent ID, and `depth: 0` avoids unnecessary data.

### Task 9: Extend `CommentForm` for replies

**Files:**

- Modify: `components/comment-form.tsx`

- [ ] **Step 1: Extend props**

  ```ts
  type CommentFormProps = {
    parentCommentId?: string;
    postSlug: string;
    submitLabel?: string;
    successMessage?: string;
  };
  ```

- [ ] **Step 2: Include optional parent in the request body**

  In the JSON body sent to `/api/comments`, add:

  ```ts
  parentCommentId,
  ```

- [ ] **Step 3: Make labels reusable without changing the default form**

  Use defaults:

  ```ts
  export function CommentForm({
    parentCommentId,
    postSlug,
    submitLabel = "Submit comment",
    successMessage = "Comment submitted for moderation.",
  }: CommentFormProps) {
  ```

  Use `submitLabel` for the non-submitting button text and `successMessage` as
  the success fallback.

- [ ] **Step 4: Add a small reply toggle in the same client file**

  Export:

  ```tsx
  type ReplyFormProps = {
    parentCommentId: string;
    postSlug: string;
  };

  export function ReplyForm({ parentCommentId, postSlug }: ReplyFormProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="mt-4">
        <button
          className="text-sm font-medium text-zinc-700 underline-offset-4 hover:underline"
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
  ```

  Keep the component simple. Do not add animations or extra state management.

### Task 10: Render two-level comment threads

**Files:**

- Modify: `components/comments-section.tsx`

- [ ] **Step 1: Import new helpers/components**

  ```ts
  import { buildCommentThreads } from "@/lib/comment-replies";

  import { CommentForm, ReplyForm } from "./comment-form";
  ```

- [ ] **Step 2: Build threads after loading comments**

  ```ts
  const comments = await getApprovedCommentsForPost(postId);
  const threads = buildCommentThreads(comments);
  ```

- [ ] **Step 3: Render top-level comments and replies**

  Replace the current flat `comments.map` block with `threads.map`. Keep the
  current top-level article style, add `ReplyForm` below the top-level body, and
  render replies in a nested container:

  ```tsx
  {threads.map((thread) => (
    <article className="border-b border-zinc-200 pb-6" key={thread.comment.id}>
      {/* existing top-level author/date/body markup */}
      <ReplyForm parentCommentId={thread.comment.id} postSlug={postSlug} />
      {thread.replies.length > 0 ? (
        <div className="mt-6 space-y-5 border-l border-zinc-200 pl-5">
          {thread.replies.map((reply) => (
            <article key={reply.id}>
              {/* same author/date/body markup, no ReplyForm */}
            </article>
          ))}
        </div>
      ) : null}
    </article>
  ))}
  ```

  It is acceptable to extract a tiny local `CommentBody` component inside
  `comments-section.tsx` if this avoids duplicate author/date/body markup.

- [ ] **Step 4: Preserve empty state**

  Use `threads.length > 0` for the list check. An orphan-only result should show
  the existing empty state rather than rendering orphan replies.

## Chunk 6: Docs And Verification

### Task 11: Add README manual checks

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Extend the comment moderation checklist**

  Add steps for:

  - submit a reply to an approved top-level comment;
  - verify the reply is pending in `/admin`;
  - verify the pending reply is hidden publicly;
  - approve the reply;
  - verify it renders under the parent;
  - verify no reply form appears under replies;
  - verify a reply-to-reply API request is rejected.

### Task 12: Run final verification

- [ ] **Step 1: Run focused unit tests**

  Run:

  ```bash
  node --test lib/comment-replies.test.ts lib/comment-validation.test.ts lib/comment-rate-limit.test.ts
  ```

  Expected: PASS.

- [ ] **Step 2: Run related pure helper tests**

  Run:

  ```bash
  node --test lib/pagination.test.ts lib/search.test.ts lib/rss.test.ts lib/revalidation.test.ts lib/analytics.test.ts lib/comment-validation.test.ts lib/comment-rate-limit.test.ts lib/site-settings.test.ts
  ```

  Expected: PASS.

- [ ] **Step 3: Regenerate Payload artifacts**

  Run:

  ```bash
  pnpm generate:importmap
  pnpm generate:types
  ```

  Expected: both commands exit 0.

- [ ] **Step 4: Run static checks and build**

  Run:

  ```bash
  pnpm lint
  pnpm build
  git diff --check
  ```

  Expected: all commands exit 0.

- [ ] **Step 5: Manual smoke checks**

  With MongoDB and `pnpm dev` running:

  1. Open a published post with an approved top-level comment.
  2. Submit a top-level comment and confirm it is pending.
  3. Submit a reply to the approved top-level comment and confirm it is pending.
  4. Confirm pending comments/replies do not render publicly.
  5. Approve the reply in `/admin`.
  6. Reopen the post and confirm the reply renders under the parent.
  7. Confirm there is no reply form under the reply.
  8. POST a reply using a reply ID as `parentCommentId` and confirm `400`.

## Acceptance Checklist

- [ ] `Comments` has optional `parentComment`.
- [ ] Existing top-level comment submission still works.
- [ ] Public replies can target approved top-level comments on the same post.
- [ ] Public replies are created as `pending`.
- [ ] Public replies to replies are rejected.
- [ ] Public replies to comments from another post are rejected.
- [ ] Approved replies render under the approved parent.
- [ ] Orphan replies are not rendered as top-level comments.
- [ ] Rate limiting applies to top-level comments and replies.
- [ ] README explains the manual reply moderation flow.
- [ ] `node --test` focused and related suites pass.
- [ ] `pnpm lint` passes.
- [ ] `pnpm build` passes.
- [ ] `git diff --check` passes.
