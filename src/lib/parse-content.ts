import type { JSONContent } from "@tiptap/react";

function parseInline(text: string): JSONContent[] {
  const nodes: JSONContent[] = [];
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({ type: "text", text: text.slice(lastIndex, match.index) });
    }

    if (match[2]) {
      nodes.push({
        type: "text",
        text: match[2],
        marks: [{ type: "bold" }, { type: "italic" }],
      });
    } else if (match[3]) {
      nodes.push({
        type: "text",
        text: match[3],
        marks: [{ type: "bold" }],
      });
    } else if (match[4]) {
      nodes.push({
        type: "text",
        text: match[4],
        marks: [{ type: "italic" }],
      });
    } else if (match[5]) {
      nodes.push({
        type: "text",
        text: match[5],
        marks: [{ type: "code" }],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: "text", text: text.slice(lastIndex) });
  }

  return nodes.length > 0
    ? nodes
    : [{ type: "text", text }];
}

function parseMarkdown(text: string): JSONContent {
  const lines = text.split("\n");
  const content: JSONContent[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      content.push({
        type: "heading",
        attrs: { level: 3 },
        content: parseInline(line.slice(4)),
      });
      i++;
    } else if (line.startsWith("## ")) {
      content.push({
        type: "heading",
        attrs: { level: 2 },
        content: parseInline(line.slice(3)),
      });
      i++;
    } else if (line.startsWith("# ")) {
      content.push({
        type: "heading",
        attrs: { level: 1 },
        content: parseInline(line.slice(2)),
      });
      i++;
    } else if (line.match(/^[-*]\s/)) {
      const items: JSONContent[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInline(lines[i].replace(/^[-*]\s/, "")),
            },
          ],
        });
        i++;
      }
      content.push({ type: "bulletList", content: items });
    } else if (line.match(/^\d+\.\s/)) {
      const items: JSONContent[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInline(
                lines[i].replace(/^\d+\.\s/, "")
              ),
            },
          ],
        });
        i++;
      }
      content.push({ type: "orderedList", content: items });
    } else if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      content.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: parseInline(quoteLines.join("\n")),
          },
        ],
      });
    } else if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      content.push({
        type: "codeBlock",
        attrs: { language: lang || null },
        content: [{ type: "text", text: codeLines.join("\n") }],
      });
      i++;
    } else if (line.trim() === "") {
      i++;
    } else {
      const paraLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("#") && !lines[i].match(/^[-*]\s/) && !lines[i].match(/^\d+\.\s/) && !lines[i].startsWith("> ") && !lines[i].startsWith("```")) {
        paraLines.push(lines[i]);
        i++;
      }
      content.push({
        type: "paragraph",
        content: parseInline(paraLines.join("\n")),
      });
    }
  }

  return { type: "doc", content };
}

function parsePlainText(text: string): JSONContent {
  const paragraphs = text.split(/\n{2,}/);
  return {
    type: "doc",
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: [{ type: "text", text: p.replace(/\n/g, " ") }],
    })),
  };
}

export function parseFileContent(
  filename: string,
  text: string
): JSONContent {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "md") return parseMarkdown(text);
  return parsePlainText(text);
}
