import type { ReactNode } from "react";
import type { BundledLanguage } from "shiki";

import { CodeBlock, CodeBlockTitle } from "@/components/chatcn/ai/codeblock";
import { getCodeBlockFields } from "@/lib/rich-text-code-block";

type LexicalTextNode = {
  text?: string;
  format?: number | string;
  type: "text";
};

type LexicalNode = {
  children?: LexicalNode[];
  direction?: string;
  format?: number | string;
  indent?: number;
  tag?: string;
  text?: string;
  type?: string;
  version?: number;
};

type LexicalContent = {
  root?: {
    children?: LexicalNode[];
  };
};

function hasFormat(format: number | string | undefined, bit: number, name: string) {
  if (typeof format === "number") {
    return (format & bit) === bit;
  }

  return typeof format === "string" && format.includes(name);
}

function renderText(node: LexicalTextNode, key: string) {
  let content: ReactNode = node.text || "";

  if (hasFormat(node.format, 16, "code")) {
    content = (
      <code
        className="rich-code"
        key={`${key}-code`}
      >
        {content}
      </code>
    );
  }
  if (hasFormat(node.format, 1, "bold")) {
    content = <strong key={`${key}-bold`}>{content}</strong>;
  }
  if (hasFormat(node.format, 2, "italic")) {
    content = <em key={`${key}-italic`}>{content}</em>;
  }
  if (hasFormat(node.format, 8, "underline")) {
    content = <u key={`${key}-underline`}>{content}</u>;
  }

  return <span key={key}>{content}</span>;
}

function renderChildren(nodes: LexicalNode[] | undefined, key: string) {
  return (nodes || []).map((node, index) => renderNode(node, `${key}-${index}`));
}

function renderNode(node: LexicalNode, key: string): ReactNode {
  if (node.type === "text") {
    return renderText(node as LexicalTextNode, key);
  }

  const codeBlock = getCodeBlockFields(node);

  if (codeBlock) {
    const language = (codeBlock.language || "plaintext") as BundledLanguage;

    return (
      <CodeBlock
        className="rich-code-panel"
        code={codeBlock.code}
        height="480"
        key={key}
        lang={language}
        theme="github-dark-default"
      >
        <CodeBlockTitle lang={codeBlock.language}>
          {codeBlock.languageLabel || "Code"}
        </CodeBlockTitle>
      </CodeBlock>
    );
  }

  const children = renderChildren(node.children, key);

  switch (node.type) {
    case "heading": {
      if (node.tag === "h2") {
        return (
          <h2 className="card-title mt-10" key={key}>
            {children}
          </h2>
        );
      }

      return (
        <h3 className="rich-heading" key={key}>
          {children}
        </h3>
      );
    }
    case "list": {
      const isOrdered = node.tag === "ol";
      const className = "my-6 ml-6 space-y-2";

      return isOrdered ? (
        <ol className={`${className} list-decimal`} key={key}>
          {children}
        </ol>
      ) : (
        <ul className={`${className} list-disc`} key={key}>
          {children}
        </ul>
      );
    }
    case "listitem":
      return <li key={key}>{children}</li>;
    case "quote":
      return (
        <blockquote
          className="body-copy rich-quote my-6"
          key={key}
        >
          {children}
        </blockquote>
      );
    case "paragraph":
      return (
        <p className="body-copy my-5 leading-8" key={key}>
          {children}
        </p>
      );
    default:
      return children.length ? <div key={key}>{children}</div> : null;
  }
}

export function RichText({ content }: { content: unknown }) {
  const root = (content as LexicalContent | null)?.root;
  const children = root?.children || [];

  if (children.length === 0) {
    return null;
  }

  return <div className="mt-8">{renderChildren(children, "root")}</div>;
}
