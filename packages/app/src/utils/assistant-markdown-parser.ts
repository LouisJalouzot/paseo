import type MarkdownIt from "markdown-it";
import { createMarkdownParser } from "@/utils/markdown-parser";
import { enableStreamingMarkdown } from "@/utils/streaming-markdown";
import { markdownMath } from "./markdown-math";

export function createAssistantMarkdownParser(
  { streaming = false, renderMath = false }: { streaming?: boolean; renderMath?: boolean } = {},
): MarkdownIt {
  const parser = createMarkdownParser({ linkify: true });
  if (renderMath) {
    parser.use(markdownMath);
  }
  const defaultValidateLink = parser.validateLink.bind(parser);

  // Assistant messages are the only surface allowed to link into the
  // filesystem. Every other parser keeps markdown-it's stricter default.
  parser.validateLink = (url: string) =>
    url.trim().toLowerCase().startsWith("file://") || defaultValidateLink(url);

  if (streaming) {
    enableStreamingMarkdown(parser);
  }

  return parser;
}
