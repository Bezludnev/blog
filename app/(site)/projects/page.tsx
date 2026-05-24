import type { Metadata } from "next";

import { ProjectCard } from "@/components/project-card";
import { SiteHeader } from "@/components/site-header";
import { getPublishedProjects } from "@/lib/projects";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Projects | Personal Engineering Blog",
  description: "Selected engineering projects from the author.",
  alternates: {
    canonical: canonicalUrl("/projects"),
  },
  openGraph: {
    title: "Projects | Personal Engineering Blog",
    description: "Selected engineering projects from the author.",
    url: canonicalUrl("/projects"),
  },
};

export const revalidate = 3600;

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <div className="site-page">
      <SiteHeader />
      <main className="site-main">
        <h1 className="page-title">Projects</h1>
        <p className="page-lede">
          Selected work, experiments, and engineering case studies.
        </p>
        {projects.length > 0 ? (
          <div className="list-panel mt-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="empty-state mt-10">
            No published projects yet.
          </p>
        )}
      </main>
    </div>
  );
}
