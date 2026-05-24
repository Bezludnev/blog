"use client";

import { useEffect } from "react";

export function PostViewTracker({ postSlug }: { postSlug: string }) {
  useEffect(() => {
    void fetch("/api/post-views", {
      body: JSON.stringify({ postSlug }),
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      method: "POST",
    }).catch(() => undefined);
  }, [postSlug]);

  return null;
}
