import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  buildCommentRateLimitWhere,
  getCommentRateLimitConfig,
  getCommentRateLimitWindowStart,
  isCommentRateLimitExceeded,
} from "@/lib/comment-rate-limit";
import { validateCommentInput } from "@/lib/comment-validation";
import { getPayloadClient } from "@/lib/payload";

function hashValue(value: string | null) {
  if (!value) return undefined;

  return createHash("sha256").update(value).digest("hex");
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return request.headers.get("x-real-ip");
}

async function parseRequestJson(request: Request) {
  try {
    const body = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return null;
    }

    return body;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await parseRequestJson(request);

  if (!body) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const input = validateCommentInput(body);

  if (!input.ok) {
    return NextResponse.json({ message: input.message }, { status: 400 });
  }

  if (input.value.website) {
    return NextResponse.json({ message: "Comment submitted for moderation." });
  }

  try {
    const payload = await getPayloadClient();
    const postResult = await payload.find({
      collection: "posts",
      depth: 0,
      limit: 1,
      where: {
        and: [
          {
            slug: {
              equals: input.value.postSlug,
            },
          },
          {
            status: {
              equals: "published",
            },
          },
        ],
      },
      overrideAccess: true,
    });

    const post = postResult.docs[0];

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    const ipHash = hashValue(getClientIp(request));
    const userAgentHash = hashValue(request.headers.get("user-agent"));
    const rateLimitConfig = getCommentRateLimitConfig();
    const rateLimitWhere = buildCommentRateLimitWhere({
      ipHash,
      postId: post.id,
      userAgentHash,
      windowStart: getCommentRateLimitWindowStart(
        new Date(),
        rateLimitConfig.windowSeconds,
      ),
    });

    if (rateLimitWhere) {
      const { totalDocs } = await payload.count({
        collection: "comments",
        overrideAccess: true,
        where: rateLimitWhere,
      });

      if (isCommentRateLimitExceeded(totalDocs, rateLimitConfig.max)) {
        return NextResponse.json(
          { message: "Too many comments. Try again later." },
          { status: 429 },
        );
      }
    }

    await payload.create({
      collection: "comments",
      data: {
        authorName: input.value.authorName,
        body: input.value.body,
        ipHash,
        post: post.id,
        status: "pending",
        userAgentHash,
      },
      overrideAccess: true,
    });

    return NextResponse.json({ message: "Comment submitted for moderation." });
  } catch {
    return NextResponse.json(
      { message: "Could not submit comment." },
      { status: 500 },
    );
  }
}
