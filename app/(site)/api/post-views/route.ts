import { NextResponse } from "next/server";

import { getUtcDateKey, hashMetricVisitor } from "@/lib/post-metrics";
import { recordPostView } from "@/lib/post-metrics-service";
import { getPayloadClient } from "@/lib/payload";

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

function getPostSlug(body: Record<string, unknown>) {
  const postSlug = body.postSlug;

  if (typeof postSlug !== "string") {
    return undefined;
  }

  const trimmedPostSlug = postSlug.trim();

  return trimmedPostSlug || undefined;
}

export async function POST(request: Request) {
  const body = await parseRequestJson(request);

  if (!body) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const postSlug = getPostSlug(body);

  if (!postSlug) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  try {
    const payload = await getPayloadClient();
    const postResult = await payload.find({
      collection: "posts",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          {
            slug: {
              equals: postSlug,
            },
          },
          {
            status: {
              equals: "published",
            },
          },
        ],
      },
    });
    const post = postResult.docs[0];

    if (!post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    const viewedAt = new Date();
    const dateKey = getUtcDateKey(viewedAt);
    const visitorHash = hashMetricVisitor({
      dateKey,
      ip: getClientIp(request),
      postId: post.id,
      secret: process.env.PAYLOAD_SECRET || "",
      userAgent: request.headers.get("user-agent"),
    });

    await recordPostView({
      payload,
      postId: post.id,
      viewedAt,
      visitorHash,
    });

    return NextResponse.json({ recorded: true });
  } catch {
    return NextResponse.json(
      { message: "Could not record post view." },
      { status: 500 },
    );
  }
}
