type SearchablePost = {
  title?: null | string;
  excerpt?: null | string;
  content?: unknown;
};

export function normalizeSearchQuery(
  value: string | string[] | undefined,
): string {
  const raw = Array.isArray(value) ? value[0] : value;

  return (raw || "").trim();
}

export function extractLexicalText(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(extractLexicalText).join(" ");
  }

  const record = value as Record<string, unknown>;
  const ownText = typeof record.text === "string" ? record.text : "";
  const childText = extractLexicalText(record.children);
  const rootText = extractLexicalText(record.root);

  return [ownText, childText, rootText].filter(Boolean).join(" ");
}

export function postMatchesSearch(post: SearchablePost, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    post.title || "",
    post.excerpt || "",
    extractLexicalText(post.content),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}
