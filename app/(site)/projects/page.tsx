import type { Metadata } from "next";

import { ProjectCard } from "@/components/project-card";
import { SiteHeader } from "@/components/site-header";
import { getPublishedProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects | Personal Engineering Blog",
  description: "Selected engineering projects from the author.",
};

export const revalidate = 3600;

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-4xl font-semibold text-zinc-950 dark:text-zinc-100">Projects</h1>
        <p className="mt-4 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Selected work, experiments, and engineering case studies.
        </p>
        {projects.length > 0 ? (
          <div className="mt-8 bg-white px-6 dark:bg-zinc-900">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="mt-10 border border-dashed border-zinc-300 bg-white p-6 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            No published projects yet.
          </p>
        )}
      </main>
    </div>
  );
}
