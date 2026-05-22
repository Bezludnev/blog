import type { Metadata } from "next";

import { PostCard } from "@/components/post-card";
import { SiteHeader } from "@/components/site-header";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Blog | MConverter.eu",
  description: "Published notes from MConverter.eu.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-zinc-950">Blog</h1>
        <p className="mt-4 max-w-2xl text-zinc-600">
          Published notes from the CMS.
        </p>
        {posts.length > 0 ? (
          <div className="mt-8 bg-white px-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-10 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600">
            No published posts yet.
          </p>
        )}
      </main>
    </div>
  );
}
