import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  getRevalidationPathsForTarget,
  isRevalidationSecretValid,
} from "@/lib/revalidation";

async function parseRequestJson(request: Request) {
  try {
    const body = await request.json();

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return null;
    }

    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const body = await parseRequestJson(request);

  if (!body) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  if (!process.env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { message: "Revalidation is not configured." },
      { status: 500 },
    );
  }

  if (
    !isRevalidationSecretValid(
      typeof body.secret === "string" ? body.secret : undefined,
      process.env.REVALIDATION_SECRET,
    )
  ) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const paths = getRevalidationPathsForTarget(body);

  if (!paths) {
    return NextResponse.json(
      { message: "Unknown revalidation target." },
      { status: 400 },
    );
  }

  try {
    for (const path of paths) {
      revalidatePath(path);
    }
  } catch {
    return NextResponse.json(
      { message: "Could not revalidate." },
      { status: 500 },
    );
  }

  return NextResponse.json({ paths, revalidated: true });
}
