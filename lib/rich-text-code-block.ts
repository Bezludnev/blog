export const CODE_BLOCK_LANGUAGES = {
  plaintext: "Plain Text",
  typescript: "TypeScript",
  javascript: "JavaScript",
  tsx: "TSX",
  jsx: "JSX",
  go: "Golang",
  yaml: "YAML",
  css: "CSS",
  html: "HTML",
  json: "JSON",
  shell: "Bash",
  sql: "SQL",
} as const;

export type CodeBlockFields = {
  code: string;
  language?: string;
  languageLabel?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeLanguage(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const language = value.trim();

  if (!/^[a-z0-9_-]+$/i.test(language)) {
    return undefined;
  }

  return language;
}

function getLanguageLabel(language: string | undefined) {
  if (!language) {
    return undefined;
  }

  return CODE_BLOCK_LANGUAGES[
    language as keyof typeof CODE_BLOCK_LANGUAGES
  ] || language;
}

export function getCodeBlockFields(node: unknown): CodeBlockFields | null {
  if (!isRecord(node) || node.type !== "block" || !isRecord(node.fields)) {
    return null;
  }

  const blockType = node.fields.blockType;

  if (typeof blockType !== "string" || blockType.toLowerCase() !== "code") {
    return null;
  }

  const code = typeof node.fields.code === "string" ? node.fields.code : "";
  const language = normalizeLanguage(node.fields.language);

  return {
    code,
    language,
    languageLabel: getLanguageLabel(language),
  };
}
