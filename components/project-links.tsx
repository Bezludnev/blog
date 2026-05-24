type Props = {
  demoUrl?: null | string;
  repositoryUrl?: null | string;
};

export function ProjectLinks({ demoUrl, repositoryUrl }: Props) {
  if (!demoUrl && !repositoryUrl) {
    return null;
  }

  return (
    <div className="action-row mt-5">
      {demoUrl ? (
        <a
          className="action-link-compact action-primary"
          href={demoUrl}
          rel="noreferrer"
          target="_blank"
        >
          Live demo
        </a>
      ) : null}
      {repositoryUrl ? (
        <a
          className="action-link-compact action-secondary"
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
