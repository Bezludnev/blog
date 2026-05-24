import Link from "next/link";

import { MediaImage } from "./media-image";
import { ProjectLinks } from "./project-links";
import type { Project } from "../payload-types";

function getStack(project: Project) {
  return (project.stack || [])
    .map((item) => item.name)
    .filter((name): name is string => Boolean(name));
}

export function ProjectCard({ project }: { project: Project }) {
  const stack = getStack(project);

  return (
    <article className="border-b border-zinc-200 py-8 dark:border-zinc-800">
      <MediaImage
        className="relative mb-5 aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800"
        media={project.coverImage}
        sizes="(min-width: 768px) 720px, 100vw"
      />
      <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-100">
        <Link className="hover:text-zinc-700 dark:hover:text-zinc-300" href={`/projects/${project.slug}`}>
          {project.title}
        </Link>
      </h2>
      <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">{project.summary}</p>
      {stack.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {stack.map((item) => (
            <span
              className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              key={item}
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
      <ProjectLinks demoUrl={project.demoUrl} repositoryUrl={project.repositoryUrl} />
    </article>
  );
}
