type Props = {
  demoUrl?: null | string;
  repositoryUrl?: null | string;
};

export function ProjectLinks({ demoUrl, repositoryUrl }: Props) {
  if (!demoUrl && !repositoryUrl) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium">
      {demoUrl ? (
        <a
          className="rounded bg-zinc-950 px-3 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
          href={demoUrl}
          rel="noreferrer"
          target="_blank"
        >
          Live demo
        </a>
      ) : null}
      {repositoryUrl ? (
        <a
          className="rounded border border-zinc-300 px-3 py-2 text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
          href={repositoryUrl}
          rel="noreferrer"
          target="_blank"
        >
          Repository
        </a>
      ) : null}
    </div>
  );
}
