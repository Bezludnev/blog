import type { Metadata } from "next";

import { MediaImage } from "@/components/media-image";
import { ProjectLinks } from "@/components/project-links";
import { RichText } from "@/components/rich-text";
import { SiteHeader } from "@/components/site-header";
import { getMediaUrl } from "@/lib/media";
import { getPublishedProjectBySlug } from "@/lib/projects";
import { canonicalUrl } from "@/lib/seo";

type Args = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 3600;

function getStack(project: Awaited<ReturnType<typeof getPublishedProjectBySlug>>) {
  return (project.stack || [])
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name));
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  const coverUrl = getMediaUrl(project.coverImage);
  const url = canonicalUrl(`/projects/${project.slug}`);

  return {
    title: project.seoTitle || project.title,
    description: project.seoDescription || project.summary,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: project.seoTitle || project.title,
      description: project.seoDescription || project.summary,
      images: coverUrl ? [{ url: coverUrl }] : undefined,
      url,
    },
  };
}

export default async function ProjectPage({ params }: Args) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  const stack = getStack(project);

  return (
    <div className="site-page">
      <SiteHeader />
      <main className="site-main-narrow" data-page>
        <article className="article-panel">
          <p className="page-eyebrow">Project</p>
          <h1 className="page-title mt-3">
            {project.title}
          </h1>
          <p className="page-lede-lg">
            {project.summary}
          </p>
          <MediaImage
            className="media-frame mt-8"
            media={project.coverImage}
            priority
            sizes="(min-width: 768px) 768px, 100vw"
          />
          {stack.length > 0 ? (
            <div className="tag-row mt-6">
              {stack.map((item) => (
                <span
                  className="tag-pill"
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
