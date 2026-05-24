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
    <div className="action-row mt-5">
      {validLinks.map((link) => (
        <a
          className="action-link-compact action-secondary"
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
