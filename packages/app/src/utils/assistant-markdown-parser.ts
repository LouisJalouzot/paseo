import type MarkdownIt from "markdown-it";
import { createMarkdownParser } from "@/utils/markdown-parser";
import { markdownMath } from "./markdown-math";

export function createAssistantMarkdownParser(renderMath = false): MarkdownIt {
  const parser = createMarkdownParser({ linkify: true });
  if (renderMath) {
    parser.use(markdownMath);
  }
  const defaultValidateLink = parser.validateLink.bind(parser);

  // Assistant messages are the only surface allowed to link into the
  // filesystem. Every other parser keeps markdown-it's stricter default.
  parser.validateLink = (url: string) =>
    url.trim().toLowerCase().startsWith("file://") || defaultValidateLink(url);

  return parser;
}
