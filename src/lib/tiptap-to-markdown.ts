interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  marks?: { type: string }[];
  attrs?: Record<string, unknown>;
  text?: string;
}

function serializeInline(nodes: TipTapNode[] | undefined): string {
  if (!nodes) return "";

  return nodes
    .map((node) => {
      if (node.type === "text" && node.text !== undefined) {
        let text = node.text;
        const marks = node.marks || [];

        // Apply marks in reverse order (outermost first)
        for (let i = marks.length - 1; i >= 0; i--) {
          const mark = marks[i];
          switch (mark.type) {
            case "bold":
              text = `**${text}**`;
              break;
            case "italic":
              text = `*${text}*`;
              break;
            case "code":
              text = `\`${text}\``;
              break;
            case "strike":
              text = `~~${text}~~`;
              break;
          }
        }

        return text;
      }

      // Handle hardBreak
      if (node.type === "hardBreak") {
        return "  \n";
      }

      return "";
    })
    .join("");
}

function serializeNode(node: TipTapNode): string {
  const content = serializeInline(node.content);

  switch (node.type) {
    case "heading": {
      const level = (node.attrs?.level as number) || 1;
      return `${"#".repeat(level)} ${content}\n`;
    }

    case "paragraph":
      return `${content}\n`;

    case "bulletList": {
      if (!node.content) return "";
      return (
        node.content
          .map((item) => `- ${serializeInline(item.content)}`)
          .join("\n") + "\n"
      );
    }

    case "orderedList": {
      if (!node.content) return "";
      return (
        node.content
          .map(
            (item, index) => `${index + 1}. ${serializeInline(item.content)}`
          )
          .join("\n") + "\n"
      );
    }

    case "blockquote": {
      if (!node.content) return "";
      const lines = serializeBlockContent(node.content)
        .split("\n")
        .filter(Boolean);
      return lines.map((line) => `> ${line}`).join("\n") + "\n";
    }

    case "codeBlock": {
      const language = node.attrs?.language || "";
      const code = serializeInline(node.content);
      return `\`\`\`${language}\n${code}\n\`\`\`\n`;
    }

    case "horizontalRule":
      return "---\n";

    case "hardBreak":
      return "  \n";

    default:
      return content ? `${content}\n` : "";
  }
}

function serializeBlockContent(nodes: TipTapNode[] | undefined): string {
  if (!nodes) return "";
  return nodes.map((node) => serializeNode(node)).join("");
}

export function jsonToMarkdown(json: unknown): string {
  if (
    !json ||
    typeof json !== "object" ||
    !("type" in json) ||
    (json as TipTapNode).type !== "doc"
  ) {
    return "";
  }

  const doc = json as TipTapNode;
  return serializeBlockContent(doc.content).trimEnd() + "\n";
}
