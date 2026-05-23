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
    <article className="border-b border-zinc-200 py-8">
      <MediaImage
        className="relative mb-5 aspect-[16/9] overflow-hidden bg-zinc-100"
        media={project.coverImage}
        sizes="(min-width: 768px) 720px, 100vw"
      />
      <h2 className="text-2xl font-semibold text-zinc-950">
        <Link className="hover:text-zinc-700" href={`/projects/${project.slug}`}>
          {project.title}
        </Link>
      </h2>
      <p className="mt-3 max-w-2xl text-zinc-600">{project.summary}</p>
      {stack.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
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
      <ProjectLinks demoUrl={project.demoUrl} repositoryUrl={project.repositoryUrl} />
    </article>
  );
}
