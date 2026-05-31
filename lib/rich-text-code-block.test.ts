import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CODE_BLOCK_LANGUAGES,
  getCodeBlockFields,
} from "./rich-text-code-block.ts";

describe("CODE_BLOCK_LANGUAGES", () => {
  it("includes the post editor code block languages", () => {
    assert.deepEqual(Object.keys(CODE_BLOCK_LANGUAGES), [
      "plaintext",
      "typescript",
      "javascript",
      "tsx",
      "jsx",
      "go",
      "yaml",
      "css",
      "html",
      "json",
      "shell",
      "sql",
    ]);
  });
});

describe("getCodeBlockFields", () => {
  it("reads Payload Lexical CodeBlock fields", () => {
    assert.deepEqual(
      getCodeBlockFields({
        type: "block",
        fields: {
          blockType: "Code",
          code: "package main\n\nfunc main() {}\n",
          language: "go",
        },
      }),
      {
        code: "package main\n\nfunc main() {}\n",
        language: "go",
        languageLabel: "Golang",
      },
    );
  });

  it("ignores non-code blocks", () => {
    assert.equal(
      getCodeBlockFields({
        type: "block",
        fields: {
          blockType: "Banner",
          content: "Note",
        },
      }),
      null,
    );
  });
});
