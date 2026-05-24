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
    <article className="card-item">
      <MediaImage
        className="media-frame mb-5"
        media={project.coverImage}
        sizes="(min-width: 768px) 720px, 100vw"
      />
      <h2 className="card-title">
        <Link className="title-link" href={`/projects/${project.slug}`}>
          {project.title}
        </Link>
      </h2>
      <p className="muted-copy mt-3 max-w-2xl">{project.summary}</p>
      {stack.length > 0 ? (
        <div className="tag-row mt-4">
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
      <ProjectLinks demoUrl={project.demoUrl} repositoryUrl={project.repositoryUrl} />
    </article>
  );
}
