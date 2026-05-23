import type { Metadata } from "next";

import { MediaImage } from "@/components/media-image";
import { ProjectLinks } from "@/components/project-links";
import { RichText } from "@/components/rich-text";
import { SiteHeader } from "@/components/site-header";
import { getMediaUrl } from "@/lib/media";
import { getPublishedProjectBySlug } from "@/lib/projects";

type Args = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

function getStack(project: Awaited<ReturnType<typeof getPublishedProjectBySlug>>) {
  return (project.stack || [])
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name));
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  const coverUrl = getMediaUrl(project.coverImage);

  return {
    title: project.seoTitle || project.title,
    description: project.seoDescription || project.summary,
    openGraph: {
      title: project.seoTitle || project.title,
      description: project.seoDescription || project.summary,
      images: coverUrl ? [{ url: coverUrl }] : undefined,
    },
  };
}

export default async function ProjectPage({ params }: Args) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  const stack = getStack(project);

  return (
    <div className="min-h-screen bg-zinc-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <article className="bg-white px-6 py-10">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Project
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-950">
            {project.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-zinc-600">
            {project.summary}
          </p>
          <MediaImage
            className="relative mt-8 aspect-[16/9] overflow-hidden bg-zinc-100"
            media={project.coverImage}
            priority
            sizes="(min-width: 768px) 768px, 100vw"
          />
          {stack.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {stack.map((item) => (
                <span
                  className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600"
                  key={item}
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          <ProjectLinks
            demoUrl={project.demoUrl}
            repositoryUrl={project.repositoryUrl}
          />
          <RichText content={project.description} />
        </article>
      </main>
    </div>
  );
}
