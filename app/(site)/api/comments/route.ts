import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

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

    await payload.create({
      collection: "comments",
      data: {
        authorName: input.value.authorName,
        body: input.value.body,
        ipHash: hashValue(getClientIp(request)),
        post: post.id,
        status: "pending",
        userAgentHash: hashValue(request.headers.get("user-agent")),
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
