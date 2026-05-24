export type SocialLink = {
  label?: null | string;
  url?: null | string;
};

type Props = {
  links?: null | SocialLink[];
};

function getValidLinks(links: Props["links"]) {
  return (links || []).flatMap((link) => {
    const label = link.label?.trim();
    const url = link.url?.trim();

    if (!label || !url) {
      return [];
    }

    return [{ label, url }];
  });
}

export function SocialLinks({ links }: Props) {
  const validLinks = getValidLinks(links);

  if (validLinks.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium">
      {validLinks.map((link) => (
        <a
          className="rounded border border-zinc-300 px-3 py-2 text-zinc-700 hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
          href={link.url}
          key={`${link.label}-${link.url}`}
          rel="noreferrer"
          target="_blank"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
